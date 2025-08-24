// app/config/(sections)/org-bot/invites/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";

type Community = {
    id: string;
    public_id?: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    teams_count: number;
    members_count: number;
    support_key?: string | null;
    is_official?: boolean; // vis badge hvis tilgængelig i viewet
};

type Invite = {
    id: string;
    code: string;
    community_id: string;
    team_id: string | null;
    expires_at: string | null;
    max_uses: number | null;
    uses: number;
    created_at?: string;
};

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

function Badge({
                   children,
                   title,
               }: {
    children: React.ReactNode;
    title?: string;
}) {
    return (
        <span
            title={title}
            className="px-2 py-0.5 rounded-md text-xs"
            style={{ backgroundColor: "var(--tt-accent)", color: "#211d1d" }}
        >
      {children}
    </span>
    );
}

// ----------------- INDHOLD FLYTTET HERUNDER -----------------
function InvitesPageInner() {
    const [communities, setCommunities] = useState<
        (Community & { invites?: Invite[]; _invitesLoaded?: boolean })[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ kind: "success" | "error"; msg: string } | null>(null);

    function showToast(kind: "success" | "error", msg: string) {
        setToast({ kind, msg });
        window.clearTimeout((showToast as any)._tId);
        (showToast as any)._tId = window.setTimeout(() => setToast(null), 2800);
    }

    async function copyToClipboard(text: string, label?: string) {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const el = document.createElement("textarea");
                el.value = text;
                document.body.appendChild(el);
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
            }
            showToast("success", `${label ? `${label} ` : ""}kopieret`);
        } catch (e: any) {
            showToast("error", e?.message || "Kunne ikke kopiere");
        }
    }

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const { data, error } = await sb().from("communities_with_stats").select("*");
                if (error) throw error;
                const list = (data as Community[])
                    .slice()
                    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                setCommunities(list);
            } catch (e: any) {
                showToast("error", e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    async function createInvite(communityId: string, days: number, maxUses: number) {
        try {
            const res = await fetch("/api/invites/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ communityId, days, maxUses }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            showToast("success", `Invite oprettet: ${json.code}`);
            await loadInvites(communityId, true);
        } catch (e: any) {
            showToast("error", e.message);
        }
    }

    async function loadInvites(communityId: string, ensureOpen?: boolean) {
        try {
            const res = await fetch(`/api/invites/list?communityId=${communityId}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            setCommunities((prev) =>
                prev.map((c) =>
                    c.id === communityId
                        ? { ...c, invites: json as Invite[], _invitesLoaded: true }
                        : c
                )
            );
            if (ensureOpen) {
                // no-op
            }
        } catch (e: any) {
            showToast("error", e.message);
        }
    }

    async function deleteInvite(id: string, communityId: string) {
        try {
            const yes = window.confirm("Er du sikker på, at du vil slette denne invite?");
            if (!yes) return;
            const res = await fetch("/api/invites/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            showToast("success", "Invite slettet");
            await loadInvites(communityId);
        } catch (e: any) {
            showToast("error", e.message);
        }
    }

    function buildJoinLink(code: string) {
        try {
            const origin =
                typeof window !== "undefined" && window.location?.origin
                    ? window.location.origin
                    : "";
            return origin ? `${origin}/join?code=${code}` : `/join?code=${code}`;
        } catch {
            return `/join?code=${code}`;
        }
    }

    function rememberCommunity(id: string) {
        try {
            localStorage.setItem("tt_last_community_id", id);
        } catch {}
    }

    return (
        <main className="space-y-6">
            <h1 className="text-2xl font-semibold" style={{ color: "#E9CC6A" }}>
                Invitationer & Teams
            </h1>

            {loading ? (
                <div style={{ color: "var(--tt-accent)" }}>Henter communities…</div>
            ) : communities.length === 0 ? (
                <div style={{ color: "var(--tt-accent)" }}>Ingen communities endnu.</div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {communities.map((c) => {
                        return (
                            <section
                                key={c.id}
                                className="rounded-2xl p-6 shadow-lg"
                                style={{
                                    backgroundColor: "#1B1A1A",
                                    border: "1px solid var(--tt-accent)",
                                }}
                            >
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    {c.logo_url ? (
                                        <img
                                            src={c.logo_url}
                                            alt={c.name}
                                            className="w-12 h-12 rounded-lg border"
                                            style={{ borderColor: "var(--tt-accent)" }}
                                        />
                                    ) : (
                                        <div
                                            className="w-12 h-12 flex items-center justify-center rounded-lg border"
                                            style={{
                                                borderColor: "var(--tt-accent)",
                                                color: "var(--tt-accent)",
                                            }}
                                        >
                                            {c.name?.[0] ?? "C"}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h2
                                                className="text-lg font-semibold truncate"
                                                style={{ color: "#E9CC6A" }}
                                                title={c.name}
                                            >
                                                {c.name}
                                            </h2>
                                            {c.is_official === true && (
                                                <Badge title="Officielt community">OFFICIAL</Badge>
                                            )}
                                            {typeof c.public_id === "string" &&
                                                c.public_id.trim().length > 0 && (
                                                    <Badge title="Offentlig identifikator">public</Badge>
                                                )}
                                        </div>
                                        <p
                                            className="text-xs truncate"
                                            style={{ color: "var(--tt-accent)" }}
                                            title={c.description || undefined}
                                        >
                                            {c.description || "—"}
                                        </p>
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div className="flex flex-wrap gap-2 text-xs mb-4">
                                    <Badge title="Antal teams i community">{c.teams_count} teams</Badge>
                                    <Badge title="Antal medlemmer i community">
                                        {c.members_count} medlemmer
                                    </Badge>
                                </div>

                                {/* Community ID (stort felt) */}
                                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs" style={{ color: "var(--tt-accent)" }}>
                    Community ID
                  </span>
                                    <InfoIcon title="Bruges i API-ruter og til linking mellem sider." />
                                </div>
                                <div
                                    className="flex items-center justify-between rounded-lg px-3 py-3 text-sm mb-4"
                                    style={{
                                        border: "1px solid var(--tt-accent)",
                                        color: "var(--tt-accent)",
                                    }}
                                    title={c.id}
                                >
                                    <code className="truncate pr-3 text-[13px]">{c.id}</code>
                                    <button
                                        className="underline"
                                        onClick={() => copyToClipboard(c.id, "Community ID")}
                                        title="Kopiér Community ID"
                                    >
                                        Kopiér
                                    </button>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => createInvite(c.id, 7, 10)}
                                        className="px-3 py-1.5 rounded-lg text-sm"
                                        style={{
                                            border: "1px solid var(--tt-accent)",
                                            color: "var(--tt-accent)",
                                        }}
                                        title="Opret en invite der udløber om 7 dage og kan bruges 10 gange"
                                    >
                                        + Ny Invite (7 dage / 10 brug)
                                    </button>
                                    <button
                                        onClick={() => loadInvites(c.id, true)}
                                        className="px-3 py-1.5 rounded-lg text-sm"
                                        style={{
                                            border: "1px solid var(--tt-accent)",
                                            color: "var(--tt-accent)",
                                        }}
                                        title="Genindlæs invites for dette community"
                                    >
                                        Opdater invites
                                    </button>

                                    {/* NYT: Branding-link (bevarer valgt community) */}
                                    <a
                                        href={`/config/org-bot?communityId=${c.id}`}
                                        onClick={() => rememberCommunity(c.id)}
                                        className="px-3 py-1.5 rounded-lg text-sm underline"
                                        style={{ color: "var(--tt-accent)" }}
                                        title="Gå til branding for dette community (bevarer valgt community)"
                                    >
                                        Branding →
                                    </a>

                                    <a
                                        href={`/config/org-bot/teams?communityId=${c.id}`}
                                        onClick={() => rememberCommunity(c.id)}
                                        className="px-3 py-1.5 rounded-lg text-sm underline"
                                        style={{ color: "var(--tt-accent)" }}
                                        title="Gå til teams for dette community (bevarer valgt community)"
                                    >
                                        Tilpas teams →
                                    </a>
                                </div>

                                {/* Invites liste */}
                                <div className="mt-4 space-y-2">
                                    {c.invites && c.invites.length === 0 && (
                                        <div
                                            className="text-xs px-3 py-2 rounded-md"
                                            style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                                            title="Ingen invites endnu — opret en med knappen ovenfor"
                                        >
                                            Ingen invites endnu.
                                        </div>
                                    )}

                                    {(c.invites || []).map((inv) => {
                                        const joinLink = buildJoinLink(inv.code);
                                        const exp = inv.expires_at
                                            ? new Date(inv.expires_at).toLocaleString()
                                            : "Aldrig";
                                        const usesInfo =
                                            inv.max_uses != null
                                                ? `${inv.uses}/${inv.max_uses} brug`
                                                : `${inv.uses} brug`;
                                        return (
                                            <div
                                                key={inv.id}
                                                className="rounded-lg p-2"
                                                style={{ border: "1px solid var(--tt-accent)" }}
                                                title="Invite"
                                            >
                                                {/* Stor kode-række */}
                                                <div
                                                    className="flex items-center justify-between gap-3 px-2 py-2 rounded-md mb-2"
                                                    style={{ color: "var(--tt-accent)" }}
                                                    title={inv.code}
                                                >
                                                    <div className="min-w-0">
                                                        <div className="text-[11px] opacity-80 mb-1">Invite kode</div>
                                                        <code className="truncate text-sm md:text-base">{inv.code}</code>
                                                    </div>
                                                    <div className="flex gap-3 shrink-0">
                                                        <button
                                                            onClick={() => copyToClipboard(inv.code, "Invite kode")}
                                                            className="underline text-xs"
                                                            title="Kopiér kode"
                                                        >
                                                            Kopiér kode
                                                        </button>
                                                        <button
                                                            onClick={() => copyToClipboard(joinLink, "Join-link")}
                                                            className="underline text-xs"
                                                            title="/join?code=… link"
                                                        >
                                                            Kopiér link
                                                        </button>
                                                        <button
                                                            onClick={() => deleteInvite(inv.id, c.id)}
                                                            className="underline text-xs"
                                                            title="Slet invite (kræver bekræftelse)"
                                                        >
                                                            Slet
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Meta badges */}
                                                <div className="flex flex-wrap gap-2 text-[11px] px-1">
                                                    <Badge title="Udløber">{exp}</Badge>
                                                    <Badge title="Forbrug">{usesInfo}</Badge>
                                                    {inv.team_id && <Badge title="Tilknyttet team">team-linket</Badge>}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Tip-række hvis invites ikke hentet endnu */}
                                    {!c._invitesLoaded && (
                                        <button
                                            onClick={() => loadInvites(c.id, true)}
                                            className="w-full mt-2 px-3 py-2 rounded-lg text-sm"
                                            style={{
                                                border: "1px solid var(--tt-accent)",
                                                color: "var(--tt-accent)",
                                            }}
                                            title="Hent invites for dette community"
                                        >
                                            Vis invites
                                        </button>
                                    )}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}

            {toast && (
                <div
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
                    style={{
                        backgroundColor: toast.kind === "success" ? "#76ed77" : "#ff7676",
                        color: "#211d1d",
                    }}
                >
                    {toast.msg}
                </div>
            )}
        </main>
    );
}

// ----------------- SUSPENSE WRAPPER (krav i Next 15) -----------------
export const dynamic = "force-dynamic";

export default function InvitesPage() {
    return (
        <Suspense fallback={<div className="p-6">Indlæser…</div>}>
            <InvitesPageInner />
        </Suspense>
    );
}
