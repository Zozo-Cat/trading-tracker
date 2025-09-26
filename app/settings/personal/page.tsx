"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import AvatarCropper from "../_components/AvatarCropper";
import { useSupabaseClient, useSession } from "@/app/_components/Providers";
import { useProfileStore } from "@/lib/profileStore";
import type { Profile, AccountLink } from "@/lib/types";

/** Felter optionelle – vi gemmer kun det, der er sat */
const schema = z.object({
    full_name: z.string().trim().optional(),
    username: z.string().trim().optional(),
    use_discord_avatar: z.boolean().optional(),
    locale: z.string().optional(),
    timezone: z.string().optional(),
    date_format: z.string().optional(),
    number_format: z.string().optional(),
    currency: z.string().optional(),
    week_start: z.string().optional(), // "monday" | "sunday"
});

export default function PersonalSettingsPage() {
    const supabase = useSupabaseClient();
    const session = useSession();
    const profile = useProfileStore((s) => s.profile);

    // ------- FORM STATE -------
    const [form, setForm] = useState<{
        full_name?: string;
        username?: string;
        use_discord_avatar?: boolean;
        locale?: string;
        timezone?: string;
        date_format?: string;
        number_format?: string;
        currency?: string;
        week_start?: string;
    }>({
        full_name: "",
        username: "",
        use_discord_avatar: false,
        locale: "da-DK",
        timezone: "Auto/Europe/Copenhagen",
        date_format: "DD-MM-YYYY",
        number_format: "1.234,56 (EU)",
        currency: "DKK",
        week_start: "monday",
    });

    // ------- DISCORD -------
    const [discord, setDiscord] = useState<AccountLink | null>(null);

    // ------- AVATAR STATES -------
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [showCrop, setShowCrop] = useState(false);
    const [avatarOverrideUrl, setAvatarOverrideUrl] = useState<string | null>(null); // optimistisk efter gem
    const [dbAvatarUrl, setDbAvatarUrl] = useState<string | null>(null); // realtime fra DB
    const fileRef = useRef<HTMLInputElement>(null);

    // ------- UI STATE -------
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Prefill fra profil
    useEffect(() => {
        if (!profile) return;
        setForm((f) => ({
            ...f,
            full_name: profile.full_name ?? "",
            username: profile.username ?? "",
            use_discord_avatar: profile.avatar_src === "discord",
            locale: profile.locale ?? f.locale ?? "da-DK",
            timezone: profile.timezone ?? f.timezone ?? "Auto/Europe/Copenhagen",
            date_format: profile.date_format ?? f.date_format ?? "DD-MM-YYYY",
            number_format: profile.number_format ?? f.number_format ?? "1.234,56 (EU)",
            currency: profile.currency ?? f.currency ?? "DKK",
            week_start: profile.week_start ?? f.week_start ?? "monday",
        }));
        setDbAvatarUrl(profile.avatar_url ?? null);
    }, [profile]);

    // Realtime: opdatér avatar når profiles ændres (så både header og denne side følger med)
    useEffect(() => {
        if (!session?.user) return;
        const channel = supabase
            .channel(`profiles:avatar:${session.user.id}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "profiles", filter: `id=eq.${session.user.id}` },
                (payload) => {
                    const next = (payload.new as any)?.avatar_url ?? null;
                    setDbAvatarUrl(next);
                }
            )
            .subscribe();
        return () => {
            channel.unsubscribe();
        };
    }, [session?.user, supabase]);

    // Aktiv avatar i UI (prioritet: Discord-valg > lokalt override > DB > default)
    const currentAvatar = useMemo(() => {
        if (form.use_discord_avatar && discord?.avatar_url) return discord.avatar_url;
        if (avatarOverrideUrl) return avatarOverrideUrl;
        if (dbAvatarUrl) return dbAvatarUrl;
        return "/images/default-avatar.png";
    }, [form.use_discord_avatar, discord, avatarOverrideUrl, dbAvatarUrl]);

    function onFile(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
            setUploadPreview(reader.result as string);
            setShowCrop(true);
        };
        reader.readAsDataURL(f);
    }

    /** Prøv public URL først; fallback til signed URL */
    async function resolveViewUrl(path: string): Promise<string> {
        const pub = supabase.storage.from("avatars").getPublicUrl(path, { transform: { width: 256, height: 256 } });
        const publicUrl = `${pub.data.publicUrl}?t=${Date.now()}`;
        try {
            const headRes = await fetch(publicUrl, { method: "HEAD" });
            if (headRes.ok) return publicUrl;
        } catch {}
        const signed = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60, {
            transform: { width: 256, height: 256 },
        });
        if (signed.error || !signed.data?.signedUrl) throw signed.error ?? new Error("Kunne ikke generere visnings-URL for avatar");
        return `${signed.data.signedUrl}&t=${Date.now()}`;
    }

    async function uploadCropped(blob: Blob): Promise<string> {
        if (!session?.user) throw new Error("Not authenticated");
        const path = `${session.user.id}/avatar.jpg`;
        const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, {
            cacheControl: "3600",
            upsert: true,
            contentType: "image/jpeg",
        });
        if (upErr) throw upErr;
        return await resolveViewUrl(path);
    }

    /** Gem KUN avatarfelter */
    async function saveAvatarOnly(nextUrl: string, src: "custom" | "discord") {
        if (!session?.user) throw new Error("Not authenticated");
        const payload: Partial<Profile> = { id: session.user.id, avatar_url: nextUrl, avatar_src: src };
        const { error: upErr } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
        if (upErr) throw upErr;
        // Optimistisk lokalt + sæt DB-state, så begge visninger opdaterer
        setAvatarOverrideUrl(nextUrl);
        setDbAvatarUrl(nextUrl);
    }

    /** Gem hele formularen (kun udfyldte/ændrede felter) */
    async function handleSaveFull() {
        setSaving(true); setMessage(null); setError(null);
        try {
            const parsed = schema.parse(form);

            const payload: Partial<Profile> = { id: session?.user?.id! };

            if (typeof parsed.full_name === "string") payload.full_name = parsed.full_name;
            if (typeof parsed.username === "string" && parsed.username.length > 0) payload.username = parsed.username;

            // avatar via Discord-valg
            if (parsed.use_discord_avatar && discord?.avatar_url) {
                payload.avatar_url = discord.avatar_url;
                payload.avatar_src = "discord" as any;
            } else if (parsed.use_discord_avatar === false && profile?.avatar_src === "discord") {
                // skifte fra discord til custom (uden nyt billede) → behold eksisterende URL, men sæt src til custom
                payload.avatar_src = "custom" as any;
            }

            // preferences
            if (parsed.locale) payload.locale = parsed.locale;
            if (parsed.timezone) payload.timezone = parsed.timezone;
            if (parsed.date_format) payload.date_format = parsed.date_format;
            if (parsed.number_format) payload.number_format = parsed.number_format;
            if (parsed.currency) payload.currency = parsed.currency;
            if (parsed.week_start) payload.week_start = parsed.week_start;

            const { error: upErr } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
            if (upErr) throw upErr;

            // Hvis vi lige satte discord-avatar, opdatér visning lokalt
            if (payload.avatar_url) {
                setAvatarOverrideUrl(payload.avatar_url);
                setDbAvatarUrl(payload.avatar_url);
            }

            setMessage("Gemt ✔️");
        } catch (e: any) {
            setError(e.message ?? "Der opstod en fejl");
        } finally {
            setSaving(false);
        }
    }

    /** Efter crop: upload + gem KUN avatar + local preview */
    async function onCropDone(blob: Blob) {
        setSaving(true); setMessage(null); setError(null);
        try {
            const url = await uploadCropped(blob);
            await saveAvatarOnly(url, "custom");
            setShowCrop(false); setUploadPreview(null);
            setMessage("Profilbillede opdateret ✔️");
        } catch (e: any) {
            setError(e.message ?? "Kunne ikke uploade/gemme avatar");
        } finally {
            setSaving(false);
        }
    }

    /** --------- DISCORD LINK (med “allerede i brug”-fejl) --------- */
    useEffect(() => {
        const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
        const search = typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "";
        const qs = new URLSearchParams(hash || search);
        const err = qs.get("error") || qs.get("error_code") || "";
        const desc = (qs.get("error_description") || "").toLowerCase();
        if (!err && !desc) return;
        const msg = `${err} ${desc}`.toLowerCase();
        if (msg.includes("already") || msg.includes("exists") || msg.includes("linked")) {
            setError("Denne Discord er allerede tilknyttet en anden profil.");
        } else {
            setError(qs.get("error_description") || qs.get("error") || "Kunne ikke forbinde Discord");
        }
    }, []);

    useEffect(() => {
        (async () => {
            if (!session?.user) return;
            const { data: userData } = await supabase.auth.getUser();
            const disc = userData.user?.identities?.find((i: any) => i.provider === "discord");
            if (!disc) return;

            const identity = disc.identity_data || {};
            const provider_user_id = disc.id as string;

            const up = await supabase.from("account_links").upsert(
                {
                    user_id: userData.user!.id,
                    provider: "discord",
                    provider_user_id,
                    username: identity.user_name ?? null,
                    avatar_url: identity.avatar_url ?? null,
                },
                { onConflict: "provider,provider_user_id" }
            );

            if (up.error) {
                const m = (up.error.message || "").toLowerCase();
                if (m.includes("duplicate") || m.includes("unique") || m.includes("permission") || m.includes("rls")) {
                    setError("Denne Discord er allerede tilknyttet en anden profil.");
                    return;
                }
                setError(up.error.message);
                return;
            }

            setDiscord({
                id: up.data?.[0]?.id ?? "temp",
                user_id: userData.user!.id,
                provider: "discord",
                provider_user_id,
                username: identity.user_name ?? null,
                avatar_url: identity.avatar_url ?? null,
                created_at: new Date().toISOString(),
            });

            setMessage("Discord forbundet ✔️ Du kan nu vælge at bruge Discord-profilbilledet.");
        })();
    }, [session, supabase]);

    async function connectDiscord() {
        setError(null); setMessage(null);
        const { error } = await supabase.auth.linkIdentity({
            provider: "discord",
            options: { redirectTo: `${location.origin}/settings/personal` },
        });
        if (error) {
            const msg = String(error.message).toLowerCase();
            if (msg.includes("already") || msg.includes("exists") || msg.includes("linked")) {
                setError("Denne Discord er allerede tilknyttet en anden profil.");
            } else {
                setError(error.message);
            }
        }
    }

    if (!session?.user) return <div>Du skal være logget ind.</div>;

    return (
        <div className="space-y-6">
            {/* Top: to kolonner (Personlige oplysninger / Personlige præferencer) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personlige oplysninger */}
                <section className="rounded-2xl border border-yellow-700/40 p-4">
                    <h3 className="text-lg font-semibold mb-4">Personlige oplysninger</h3>

                    <div className="flex items-center gap-6">
                        <div className="h-28 w-28 rounded-full overflow-hidden border border-yellow-600/50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={currentAvatar} alt="avatar" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex gap-3">
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="px-4 py-2 rounded-md border border-yellow-700/50 hover:bg-yellow-600/10"
                            >
                                Upload billede
                            </button>
                            <button
                                onClick={() => { setAvatarOverrideUrl("/images/default-avatar.png"); saveAvatarOnly("/images/default-avatar.png","custom").catch(()=>{}); }}
                                className="px-4 py-2 rounded-md border border-yellow-700/50 hover:bg-yellow-600/10"
                            >
                                Fjern billede
                            </button>
                        </div>
                    </div>

                    {showCrop && uploadPreview && (
                        <div className="rounded-2xl border border-yellow-700/50 p-4 mt-4">
                            <h4 className="font-medium mb-3">Beskær billede</h4>
                            <AvatarCropper
                                src={uploadPreview}
                                onCropped={onCropDone}
                                onCancel={() => { setShowCrop(false); setUploadPreview(null); }}
                            />
                        </div>
                    )}

                    <div className="mt-4 space-y-3">
                        <label className="block">
                            <div className="mb-1 text-sm text-yellow-200/80">Navn</div>
                            <input
                                value={form.full_name ?? ""}
                                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                                className="w-full rounded-md border border-yellow-700/50 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-600/40"
                                placeholder="Fx Trine Hansen"
                            />
                        </label>

                        <label className="block">
                            <div className="mb-1 text-sm text-yellow-200/80">Email</div>
                            <input
                                readOnly
                                value={session.user.email ?? ""}
                                className="w-full rounded-md border border-yellow-700/50 bg-transparent px-3 py-2 opacity-70"
                            />
                        </label>

                        <div className="pt-2">
                            <button className="w-full md:w-auto px-4 py-2 rounded-md border border-yellow-700/50 hover:bg-yellow-600/10">
                                Skift e-mail / adgangskode
                            </button>
                        </div>
                    </div>
                </section>

                {/* Personlige præferencer */}
                <section className="rounded-2xl border border-yellow-700/40 p-4">
                    <h3 className="text-lg font-semibold mb-4">Personlige præferencer</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                            <div className="mb-1 text-sm text-yellow-200/80">Sprog</div>
                            <select
                                value={form.locale}
                                onChange={(e) => setForm((f) => ({ ...f, locale: e.target.value }))}
                                className="w-full rounded-md border border-yellow-700/50 bg-transparent px-3 py-2"
                            >
                                <option value="da-DK">Dansk (Danmark)</option>
                                <option value="en-GB">Engelsk (UK)</option>
                                <option value="en-US">Engelsk (US)</option>
                            </select>
                        </label>

                        <label className="block">
                            <div className="mb-1 text-sm text-yellow-200/80">Tidszone</div>
                            <select
                                value={form.timezone}
                                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                                className="w-full rounded-md border border-yellow-700/50 bg-transparent px-3 py-2"
                            >
                                <option value="Auto/Europe/Copenhagen">Auto (Europe/Copenhagen)</option>
                                <option value="Europe/Copenhagen">Europe/Copenhagen</option>
                                <option value="UTC">UTC</option>
                            </select>
                        </label>

                        <label className="block">
                            <div className="mb-1 text-sm text-yellow-200/80">Datoformat</div>
                            <select
                                value={form.date_format}
                                onChange={(e) => setForm((f) => ({ ...f, date_format: e.target.value }))}
                                className="w-full rounded-md border border-yellow-700/50 bg-transparent px-3 py-2"
                            >
                                <option>DD-MM-YYYY</option>
                                <option>YYYY-MM-DD</option>
                                <option>MM/DD/YYYY</option>
                            </select>
                        </label>

                        <label className="block">
                            <div className="mb-1 text-sm text-yellow-200/80">Valuta</div>
                            <select
                                value={form.currency}
                                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                                className="w-full rounded-md border border-yellow-700/50 bg-transparent px-3 py-2"
                            >
                                <option>DKK</option>
                                <option>EUR</option>
                                <option>USD</option>
                                <option>SEK</option>
                                <option>NOK</option>
                            </select>
                        </label>

                        <label className="block">
                            <div className="mb-1 text-sm text-yellow-200/80">Talformat</div>
                            <select
                                value={form.number_format}
                                onChange={(e) => setForm((f) => ({ ...f, number_format: e.target.value }))}
                                className="w-full rounded-md border border-yellow-700/50 bg-transparent px-3 py-2"
                            >
                                <option>1.234,56 (EU)</option>
                                <option>1,234.56 (US)</option>
                            </select>
                        </label>

                        <label className="block">
                            <div className="mb-1 text-sm text-yellow-200/80">Første ugedag</div>
                            <select
                                value={form.week_start}
                                onChange={(e) => setForm((f) => ({ ...f, week_start: e.target.value }))}
                                className="w-full rounded-md border border-yellow-700/50 bg-transparent px-3 py-2"
                            >
                                <option value="monday">Mandag</option>
                                <option value="sunday">Søndag</option>
                            </select>
                        </label>
                    </div>

                    <p className="text-xs text-yellow-200/70 mt-3">
                        Disse præferencer bruges til visning i hele app’en (datoer, tal og valuta).
                    </p>
                </section>
            </div>

            {/* Integrationer */}
            <section className="rounded-2xl border border-yellow-700/40 p-4">
                <h3 className="text-lg font-semibold mb-4">Integrationer</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Discord */}
                    <div className="rounded-xl border border-yellow-700/40 p-4">
                        <div className="font-medium">Discord</div>
                        <div className="text-sm text-yellow-200/70 mb-3">
                            {discord ? "Forbundet" : "Ikke forbundet"}
                        </div>
                        {!discord ? (
                            <button
                                onClick={connectDiscord}
                                className="px-4 py-2 rounded-md bg-[#5865F2] text-white hover:opacity-90"
                            >
                                Forbind Discord
                            </button>
                        ) : (
                            <div className="text-sm">Som <span className="font-medium">{discord.username ?? "ukendt"}</span></div>
                        )}
                    </div>

                    {/* Telegram */}
                    <div className="rounded-xl border border-yellow-700/40 p-4 opacity-70">
                        <div className="font-medium">Telegram</div>
                        <div className="text-sm text-yellow-200/70 mb-3">Ikke forbundet (coming later)</div>
                        <button disabled className="px-4 py-2 rounded-md border border-yellow-700/50">Snart</button>
                    </div>

                    {/* WhatsApp */}
                    <div className="rounded-xl border border-yellow-700/40 p-4 opacity-70">
                        <div className="font-medium">WhatsApp</div>
                        <div className="text-sm text-yellow-200/70 mb-3">Ikke forbundet (coming later)</div>
                        <button disabled className="px-4 py-2 rounded-md border border-yellow-700/50">Snart</button>
                    </div>
                </div>
            </section>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    onClick={() => location.reload()}
                    className="px-4 py-2 rounded-md border border-yellow-700/50 hover:bg-yellow-600/10"
                >
                    Genindlæs
                </button>
                <button
                    disabled={saving}
                    onClick={handleSaveFull}
                    className="px-5 py-2 rounded-md bg-yellow-600 text-black hover:bg-yellow-500 disabled:opacity-60"
                >
                    {saving ? "Gemmer..." : "Gem"}
                </button>
                {message && <span className="text-green-300 ml-2">{message}</span>}
                {error && <span className="text-red-400 ml-2">{error}</span>}
            </div>
        </div>
    );
}
