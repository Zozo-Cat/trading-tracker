"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

function sb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

type Settings = {
    community_id: string;
    enabled_sources: string[];
    currencies: string[];
    impact_levels: string[];
    lead_minutes: number;
    discord_channel_id: string | null;
    discord_role_ids: string[];
    send_as_warning: boolean;
    team_scope_mode: "all" | "starred";
    team_starred_ids: string[];
};

const ALL_SOURCES = ["tradingeconomics", "fmp", "manual"] as const;
const ALL_CURR = ["USD", "EUR", "GBP", "CAD", "AUD", "NZD", "JPY", "CHF"] as const;
const ALL_IMPACT = ["high", "medium", "low"] as const;

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="px-2.5 py-1 rounded-md text-sm border"
            style={{
                borderColor: "var(--tt-accent)",
                color: active ? "#211d1d" : "var(--tt-accent)",
                backgroundColor: active ? "#f0e68c" : "transparent",
            }}
        >
            {children}
        </button>
    );
}

export default function NewsTrackerSection() {
    const qsCommunityId = useMemo(() => {
        if (typeof window === "undefined") return "";
        const q = new URLSearchParams(window.location.search).get("communityId");
        if (q) return q;
        try { return localStorage.getItem("tt_last_community_id") || ""; } catch { return ""; }
    }, []);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [toast, setToast] = useState<{ kind: "success" | "error"; msg: string } | null>(null);

    const showToast = (kind: "success" | "error", msg: string) => {
        setToast({ kind, msg });
        window.clearTimeout((showToast as any)._t);
        (showToast as any)._t = window.setTimeout(() => setToast(null), 2400);
    };

    // Load
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                if (!qsCommunityId) {
                    setSettings(null);
                    return;
                }
                const { data, error } = await sb()
                    .from("news_settings_view")
                    .select("*")
                    .eq("community_id", qsCommunityId)
                    .maybeSingle();
                if (error) throw error;

                const s: Settings = {
                    community_id: qsCommunityId,
                    enabled_sources: data?.enabled_sources ?? ["tradingeconomics"],
                    currencies: data?.currencies ?? ["USD", "EUR", "GBP"],
                    impact_levels: data?.impact_levels ?? ["high", "medium"],
                    lead_minutes: typeof data?.lead_minutes === "number" ? data.lead_minutes : 15,
                    discord_channel_id: data?.discord_channel_id ?? null,
                    discord_role_ids: data?.discord_role_ids ?? [],
                    send_as_warning: typeof data?.send_as_warning === "boolean" ? data.send_as_warning : true,
                    team_scope_mode: (data?.team_scope_mode ?? "all") as "all" | "starred",
                    team_starred_ids: data?.team_starred_ids ?? [],
                };
                setSettings(s);
            } catch (e: any) {
                showToast("error", e.message || "Kunne ikke hente News settings");
            } finally {
                setLoading(false);
            }
        })();
    }, [qsCommunityId]);

    // Mark dirty når vi ændrer noget
    const markDirty = () => (window as any).ttSetDirty?.(true);

    // Registrér save-hook til top “Gem”
    useEffect(() => {
        const hook = async () => {
            if (!settings) return;
            await handleSave();
        };
        (window as any).ttSaveHooks = (window as any).ttSaveHooks || [];
        (window as any).ttSaveHooks.push(hook);
        return () => {
            const arr: any[] = (window as any).ttSaveHooks || [];
            const i = arr.indexOf(hook);
            if (i >= 0) arr.splice(i, 1);
        };
    }, [settings]);

    async function handleSave() {
        if (!settings) return;
        try {
            setSaving(true);
            const up = {
                community_id: settings.community_id,
                enabled_sources: settings.enabled_sources,
                currencies: settings.currencies,
                impact_levels: settings.impact_levels,
                lead_minutes: settings.lead_minutes,
                discord_channel_id: settings.discord_channel_id,
                discord_role_ids: settings.discord_role_ids,
                send_as_warning: settings.send_as_warning,
                team_scope_mode: settings.team_scope_mode,
                team_starred_ids: settings.team_starred_ids,
                updated_at: new Date().toISOString(),
            };
            const { error } = await sb()
                .from("news_settings")
                .upsert(up, { onConflict: "community_id" });
            if (error) throw error;
            showToast("success", "News settings gemt");
            (window as any).ttSetDirty?.(false);
        } catch (e: any) {
            showToast("error", e.message || "Kunne ikke gemme");
        } finally {
            setSaving(false);
        }
    }

    async function handleTestDiscord() {
        try {
            const res = await fetch("/api/news/test-discord", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    communityId: settings?.community_id,
                    channelId: settings?.discord_channel_id,
                    roleIds: settings?.discord_role_ids,
                    preview: {
                        title: "Test: CPI (USD) om 15 minutter",
                        impact: "high",
                        at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                    },
                }),
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || "Ping fejlede");
            showToast("success", "Test-ping sendt (dummy)");
        } catch (e: any) {
            showToast("error", e.message);
        }
    }

    if (!qsCommunityId) {
        return (
            <section className="rounded-2xl p-6" style={{ backgroundColor: "#1a1717", border: "1px solid var(--tt-accent)" }}>
                <h3 className="text-base font-semibold mb-2" style={{ color: "#E9CC6A" }}>News tracker</h3>
                <p className="text-sm" style={{ color: "var(--tt-accent)" }}>
                    Vælg et community i headeren for at konfigurere nyheder og notifikationer.
                </p>
            </section>
        );
    }

    if (loading || !settings) {
        return (
            <section className="rounded-2xl p-6" style={{ backgroundColor: "#1a1717", border: "1px solid var(--tt-accent)" }}>
                <div style={{ color: "var(--tt-accent)" }}>Henter…</div>
            </section>
        );
    }

    return (
        <section className="rounded-2xl p-6 space-y-6" style={{ backgroundColor: "#1a1717", border: "1px solid var(--tt-accent)" }}>
            <h3 className="text-base font-semibold" style={{ color: "#E9CC6A" }}>News tracker</h3>
            <p className="text-sm" style={{ color: "var(--tt-accent)" }}>
                Vælg kilder, markeder og impact-niveauer for økonomiske begivenheder. Aktivér Discord-advarsel med lead-time (fx 15 min før).
            </p>

            {/* Kilder */}
            <div>
                <div className="text-sm mb-2" style={{ color: "var(--tt-accent)" }}>Kilder</div>
                <div className="flex flex-wrap gap-2">
                    {ALL_SOURCES.map(src => {
                        const on = settings.enabled_sources.includes(src);
                        return (
                            <Chip
                                key={src}
                                active={on}
                                onClick={() => {
                                    setSettings(s => {
                                        if (!s) return s;
                                        const has = s.enabled_sources.includes(src);
                                        return { ...s, enabled_sources: has ? s.enabled_sources.filter(x => x !== src) : [...s.enabled_sources, src] };
                                    });
                                    markDirty();
                                }}
                            >
                                {src}
                            </Chip>
                        );
                    })}
                </div>
            </div>

            {/* Valutaer */}
            <div>
                <div className="text-sm mb-2" style={{ color: "var(--tt-accent)" }}>Valutaer / markeder</div>
                <div className="flex flex-wrap gap-2">
                    {ALL_CURR.map(ccy => {
                        const on = settings.currencies.includes(ccy);
                        return (
                            <Chip
                                key={ccy}
                                active={on}
                                onClick={() => {
                                    setSettings(s => {
                                        if (!s) return s;
                                        const has = s.currencies.includes(ccy);
                                        return { ...s, currencies: has ? s.currencies.filter(x => x !== ccy) : [...s.currencies, ccy] };
                                    });
                                    markDirty();
                                }}
                            >
                                {ccy}
                            </Chip>
                        );
                    })}
                </div>
            </div>

            {/* Impact */}
            <div>
                <div className="text-sm mb-2" style={{ color: "var(--tt-accent)" }}>Impact</div>
                <div className="flex flex-wrap gap-2">
                    {ALL_IMPACT.map(level => {
                        const on = settings.impact_levels.includes(level);
                        return (
                            <Chip
                                key={level}
                                active={on}
                                onClick={() => {
                                    setSettings(s => {
                                        if (!s) return s;
                                        const has = s.impact_levels.includes(level);
                                        return { ...s, impact_levels: has ? s.impact_levels.filter(x => x !== level) : [...s.impact_levels, level] };
                                    });
                                    markDirty();
                                }}
                            >
                                {level}
                            </Chip>
                        );
                    })}
                </div>
            </div>

            {/* Lead time + Discord */}
            <div className="grid md:grid-cols-2 gap-6">
                <label className="block text-sm" style={{ color: "var(--tt-accent)" }}>
                    Forvarsel (minutter før)
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={String(settings.lead_minutes ?? 15)}
                        onChange={(e) => {
                            const v = e.target.value.replace(/\D+/g, "");
                            setSettings(s => s ? { ...s, lead_minutes: v === "" ? 0 : parseInt(v, 10) } : s);
                            markDirty();
                        }}
                        className="w-full mt-1 rounded-lg px-3 py-2"
                        style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "#fff" }}
                    />
                </label>

                <div className="space-y-3">
                    <label className="block text-sm" style={{ color: "var(--tt-accent)" }}>
                        Discord kanal ID (valgfri)
                        <input
                            type="text"
                            value={settings.discord_channel_id ?? ""}
                            onChange={(e) => {
                                setSettings(s => s ? { ...s, discord_channel_id: e.target.value || null } : s);
                                markDirty();
                            }}
                            className="w-full mt-1 rounded-lg px-3 py-2"
                            placeholder="123456789012345678"
                            style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "#fff" }}
                        />
                    </label>

                    <label className="block text-sm" style={{ color: "var(--tt-accent)" }}>
                        Discord rolle-IDs (komma-separeret, valgfri)
                        <input
                            type="text"
                            value={(settings.discord_role_ids ?? []).join(",")}
                            onChange={(e) => {
                                const parts = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                                setSettings(s => s ? { ...s, discord_role_ids: parts } : s);
                                markDirty();
                            }}
                            className="w-full mt-1 rounded-lg px-3 py-2"
                            placeholder="111...,222..."
                            style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "#fff" }}
                        />
                    </label>

                    <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--tt-accent)" }}>
                        <input
                            type="checkbox"
                            checked={settings.send_as_warning}
                            onChange={(e) => { setSettings(s => s ? { ...s, send_as_warning: e.target.checked } : s); markDirty(); }}
                        />
                        Send som warning (⚠️)
                    </label>
                </div>
            </div>

            {/* Scope (community vs. udvalgte teams) – vi plumb’er kun feltet her (UI for team-starring kan vi genbruge senere) */}
            <div className="space-y-2">
                <div className="text-sm" style={{ color: "var(--tt-accent)" }}>Omfang</div>
                <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--tt-accent)" }}>
                        <input
                            type="radio"
                            name="scope"
                            checked={settings.team_scope_mode === "all"}
                            onChange={() => { setSettings(s => s ? { ...s, team_scope_mode: "all" } : s); markDirty(); }}
                        />
                        Medtag community-total
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--tt-accent)" }}>
                        <input
                            type="radio"
                            name="scope"
                            checked={settings.team_scope_mode === "starred"}
                            onChange={() => { setSettings(s => s ? { ...s, team_scope_mode: "starred" } : s); markDirty(); }}
                        />
                        Kun udvalgte teams (stjernemarkeret)
                    </label>
                </div>
                {settings.team_scope_mode === "starred" && (
                    <div className="text-xs opacity-80" style={{ color: "var(--tt-accent)" }}>
                        (UI til at vælge/stjerne teams kobler vi på i næste step – feltet gemmes allerede.)
                    </div>
                )}
            </div>

            {/* Knapper */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg px-3 py-2 text-sm font-medium"
                    style={{ backgroundColor: saving ? "#333" : "#76ed77", color: saving ? "#888" : "#211d1d" }}
                >
                    {saving ? "Gemmer…" : "Gem settings"}
                </button>
                <button
                    onClick={handleTestDiscord}
                    className="rounded-lg px-3 py-2 text-sm"
                    style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                >
                    Test ping til Discord (dummy)
                </button>
            </div>

            {toast && (
                <div
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
                    style={{ backgroundColor: toast.kind === "success" ? "#76ed77" : "#ff7676", color: "#211d1d" }}
                >
                    {toast.msg}
                </div>
            )}
        </section>
    );
}
