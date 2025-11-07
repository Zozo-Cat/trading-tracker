// app/settings/security/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSupabaseClient, useSession } from "@/app/_components/Providers";

type Identity = {
    identity_id: string;
    provider: string;
    last_sign_in_at?: string | null;
};

// --- MFA/TOTP typer (vi holder dem brede så vi ikke knækker på små SDK-forskelle)
type MFATotpEnrollment = {
    id?: string; // factorId
    type?: string; // "totp"
    totp?: {
        qr_code?: string; // data:image/svg+xml;base64,… (eller png)
        secret?: string; // base32 secret
        uri?: string; // otpauth://…
    };
};
type MFAFactor = {
    id: string;
    factor_type: "totp" | string;
    friendly_name?: string | null;
    status?: "verified" | "unverified" | string;
};

export default function SecuritySettingsPage() {
    const supabase = useSupabaseClient();
    const session = useSession();

    // DEV helper: gør supabase-klienten tilgængelig i browser-console som __sb (kun i dev)
    useEffect(() => {
        if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
            (window as any).__sb = supabase;
        }
    }, [supabase]);

    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    // Password form
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [newPw2, setNewPw2] = useState("");

    // OAuth identities (fx Discord)
    const [identities, setIdentities] = useState<Identity[]>([]);

    // --- MFA state
    const [mfaSupported, setMfaSupported] = useState<boolean>(true);
    const [factors, setFactors] = useState<MFAFactor[]>([]);
    const totpFactor = useMemo(() => factors.find((f) => f.factor_type === "totp"), [factors]);

    // til aktivering
    const [enrolling, setEnrolling] = useState<MFATotpEnrollment | null>(null);
    const [otpCode, setOtpCode] = useState("");

    useEffect(() => {
        (async () => {
            if (!session?.user) return;

            // OAuth identities
            const { data } = await supabase.auth.getUser();
            const list =
                (data.user?.identities || []).map((i: any) => ({
                    identity_id: String(i.identity_id ?? i.id ?? ""),
                    provider: String(i.provider ?? ""),
                    last_sign_in_at: i.last_sign_in_at ?? null,
                })) ?? [];
            setIdentities(list);

            // MFA faktorer
            await refreshFactors();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user]);

    async function refreshFactors() {
        setError(null);
        try {
            const mfa = (supabase.auth as any).mfa;
            if (!mfa || !mfa.listFactors) {
                setMfaSupported(false);
                return;
            }
            const { data, error } = await mfa.listFactors();
            if (error) {
                // Hvis SDK findes men backend ikke har MFA slået til, giv pæn besked:
                setMfaSupported(false);
                return;
            }
            const all: MFAFactor[] = (data?.all ?? data?.factors ?? data ?? []).map((x: any) => ({
                id: String(x.id),
                factor_type: x.factor_type || x.type || "totp",
                friendly_name: x.friendly_name ?? null,
                status: x.status || "verified",
            }));
            setFactors(all);
        } catch {
            setMfaSupported(false);
        }
    }

    if (!session?.user) return <div className="p-4">Du skal være logget ind.</div>;

    /* ---------------- Password ---------------- */

    async function changePassword() {
        setMessage(null);
        setError(null);

        if (newPw.length < 8) {
            setError("Den nye adgangskode skal være mindst 8 tegn.");
            return;
        }
        if (newPw !== newPw2) {
            setError("De to nye adgangskoder matcher ikke.");
            return;
        }
        if (!session.user.email) {
            setError("Din konto har ingen e-mail tilknyttet.");
            return;
        }

        setBusy(true);
        try {
            // Reauth med nuværende kode
            const reauth = await supabase.auth.signInWithPassword({
                email: session.user.email,
                password: currentPw,
            });
            if (reauth.error) {
                setError("Nuværende adgangskode er forkert.");
                return;
            }

            const { error: upErr } = await supabase.auth.updateUser({ password: newPw });
            if (upErr) {
                setError(upErr.message || "Kunne ikke opdatere adgangskode.");
                return;
            }

            // 👇 NYT: log alle andre sessioner ud
            await supabase.auth.signOut({ scope: "others" });

            setCurrentPw("");
            setNewPw("");
            setNewPw2("");
            setMessage("Adgangskode opdateret ✔️ Andre enheder er logget ud.");
        } catch (e: any) {
            setError(e?.message || "Uventet fejl ved opdatering af adgangskode.");
        } finally {
            setBusy(false);
        }
    }

    async function sendResetEmail() {
        setMessage(null);
        setError(null);
        if (!session.user.email) {
            setError("Din konto har ingen e-mail tilknyttet.");
            return;
        }
        setBusy(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
                redirectTo: `${location.origin}/auth/callback?next=/settings/security`,
            });
            if (error) {
                setError(error.message || "Kunne ikke sende nulstillingsmail.");
                return;
            }
            setMessage("Vi har sendt en e-mail med link til at nulstille adgangskoden.");
        } catch (e: any) {
            setError(e?.message || "Uventet fejl ved afsendelse af e-mail.");
        } finally {
            setBusy(false);
        }
    }

    async function signOutOthers() {
        setMessage(null);
        setError(null);
        setBusy(true);
        try {
            // @ts-ignore – kræver supabase-js v2.44+
            const { error } = await supabase.auth.signOut({ scope: "others" });
            if (error) {
                setError(error.message || "Kunne ikke logge ud andre enheder.");
                return;
            }
            setMessage("Andre aktive sessioner er logget ud ✔️");
        } catch (e: any) {
            setError(e?.message || "Uventet fejl ved logout af andre enheder.");
        } finally {
            setBusy(false);
        }
    }

    /* ---------------- 2FA / TOTP ---------------- */

    async function startEnroll() {
        setMessage(null);
        setError(null);
        setOtpCode("");
        setEnrolling(null);
        setBusy(true);
        try {
            const mfa = (supabase.auth as any).mfa;
            if (!mfa || !mfa.enroll) {
                setMfaSupported(false);
                setError("Dit Supabase SDK understøtter ikke MFA (opgradér supabase-js).");
                return;
            }

            // Enroll TOTP – forventer data.totp.qr_code / secret / uri + factor id
            const { data, error } = await mfa.enroll({ factorType: "totp" });
            if (error) {
                setError(error.message || "Kunne ikke starte 2FA aktivering.");
                return;
            }

            const payload: MFATotpEnrollment = {
                id: data?.id ?? data?.factor?.id,
                type: data?.type ?? "totp",
                totp: {
                    qr_code: data?.totp?.qr_code,
                    secret: data?.totp?.secret,
                    uri: data?.totp?.uri || data?.totp?.uri_code,
                },
            };
            setEnrolling(payload);
        } catch (e: any) {
            setError(e?.message || "Uventet fejl ved 2FA-aktivering.");
        } finally {
            setBusy(false);
        }
    }

    async function verifyEnroll() {
        setMessage(null);
        setError(null);
        if (!enrolling?.id) {
            setError("Mangler factor-id. Start aktivering igen.");
            return;
        }
        if (!otpCode || otpCode.trim().length < 6) {
            setError("Indtast den 6-cifrede kode fra din Authenticator.");
            return;
        }
        setBusy(true);
        try {
            const mfa = (supabase.auth as any).mfa;
            if (!mfa || !mfa.verify) {
                setMfaSupported(false);
                setError("Dit Supabase SDK understøtter ikke MFA verify.");
                return;
            }
            const { error } = await mfa.verify({ factorId: enrolling.id, code: otpCode.trim() });
            if (error) {
                setError(error.message || "Koden var forkert. Prøv igen.");
                return;
            }
            setEnrolling(null);
            setOtpCode("");
            await refreshFactors();

            // 👇 NYT: skriv til profiles.has_totp = true
            await supabase.from("profiles").update({ has_totp: true }).eq("id", session.user.id);

            setMessage("2FA (TOTP) er nu aktiveret ✔️");
        } catch (e: any) {
            setError(e?.message || "Uventet fejl ved bekræftelse af 2FA.");
        } finally {
            setBusy(false);
        }
    }

    async function disableTotp() {
        if (!totpFactor?.id) return;
        setMessage(null);
        setError(null);
        setBusy(true);
        try {
            const mfa = (supabase.auth as any).mfa;
            if (!mfa || !mfa.unenroll) {
                setMfaSupported(false);
                setError("Dit Supabase SDK understøtter ikke at fjerne MFA.");
                return;
            }
            const { error } = await mfa.unenroll({ factorId: totpFactor.id });
            if (error) {
                setError(error.message || "Kunne ikke deaktivere 2FA.");
                return;
            }
            await refreshFactors();

            // 👇 NYT: skriv til profiles.has_totp = false
            await supabase.from("profiles").update({ has_totp: false }).eq("id", session.user.id);

            setMessage("2FA er deaktiveret ✔️");
        } catch (e: any) {
            setError(e?.message || "Uventet fejl ved deaktivering af 2FA.");
        } finally {
            setBusy(false);
        }
    }

    async function unlinkProvider(identity: Identity) {
        setMessage(null);
        setError(null);
        setBusy(true);
        try {
            // @ts-ignore
            const { error } = await supabase.auth.unlinkIdentity({
                provider: identity.provider,
                identity_id: identity.identity_id,
            });
            if (error) {
                setError(error.message || "Kunne ikke afbryde forbindelsen.");
                return;
            }
            setIdentities((arr) => arr.filter((i) => i.identity_id !== identity.identity_id));
            setMessage(`Forbindelsen til ${identity.provider} er afbrudt ✔️`);
        } catch (e: any) {
            setError(e?.message || "Uventet fejl ved afbrydelse af forbindelse.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Skift adgangskode */}
            <section className="rounded-2xl border border-yellow-700/40 p-4">
                <h3 className="text-lg font-semibold mb-4">Skift adgangskode</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                        <div className="mb-1 text-sm text-yellow-200/80">Nuværende adgangskode</div>
                        <input
                            type="password"
                            value={currentPw}
                            onChange={(e) => setCurrentPw(e.target.value)}
                            className="w-full rounded-md border border-yellow-700/50 bg-transparent px-3 py-2"
                            placeholder="••••••••"
                        />
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                            <div className="mb-1 text-sm text-yellow-200/80">Ny adgangskode</div>
                            <input
                                type="password"
                                value={newPw}
                                onChange={(e) => setNewPw(e.target.value)}
                                className="w-full rounded-md border border-yellow-700/50 bg-transparent px-3 py-2"
                                placeholder="Mindst 8 tegn"
                            />
                        </label>
                        <label className="block">
                            <div className="mb-1 text-sm text-yellow-200/80">Gentag ny adgangskode</div>
                            <input
                                type="password"
                                value={newPw2}
                                onChange={(e) => setNewPw2(e.target.value)}
                                className="w-full rounded-md border border-yellow-700/50 bg-transparent px-3 py-2"
                                placeholder="Gentag adgangskode"
                            />
                        </label>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                    <button
                        disabled={busy}
                        onClick={changePassword}
                        className="px-4 py-2 rounded-md bg-yellow-600 text-black hover:bg-yellow-500 disabled:opacity-60"
                    >
                        {busy ? "Gemmer..." : "Opdater adgangskode"}
                    </button>
                    <button
                        disabled={busy}
                        onClick={sendResetEmail}
                        className="px-4 py-2 rounded-md border border-yellow-700/50 hover:bg-yellow-600/10"
                    >
                        Send nulstillingsmail
                    </button>
                </div>
            </section>

            {/* 2FA / TOTP */}
            <section className="rounded-2xl border border-yellow-700/40 p-4">
                <h3 className="text-lg font-semibold mb-2">To-faktor godkendelse (2FA)</h3>

                {!mfaSupported && (
                    <p className="text-sm text-yellow-200/70">
                        Din nuværende client understøtter ikke MFA endpoints. Opgradér venligst <code>supabase-js</code> til en
                        version med <code>auth.mfa.*</code> API (TOTP).
                    </p>
                )}

                {mfaSupported && !totpFactor && !enrolling && (
                    <div className="flex items-center justify-between mt-2">
                        <div className="text-sm text-yellow-200/80">
                            Beskyt din konto med en ekstra engangskode fra en Authenticator-app (Google, Microsoft, 1Password, m.fl.).
                        </div>
                        <button
                            disabled={busy}
                            onClick={startEnroll}
                            className="px-4 py-2 rounded-md border border-yellow-700/50 hover:bg-yellow-600/10"
                        >
                            Aktiver 2FA
                        </button>
                    </div>
                )}

                {mfaSupported && enrolling && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
                        <div className="rounded-md border border-yellow-700/40 p-3 flex items-center justify-center">
                            {enrolling.totp?.qr_code ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={enrolling.totp.qr_code} alt="TOTP QR" className="max-w-full" />
                            ) : (
                                <div className="text-sm text-yellow-200/70">
                                    Scan TOTP URI i din app:
                                    <div className="mt-1 break-all text-yellow-100 text-xs">
                                        {enrolling.totp?.uri || "otpauth://…"}
                                    </div>
                                    {enrolling.totp?.secret && (
                                        <div className="mt-2">
                                            Secret: <span className="font-mono">{enrolling.totp.secret}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div>
                            <ol className="list-decimal ml-4 space-y-2 text-sm text-yellow-200/80">
                                <li>Åbn din Authenticator-app og vælg “Tilføj konto” → “Scan QR” (eller “Indtast nøgle” manuelt).</li>
                                <li>Når kontoen er tilføjet, indtast den 6-cifrede kode herunder.</li>
                            </ol>

                            <div className="mt-3 flex items-center gap-3">
                                <input
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    placeholder="6-cifret kode"
                                    className="w-44 rounded-md border border-yellow-700/50 bg-transparent px-3 py-2"
                                />
                                <button
                                    disabled={busy}
                                    onClick={verifyEnroll}
                                    className="px-4 py-2 rounded-md bg-yellow-600 text-black hover:bg-yellow-500 disabled:opacity-60"
                                >
                                    Bekræft 2FA
                                </button>
                                <button
                                    disabled={busy}
                                    onClick={() => {
                                        setEnrolling(null);
                                        setOtpCode("");
                                    }}
                                    className="px-4 py-2 rounded-md border border-yellow-700/50 hover:bg-yellow-600/10"
                                >
                                    Annullér
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {mfaSupported && totpFactor && (
                    <div className="mt-3 flex items-center justify-between">
                        <div>
                            <div className="font-medium">2FA er aktiveret</div>
                            <div className="text-sm text-yellow-200/70">
                                Factor-ID: <span className="font-mono">{totpFactor.id}</span>{" "}
                                {totpFactor.status && <>• Status: {String(totpFactor.status)}</>}
                            </div>
                        </div>
                        <button
                            disabled={busy}
                            onClick={disableTotp}
                            className="px-4 py-2 rounded-md border border-yellow-700/50 hover:bg-yellow-600/10"
                        >
                            Deaktiver 2FA
                        </button>
                    </div>
                )}
            </section>

            {/* Sessioner / OAuth */}
            <section className="rounded-2xl border border-yellow-700/40 p-4">
                <h3 className="text-lg font-semibold mb-4">Sessioner & tilknyttede konti</h3>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-yellow-700/30">
                        <div>
                            <div className="font-medium">Log ud på alle andre enheder</div>
                            <div className="text-sm text-yellow-200/70">
                                Anbefales, hvis du har mistanke om uautoriseret adgang.
                            </div>
                        </div>
                        <button
                            disabled={busy}
                            onClick={signOutOthers}
                            className="px-4 py-2 rounded-md border border-yellow-700/50 hover:bg-yellow-600/10"
                        >
                            Log ud andre enheder
                        </button>
                    </div>

                    <div className="p-3 rounded-lg border border-yellow-700/30">
                        <div className="font-medium mb-2">Tilknyttede konti (OAuth)</div>
                        {identities.length === 0 ? (
                            <div className="text-sm text-yellow-200/70">Ingen eksterne konti tilknyttet.</div>
                        ) : (
                            <ul className="divide-y divide-yellow-700/20">
                                {identities.map((id) => (
                                    <li key={id.identity_id} className="flex items-center justify-between py-2">
                                        <div>
                                            <div className="font-medium capitalize">{id.provider}</div>
                                            {id.last_sign_in_at && (
                                                <div className="text-xs text-yellow-200/60">
                                                    Senest brugt: {new Date(id.last_sign_in_at).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            disabled={busy}
                                            onClick={() => unlinkProvider(id)}
                                            className="px-3 py-1.5 rounded-md border border-yellow-700/50 hover:bg-yellow-600/10"
                                        >
                                            Afbryd forbindelse
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </section>

            {/* global feedback */}
            {(message || error) && (
                <div className="flex items-center gap-3">
                    {message && <span className="text-green-300">{message}</span>}
                    {error && <span className="text-red-400">{error}</span>}
                </div>
            )}
        </div>
    );
}
