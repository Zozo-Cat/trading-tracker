"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

function sb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

type Community = { id: string; name: string };
type Team = {
    id: string;
    name: string;
    description: string | null;
    join_code: string | null;
    members_count?: number;
};

export default function TeamsPage() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [communityId, setCommunityId] = useState<string>("");
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ kind: "success" | "error"; msg: string } | null>(null);

    function showToast(kind: "success" | "error", msg: string) {
        setToast({ kind, msg });
        setTimeout(() => setToast(null), 2800);
    }

    // init from query
    useEffect(() => {
        const u = new URL(window.location.href);
        const pre = u.searchParams.get("communityId") || "";
        if (pre) setCommunityId(pre);
    }, []);

    useEffect(() => {
        (async () => {
            const { data } = await sb().from("communities").select("id,name").order("name");
            setCommunities((data as any) || []);
        })();
    }, []);

    useEffect(() => {
        (async () => {
            if (!communityId) { setTeams([]); setLoading(false); return; }
            setLoading(true);
            const { data, error } = await sb()
                .from("teams_with_stats")
                .select("id,name,description,join_code,members_count")
                .eq("community_id", communityId)
                .order("name");
            setLoading(false);
            if (error) { showToast("error", error.message); return; }
            setTeams((data as any) || []);
        })();
    }, [communityId]);

    async function saveTeam(t: Team) {
        try {
            const { error } = await sb()
                .from("teams")
                .update({ name: t.name, description: t.description, join_code: t.join_code })
                .eq("id", t.id);
            if (error) throw error;
            showToast("success", "Gemt");
        } catch (e: any) {
            showToast("error", e.message);
        }
    }

    async function deleteTeam(id: string, membersCount: number | undefined) {
        try {
            if (membersCount && membersCount > 0) {
                showToast("error", "Kan ikke slette: team har medlemmer");
                return;
            }
            const ok = confirm("Slette team? Dette kan ikke gøres om.");
            if (!ok) return;
            const { error } = await sb().from("teams").delete().eq("id", id);
            if (error) throw error;
            setTeams((prev) => prev.filter((x) => x.id !== id));
            showToast("success", "Team slettet");
        } catch (e: any) {
            showToast("error", e.message);
        }
    }

    const activeCommunity = useMemo(
        () => communities.find((c) => c.id === communityId) || null,
        [communities, communityId]
    );

    return (
        <main className="space-y-6">
            <h1 className="text-2xl font-semibold" style={{ color: "#E9CC6A" }}>Teams</h1>

            <div className="flex items-center gap-3">
                <label className="text-sm" style={{ color: "var(--tt-accent)" }}>Community:</label>
                <select
                    value={communityId}
                    onChange={(e) => setCommunityId(e.target.value)}
                    className="rounded-lg px-3 py-2"
                    style={{ border: "1px solid var(--tt-accent)", background: "#1a1717", color: "#fff" }}
                >
                    <option value="">— vælg —</option>
                    {communities.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>

                {activeCommunity && (
                    <div className="ml-auto text-xs px-2 py-1 rounded-md"
                         style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}>
                        ID: <code>{activeCommunity.id}</code>
                    </div>
                )}
            </div>

            {!communityId ? (
                <div style={{ color: "var(--tt-accent)" }}>Vælg et community for at se teams.</div>
            ) : loading ? (
                <div style={{ color: "var(--tt-accent)" }}>Henter teams…</div>
            ) : teams.length === 0 ? (
                <div style={{ color: "var(--tt-accent)" }}>Ingen teams i dette community endnu.</div>
            ) : (
                <div className="space-y-4">
                    {teams.map((t) => (
                        <div key={t.id}
                             className="rounded-xl p-4"
                             style={{ border: "1px solid var(--tt-accent)", background: "#211d1d" }}>
                            <div className="flex items-center justify-between">
                                <input
                                    value={t.name}
                                    onChange={(e) =>
                                        setTeams((prev) => prev.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)))
                                    }
                                    className="rounded-md px-2 py-1"
                                    style={{ border: "1px solid var(--tt-accent)", background: "#1a1717", color: "var(--tt-accent)" }}
                                />
                                <span className="text-xs px-2 py-1 rounded-md"
                                      style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}>
                  {t.members_count ?? 0} medlemmer
                </span>
                            </div>

                            {/* Team ID (read-only) */}
                            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto] items-center">
                                <label className="text-xs" style={{ color: "var(--tt-accent)" }}>Team ID:</label>
                                <div />
                                <input
                                    value={t.id}
                                    readOnly
                                    className="rounded-md px-2 py-1 col-span-1 md:col-span-1"
                                    style={{ border: "1px solid var(--tt-accent)", background: "#1a1717", color: "var(--tt-accent)" }}
                                />
                                <button
                                    onClick={() => navigator.clipboard.writeText(t.id)}
                                    className="text-xs underline justify-self-start md:justify-self-auto"
                                    style={{ color: "var(--tt-accent)" }}
                                >
                                    Copy
                                </button>
                            </div>

                            {/* Join-kode */}
                            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto] items-center">
                                <label className="text-xs" style={{ color: "var(--tt-accent)" }}>Join-kode</label>
                                <div />
                                <div />
                                <input
                                    value={t.join_code || ""}
                                    onChange={(e) =>
                                        setTeams((prev) => prev.map((x) => (x.id === t.id ? { ...x, join_code: e.target.value } : x)))
                                    }
                                    placeholder="fx TEAM-ALPHA"
                                    className="rounded-md px-2 py-1 col-span-1 md:col-span-1"
                                    style={{ border: "1px solid var(--tt-accent)", background: "#1a1717", color: "var(--tt-accent)" }}
                                />
                                <button
                                    onClick={() => navigator.clipboard.writeText(t.join_code || "")}
                                    className="text-xs underline"
                                    style={{ color: "var(--tt-accent)" }}
                                >
                                    Copy
                                </button>
                                <button
                                    onClick={() => saveTeam(t)}
                                    className="text-xs rounded-md px-2 py-1"
                                    style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                                >
                                    Gem
                                </button>
                            </div>

                            <div className="mt-3">
                                <button
                                    onClick={() => deleteTeam(t.id, t.members_count)}
                                    className="text-xs rounded-md px-2 py-1"
                                    style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                                    title="Kræver tomt team"
                                >
                                    Slet (kræver tomt team)
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
