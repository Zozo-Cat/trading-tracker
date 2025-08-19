// app/config/(sections)/org-bot/create/page.tsx
import { Suspense } from "react";

export const dynamic = "force-dynamic"; // undgår SSG-prerender issues på Vercel

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading…</div>}>
            <ClientInner />
        </Suspense>
    );
}

function ClientInner() {
    "use client";

    import React, { useEffect, useState } from "react";
    import { createClient } from "@supabase/supabase-js";

    function sb() {
        return createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }

    function InfoIcon({ title }: { title: string }) {
        return (
            <span
                title={title}
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px]"
                style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
            >
        ?
      </span>
        );
    }

    function genCode(prefix: string) {
        return `${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    const userId = (process.env.NEXT_PUBLIC_DEV_PROFILE_ID as string) || "demo-user";

    // plan-badge (klikbar)
    const [plan, setPlan] = useState<"free" | "premium" | "pro">("free");
    const [editPlan, setEditPlan] = useState(false);
    useEffect(() => {
        const p = (localStorage.getItem("tt_user_plan") as any) || "free";
        setPlan(p);
    }, []);
    useEffect(() => {
        localStorage.setItem("tt_user_plan", plan);
        window.dispatchEvent(new Event("storage"));
    }, [plan]);

    const markDirty = () => (window as any).ttSetDirty?.(true);

    // community form
    const [cName, setCName] = useState("");
    const [cDesc, setCDesc] = useState("");
    const [cCode, setCCode] = useState("");

    // team form (fælles)
    const [tName, setTName] = useState("");
    const [tDesc, setTDesc] = useState("");
    const [tCode, setTCode] = useState("");

    // TILKNYT: eget vs. eksternt
    type AttachMode = "own" | "external";
    const [attachMode, setAttachMode] = useState<AttachMode>("own");

    // OWN flow
    const [attachCommunity, setAttachCommunity] = useState<string>("");
    const [communities, setCommunities] = useState<any[]>([]);

    // EXTERNAL flow
    const [externalCommunityId, setExternalCommunityId] = useState("");
    const [externalTeamInviteCode, setExternalTeamInviteCode] = useState("");
    const [externalError, setExternalError] = useState<string | null>(null);

    const [toast, setToast] = useState<{ kind: "success" | "error"; msg: string } | null>(null);
    function showToast(kind: "success" | "error", msg: string) {
        setToast({ kind, msg });
        setTimeout(() => setToast(null), 2800);
    }

    useEffect(() => {
        (async () => {
            const { data, error } = await sb()
                .from("communities")
                .select("id,name")
                .order("created_at", { ascending: false });
            if (!error && data) setCommunities(data);
        })();
    }, []);

    async function createCommunity() {
        try {
            if (plan !== "pro") {
                showToast("error", "Kræver PRO-plan");
                return;
            }
            const code = cCode.trim() || genCode("COMM");
            const { error } = await sb().from("communities").insert({
                name: cName,
                description: cDesc,
                created_by: userId,
                join_code: code,
            });
            if (error) throw error;
            showToast("success", "Community oprettet");
            setCName(""); setCDesc(""); setCCode("");
            (window as any).ttSetDirty?.(false);
        } catch (e: any) {
            showToast("error", e.message);
        }
    }

    // SUBMIT: Team
    async function createTeam() {
        try {
            setExternalError(null);
            const code = tCode.trim() || genCode("TEAM");

            if (attachMode === "own") {
                const { error } = await sb().from("teams").insert({
                    name: tName,
                    description: tDesc,
                    join_code: code,
                    community_id: attachCommunity || null,
                    owner_user_id: userId,
                });
                if (error) throw error;
                showToast("success", "Team oprettet");
                setTName(""); setTDesc(""); setTCode(""); setAttachCommunity("");
                (window as any).ttSetDirty?.(false);
                return;
            }

            // attachMode === "external"
            if (!externalCommunityId.trim() || !externalTeamInviteCode.trim()) {
                setExternalError("Udfyld både Community ID og Team Invite Kode.");
                return;
            }

            // 1) Opret team uafhængigt
            const { data: newTeam, error: teamErr } = await sb()
                .from("teams")
                .insert({
                    name: tName,
                    description: tDesc,
                    join_code: code,
                    community_id: null,
                    owner_user_id: userId,
                })
                .select("id")
                .single();
            if (teamErr) throw teamErr;

            // 2) Request link via server‑API
            const res = await fetch("/api/team-links/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    teamId: newTeam?.id,
                    communityId: externalCommunityId.trim(),
                    teamInviteCode: externalTeamInviteCode.trim(),
                }),
            });

            const payload = await res.json().catch(() => ({} as any));
            if (!res.ok) {
                if (payload?.code === "INVITE_NOT_TEAM") {
                    const name = payload?.communityName || "dette community";
                    setExternalError(
                        `For at ansøge om tilknytning til ${name} skal du bruge "Team Invite Kode". ` +
                        `Har du den ikke, kontakt det community du vil tilknyttes.`
                    );
                } else if (payload?.code === "INVITE_INVALID") {
                    setExternalError("Team Invite Kode er ugyldig eller udløbet.");
                } else if (payload?.code === "COMMUNITY_NOT_FOUND") {
                    setExternalError("Community ID blev ikke fundet.");
                } else {
                    setExternalError(payload?.error || "Kunne ikke sende ansøgning. Prøv igen.");
                }
                return;
            }

            showToast("success", "Ansøgning om tilknytning sendt");
            setTName(""); setTDesc(""); setTCode("");
            setExternalCommunityId(""); setExternalTeamInviteCode("");
            (window as any).ttSetDirty?.(false);
        } catch (e: any) {
            showToast("error", e.message || "Noget gik galt");
        }
    }

    const locked = plan !== "pro";

    return (
        <main className="space-y-10">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold" style={{ color: "#E9CC6A" }}>
                    Opret (Community & Team)
                </h1>

                {/* Plan badge (klik for at ændre) */}
                <div>
                    {!editPlan ? (
                        <button
                            onClick={() => setEditPlan(true)}
                            className="text-xs px-3 py-1 rounded-md"
                            style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                            title="Klik for at ændre test-plan (lokalt)"
                        >
                            Din plan: <b style={{ color: "#fff" }}>{plan.toUpperCase()}</b>
                        </button>
                    ) : (
                        <select
                            value={plan}
                            onChange={(e) => {
                                setPlan(e.target.value as any);
                                setEditPlan(false);
                            }}
                            className="text-xs px-2 py-1 rounded-md"
                            style={{ border: "1px solid var(--tt-accent)", background: "#1a1717", color: "var(--tt-accent)" }}
                        >
                            <option value="free">FREE</option>
                            <option value="premium">PREMIUM</option>
                            <option value="pro">PRO</option>
                        </select>
                    )}
                </div>
            </div>

            {/* Kompakt 2-kolonne layout */}
            <div className="grid gap-8 lg:grid-cols-2">
                {/* Community card */}
                <section
                    className="relative rounded-2xl p-6"
                    style={{ backgroundColor: "#1a1717", border: "1px solid var(--tt-accent)" }}
                    aria-disabled={locked}
                >
                    <h2 className="text-lg font-semibold mb-2" style={{ color: "#E9CC6A" }}>
                        Community
                    </h2>
                    <p className="text-sm mb-4" style={{ color: "var(--tt-accent)" }}>
                        Et community er en overordnet organisation. Du kan oprette egne teams og tilknytte uafhængige teams.
                    </p>

                    {locked && (
                        <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                             style={{ background: "rgba(0,0,0,0.4)" }}>
                            <div className="text-center space-y-3">
                                <div className="text-sm" style={{ color: "#fff" }}>
                                    Oprettelse af community kræver <b>PRO</b>.
                                </div>
                                <button
                                    onClick={() => setPlan("pro")}
                                    className="rounded-lg px-3 py-2 text-sm font-medium"
                                    style={{ backgroundColor: "#76ed77", color: "#211d1d", border: "1px solid #1b5e20" }}
                                >
                                    Opgradér til PRO (test)
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 opacity-100">
                        <label className="block text-sm" style={{ color: "var(--tt-accent)" }}>
                            Community Navn <InfoIcon title="Navnet på din organisation." />
                            <input
                                value={cName}
                                onChange={(e) => { setCName(e.target.value); markDirty(); }}
                                placeholder="Fx Epic Traders"
                                className="w-full mt-1 rounded-lg px-3 py-2"
                                disabled={locked}
                                style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "var(--tt-accent)" }}
                            />
                        </label>

                        <label className="block text-sm" style={{ color: "var(--tt-accent)" }}>
                            Beskrivelse
                            <textarea
                                value={cDesc}
                                onChange={(e) => { setCDesc(e.target.value); markDirty(); }}
                                placeholder="Valgfrit"
                                className="w-full mt-1 rounded-lg px-3 py-2"
                                disabled={locked}
                                style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "var(--tt-accent)" }}
                            />
                        </label>

                        <label className="block text-sm" style={{ color: "var(--tt-accent)" }}>
                            Community-kode
                            <input
                                value={cCode}
                                onChange={(e) => { setCCode(e.target.value); markDirty(); }}
                                placeholder="Hvis tom, autogenereres"
                                className="w-full mt-1 rounded-lg px-3 py-2"
                                disabled={locked}
                                style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "var(--tt-accent)" }}
                            />
                        </label>

                        <button
                            onClick={createCommunity}
                            disabled={locked || !cName}
                            className="rounded-lg px-3 py-2 text-sm font-medium"
                            style={{
                                backgroundColor: !locked && cName ? "#76ed77" : "#333",
                                color: !locked && cName ? "#211d1d" : "#888",
                            }}
                        >
                            Opret Community
                        </button>
                    </div>
                </section>

                {/* Team card */}
                <section
                    className="rounded-2xl p-6"
                    style={{ backgroundColor: "#1a1717", border: "1px solid var(--tt-accent)" }}
                >
                    <h2 className="text-lg font-semibold mb-2" style={{ color: "#E9CC6A" }}>Team</h2>
                    <p className="text-sm mb-4" style={{ color: "var(--tt-accent)" }}>
                        Teams lader dig organisere medlemmer for specifikke mål, aktiviteter eller handlingsplaner.
                        Et team kan være uafhængigt eller tilknyttet et community.
                    </p>

                    <div className="space-y-4">
                        <label className="block text-sm" style={{ color: "var(--tt-accent)" }}>
                            Teamnavn
                            <input
                                value={tName}
                                onChange={(e) => { setTName(e.target.value); markDirty(); }}
                                placeholder="Fx Alpha Squad"
                                className="w-full mt-1 rounded-lg px-3 py-2"
                                style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "var(--tt-accent)" }}
                            />
                        </label>

                        <label className="block text-sm" style={{ color: "var(--tt-accent)" }}>
                            Beskrivelse
                            <textarea
                                value={tDesc}
                                onChange={(e) => { setTDesc(e.target.value); markDirty(); }}
                                placeholder="Valgfrit"
                                className="w-full mt-1 rounded-lg px-3 py-2"
                                style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "var(--tt-accent)" }}
                            />
                        </label>

                        <label className="block text-sm" style={{ color: "var(--tt-accent)" }}>
                            Team-kode
                            <input
                                value={tCode}
                                onChange={(e) => { setTCode(e.target.value); markDirty(); }}
                                placeholder="Hvis tom, autogenereres"
                                className="w-full mt-1 rounded-lg px-3 py-2"
                                style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "var(--tt-accent)" }}
                            />
                        </label>

                        {/* Tilknyt: vælg eget/eksternt */}
                        <div className="space-y-2">
                            <div className="flex gap-2 items-center text-sm" style={{ color: "var(--tt-accent)" }}>
                                Tilknyt til community
                                <InfoIcon title="Vælg eget community fra listen - eller tilknyt til et eksternt ved hjælp af Community ID + Team Invite Kode." />
                            </div>

                            {/* Toggle */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAttachMode("own")}
                                    className="px-3 py-1.5 rounded-lg text-sm"
                                    style={{
                                        border: "1px solid var(--tt-accent)",
                                        color: attachMode === "own" ? "#211d1d" : "var(--tt-accent)",
                                        background: attachMode === "own" ? "var(--tt-accent)" : "transparent",
                                    }}
                                >
                                    Eget community
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAttachMode("external")}
                                    className="px-3 py-1.5 rounded-lg text-sm"
                                    style={{
                                        border: "1px solid var(--tt-accent)",
                                        color: attachMode === "external" ? "#211d1d" : "var(--tt-accent)",
                                        background: attachMode === "external" ? "var(--tt-accent)" : "transparent",
                                    }}
                                >
                                    Eksternt community
                                </button>
                            </div>

                            {/* OWN: dropdown */}
                            {attachMode === "own" && (
                                <select
                                    value={attachCommunity}
                                    onChange={(e) => { setAttachCommunity(e.target.value); markDirty(); }}
                                    className="w-full rounded-lg px-3 py-2"
                                    style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "#fff" }}
                                >
                                    <option value="">Ingen (uafhængigt)</option>
                                    {communities.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {/* EXTERNAL: felter + fejl */}
                            {attachMode === "external" && (
                                <div className="space-y-3">
                                    <label className="block text-sm" style={{ color: "var(--tt-accent)" }}>
                                        Community ID
                                        <input
                                            value={externalCommunityId}
                                            onChange={(e) => { setExternalCommunityId(e.target.value); markDirty(); }}
                                            placeholder="Indsæt Community ID"
                                            className="w-full mt-1 rounded-lg px-3 py-2"
                                            style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "#fff" }}
                                        />
                                    </label>

                                    <label className="block text-sm" style={{ color: "var(--tt-accent)" }}>
                                        Team Invite Kode
                                        <input
                                            value={externalTeamInviteCode}
                                            onChange={(e) => { setExternalTeamInviteCode(e.target.value); markDirty(); }}
                                            placeholder="Indsæt Team Invite Kode (ikke bruger-invite)"
                                            className="w-full mt-1 rounded-lg px-3 py-2"
                                            style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "#fff" }}
                                        />
                                    </label>

                                    {externalError && (
                                        <div
                                            className="rounded-lg px-3 py-2 text-sm"
                                            style={{ border: "1px solid #ff7676", color: "#ff7676" }}
                                        >
                                            {externalError}
                                        </div>
                                    )}

                                    <p className="text-xs opacity-70" style={{ color: "var(--tt-accent)" }}>
                                        Tip: “Team Invite Kode” er en særlig kode til teams. Brugerkoder virker ikke til tilknytning.
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={createTeam}
                            disabled={!tName}
                            className="rounded-lg px-3 py-2 text-sm font-medium"
                            style={{ backgroundColor: tName ? "#76ed77" : "#333", color: tName ? "#211d1d" : "#888" }}
                        >
                            Opret Team
                        </button>
                    </div>
                </section>
            </div>

            {toast && (
                <div
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
                    style={{ backgroundColor: toast.kind === "success" ? "#76ed77" : "#ff7676", color: "#211d1d" }}
                >
                    {toast.msg}
                </div>
            )}
        </main>
    );
}
