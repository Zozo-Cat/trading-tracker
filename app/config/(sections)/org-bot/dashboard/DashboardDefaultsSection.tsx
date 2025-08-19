"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* Supabase */
function sb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

/* UI helpers */
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
function Toggle({
                    checked,
                    onChange,
                    label,
                }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label?: string;
}) {
    return (
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <span
          className="w-10 h-6 rounded-full relative"
          style={{
              backgroundColor: checked ? "#76ed77" : "#444",
              transition: "background-color .15s ease",
          }}
          onClick={() => onChange(!checked)}
      >
        <span
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white"
            style={{
                transform: checked ? "translateX(20px)" : "translateX(0)",
                transition: "transform .15s ease",
            }}
        />
      </span>
            {label && <span style={{ color: "var(--tt-accent)" }}>{label}</span>}
        </label>
    );
}
function Hint({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-xs opacity-80" style={{ color: "var(--tt-accent)" }}>
            {children}
        </p>
    );
}

/** Nummerfelt der lader dig slette helt under indtastning */
function NumberField({
                         value,
                         onChange,
                         min,
                         max,
                         step,
                         placeholder,
                         style,
                         className,
                     }: {
    value: number | "" | undefined;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    style?: React.CSSProperties;
    className?: string;
}) {
    const [raw, setRaw] = useState<string>(
        value === "" || value === undefined ? "" : String(value)
    );

    useEffect(() => {
        const target = value === "" || value === undefined ? "" : String(value);
        setRaw(target);
    }, [value]);

    return (
        <>
            <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button{ -webkit-appearance: none; margin: 0; }
        input[type=number]{ -moz-appearance: textfield; }
      `}</style>
            <input
                inputMode="numeric"
                type="text"
                value={raw}
                placeholder={placeholder}
                onChange={(e) => {
                    const v = e.target.value;
                    // tillad tom string mens man skriver
                    if (v === "") {
                        setRaw("");
                        (window as any).ttSetDirty?.(true);
                        return;
                    }
                    // kun tal + evt. decimal
                    if (!/^-?\d*(?:[.,]\d*)?$/.test(v)) return;
                    setRaw(v);
                    (window as any).ttSetDirty?.(true);
                }}
                onBlur={() => {
                    // commit ved blur
                    let v = raw.replace(",", ".");
                    if (v === "") return; // behold tom → fortryd via reload/valg
                    let num = Number(v);
                    if (!isFinite(num)) return;
                    if (min != null && num < min) num = min;
                    if (max != null && num > max) num = max;
                    onChange(num);
                }}
                className={`w-full rounded-lg px-3 py-2 ${className || ""}`}
                style={{
                    border: "1px solid var(--tt-accent)",
                    background: "#211d1d",
                    color: "#fff",
                    ...(style || {}),
                }}
            />
        </>
    );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const { type, ...rest } = props;
    return (
        <input
            type={type || "text"}
            {...rest}
            className={`w-full rounded-lg px-3 py-2 ${rest.className || ""}`}
            style={{
                border: "1px solid var(--tt-accent)",
                background: "#211d1d",
                color: "#fff",
                ...(rest.style || {}),
            }}
            onChange={(e) => {
                rest.onChange?.(e);
                (window as any).ttSetDirty?.(true);
            }}
        />
    );
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            {...props}
            className={`w-full rounded-lg px-3 py-2 ${props.className || ""}`}
            style={{
                border: "1px solid var(--tt-accent)",
                background: "#211d1d",
                color: "#fff",
                ...(props.style || {}),
            }}
            onChange={(e) => {
                props.onChange?.(e);
                (window as any).ttSetDirty?.(true);
            }}
        />
    );
}

/* Types & constants */
type Team = { id: string; name: string | null };

const ALL_WIDGET_KEYS = [
    "announcements",
    "open_signals",
    "pl_overview",
    "team_leaderboard",
    "news_feed",
    "calendar",
    "risk_meter",
    "equity_curve",
    "win_rate",
    "integration_status",
    "watchlist",
] as const;
type WidgetKey = typeof ALL_WIDGET_KEYS[number];

type LayoutShape = { community: string[]; team: string[] };
type WidgetsShape = { [key: string]: any };
type DefaultsRow = {
    community_id: string;
    layout: LayoutShape;
    widgets: WidgetsShape;
    mandatory: string[];
    allowed: string[];
};

const DEFAULTS: DefaultsRow = {
    community_id: "",
    layout: {
        community: ["announcements", "pl_overview", "open_signals", "win_rate"],
        team: ["open_signals", "team_leaderboard"],
    },
    widgets: {
        announcements: { enabled: true, limit: 3, recommended: true },
        pl_overview: {
            enabled: true,
            scope: { includeCommunity: true, team_ids: [] as string[] },
            periods: ["day", "week", "month"],
            recommended: true,
        },
        open_signals: {
            enabled: true,
            scope: { includeCommunity: true, team_ids: [] as string[] },
            limit: 6,
            sort_by: "newest",
            recommended: true,
        },
        win_rate: {
            enabled: true,
            scope: { includeCommunity: true, team_ids: [] as string[] },
            periods: [30, 90],
            min_trades: 5,
            recommended: false,
        },
        equity_curve: {
            enabled: true,
            scope: { includeCommunity: true, team_ids: [] as string[] },
            range_days: 30,
            recommended: false,
        },
        team_leaderboard: {
            enabled: true,
            top_n: 5,
            range_days: 30,
            sort_by: "pl",
            show_metrics: { pl: true, win_rate: true, trades: true },
            recommended: true,
        },
        risk_meter: {
            enabled: true,
            scope: { includeCommunity: true, team_ids: [] as string[] },
            range_days: 90,
            units: "R",
            recommended_risk_percent: 1.0,
            recommended: true,
        },
        news_feed: { enabled: true, currencies: ["USD", "EUR"], impact: ["high", "medium"], limit: 5, recommended: true },
        calendar: { enabled: true, limit: 4, recommended: true },
        integration_status: { enabled: true, integrations: ["discord"], recommended: false },
        watchlist: { enabled: false, symbols: [], limit: 6, recommended: false },
    },
    mandatory: ["announcements"],
    allowed: [
        "pl_overview",
        "open_signals",
        "win_rate",
        "equity_curve",
        "team_leaderboard",
        "risk_meter",
        "news_feed",
        "calendar",
        "integration_status",
        "watchlist",
    ],
};

const TITLES: Record<WidgetKey, string> = {
    announcements: "Annonceringer",
    open_signals: "Åbne signaler",
    pl_overview: "P/L overblik",
    team_leaderboard: "Team leaderboard",
    news_feed: "Nyhedsfeed",
    calendar: "Kalender",
    risk_meter: "Risiko-meter",
    equity_curve: "Equity-kurve",
    win_rate: "Win-rate",
    integration_status: "Integrationer",
    watchlist: "Watchlist",
};
const DESCS: Record<WidgetKey, string> = {
    announcements: "Korte community-opslag på dashboardet.",
    open_signals: "Aktive signaler/handler – altid øverst.",
    pl_overview: "Opsummeret P/L for community eller udvalgte teams.",
    team_leaderboard: "Topliste over teams (periode/sortering).",
    news_feed: "Økonomiske events filtreret på valuta/impact.",
    calendar: "Kompakt liste over kommende events.",
    risk_meter: "DD, R/R, og anbefalet risk % pr. trade.",
    equity_curve: "Udviklingskurve (30/90 dage).",
    win_rate: "Win-rate (7/30/90 dage, min. trades).",
    integration_status: "Status for forbindelser (Discord, osv.)",
    watchlist: "Simpel liste over symboler/priser.",
};
const LONG_DESCS: Partial<Record<WidgetKey, string>> = {
    pl_overview:
        "Viser et hurtigt overblik over profit/loss. Du kan kombinere community-totalen med ét eller flere teams. Brug den til at give alle et klart dagligt/ugentligt/månedligt snapshot.",
    open_signals:
        "Fremhæver nuværende åbne signaler/handler. Du kan vælge at tage dem fra hele community eller kun bestemte teams.",
    win_rate:
        "Måler andelen af vindere i valgte perioder. Vælg et minimum antal handler for at undgå støj.",
    equity_curve:
        "Graf over udviklingen (P/L) over tid. Brug den til at vise retningen for community eller enkelte teams.",
    risk_meter:
        "Kontrolpanel for risikostyring (drawdown, R/R). Vis evt. en anbefalet risiko % pr. trade (fx 1%).",
    team_leaderboard:
        "Motiver teams med en topliste. Vælg sortering (P/L eller win-rate) og periode.",
    news_feed:
        "Filtreret feed fra økonomikalenderen. Vælg valutaer og impact-niveau, så alle ved hvornår markedet kan blive volatilt.",
    calendar:
        "Kompakt kalender med de vigtigste kommende begivenheder.",
    announcements:
        "Små opslag fra community-ledelsen. Antallet styrer hvor meget det fylder.",
    integration_status:
        "Viser status for jeres integrationer (fx Discord). Hjælper med hurtig fejlfinding.",
    watchlist:
        "Letvægtsliste over nøglesymboler. Hurtig reference – ikke fuld charting.",
};

/* Component */
export default function DashboardDefaultsSection({ communityId }: { communityId: string }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ kind: "success" | "error"; msg: string } | null>(null);

    const [row, setRow] = useState<DefaultsRow>(DEFAULTS);
    const [teams, setTeams] = useState<Team[]>([]);
    const [isOfficial, setIsOfficial] = useState<boolean>(false);
    const [communityName, setCommunityName] = useState<string>("");

    const [selected, setSelected] = useState<WidgetKey | null>(null);

    function showToast(kind: "success" | "error", msg: string) {
        setToast({ kind, msg });
        window.clearTimeout((showToast as any)._t);
        (showToast as any)._t = window.setTimeout(() => setToast(null), 2400);
    }

    const markDirty = () => (window as any).ttSetDirty?.(true);

    /* initial load */
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                if (!communityId) return;

                const { data: comm, error: commErr } = await sb()
                    .from("communities")
                    .select("id,name,is_official")
                    .eq("id", communityId)
                    .single();
                if (commErr) throw commErr;
                setCommunityName(comm?.name || communityId.slice(0, 8));
                setIsOfficial(!!comm?.is_official);

                const { data: tms, error: tErr } = await sb()
                    .from("teams")
                    .select("id,name")
                    .eq("community_id", communityId)
                    .order("name", { ascending: true });
                if (tErr) throw tErr;
                setTeams((tms || []) as Team[]);

                const { data, error } = await sb()
                    .from("community_dashboard_defaults")
                    .select("*")
                    .eq("community_id", communityId)
                    .maybeSingle();
                if (error) throw error;

                if (!data) {
                    setRow({ ...DEFAULTS, community_id: communityId });
                } else {
                    setRow({
                        community_id: communityId,
                        layout: data.layout ?? DEFAULTS.layout,
                        widgets: { ...DEFAULTS.widgets, ...(data.widgets || {}) },
                        mandatory: Array.isArray(data.mandatory) ? data.mandatory : DEFAULTS.mandatory,
                        allowed: Array.isArray(data.allowed) ? data.allowed : DEFAULTS.allowed,
                    });
                }
            } catch (e: any) {
                showToast("error", e.message || "Kunne ikke hente defaults");
            } finally {
                setLoading(false);
            }
        })();
    }, [communityId]);

    /* registrer global save-hook */
    useEffect(() => {
        const hook = async () => {
            await doSave();
        };
        (window as any).ttSaveHooks = (window as any).ttSaveHooks || [];
        (window as any).ttSaveHooks.push(hook);
        return () => {
            (window as any).ttSaveHooks = ((window as any).ttSaveHooks || []).filter((fn: any) => fn !== hook);
        };
    }, [row]);

    async function doSave(closePanel?: boolean) {
        try {
            if (!communityId) return;
            setSaving(true);

            const enabledKeys = ALL_WIDGET_KEYS.filter((k) => row.widgets?.[k]?.enabled);
            const payload = {
                community_id: communityId,
                layout: {
                    community: (row.layout.community || []).filter((k) => enabledKeys.includes(k as WidgetKey)),
                    team: (row.layout.team || []).filter((k) => enabledKeys.includes(k as WidgetKey)),
                },
                widgets: row.widgets,
                mandatory: row.mandatory.filter((k) => enabledKeys.includes(k as WidgetKey)),
                allowed: row.allowed.filter((k) => enabledKeys.includes(k as WidgetKey)),
            };

            const { error } = await sb()
                .from("community_dashboard_defaults")
                .upsert(payload, { onConflict: "community_id" });
            if (error) throw error;

            (window as any).ttSetDirty?.(false);
            showToast("success", "Dashboard defaults gemt");
            if (closePanel) setSelected(null);
        } catch (e: any) {
            showToast("error", e.message || "Kunne ikke gemme");
        } finally {
            setSaving(false);
        }
    }

    /* state helpers */
    const setWidget = (key: WidgetKey, patch: any) => {
        setRow((prev) => {
            const next = { ...prev };
            next.widgets = { ...prev.widgets, [key]: { ...prev.widgets[key], ...patch } };
            markDirty();
            return next;
        });
    };
    const toggleAllowed = (key: WidgetKey) => {
        setRow((prev) => {
            const s = new Set(prev.allowed);
            s.has(key) ? s.delete(key) : s.add(key);
            markDirty();
            return { ...prev, allowed: Array.from(s) };
        });
    };
    const toggleMandatory = (key: WidgetKey) => {
        setRow((prev) => {
            const s = new Set(prev.mandatory);
            s.has(key) ? s.delete(key) : s.add(key);
            markDirty();
            return { ...prev, mandatory: Array.from(s) };
        });
    };
    const inArr = (arr: any[], k: string) => Array.isArray(arr) && arr.includes(k);

    const listItems = useMemo(() => ALL_WIDGET_KEYS, []);

    if (loading) {
        return (
            <div className="rounded-2xl p-6" style={{ backgroundColor: "#1a1717", border: "1px solid var(--tt-accent)" }}>
                <div style={{ color: "var(--tt-accent)" }}>Henter…</div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Top intro */}
            <div className="rounded-2xl p-5 mb-6" style={{ backgroundColor: "#1a1717", border: "1px solid var(--tt-accent)" }}>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-semibold mb-1" style={{ color: "#E9CC6A" }}>
                            Dashboard defaults
                        </h3>
                        <div className="text-sm" style={{ color: "var(--tt-accent)" }}>
                            Aktivt community: <b style={{ color: "#fff" }}>{communityName}</b>. Klik på en widget i venstre liste for at justere indstillinger.
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setRow((prev) => {
                                    const w = { ...prev.widgets };
                                    ALL_WIDGET_KEYS.forEach((k) => (w[k] = { ...w[k], enabled: true }));
                                    (window as any).ttSetDirty?.(true);
                                    return { ...prev, widgets: w };
                                });
                            }}
                            className="px-3 py-1.5 rounded-md text-sm"
                            style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                        >
                            Tilvælg alle
                        </button>
                        <button
                            onClick={() => {
                                setRow((prev) => {
                                    const w = { ...prev.widgets };
                                    ALL_WIDGET_KEYS.forEach((k) => (w[k] = { ...w[k], enabled: false }));
                                    (window as any).ttSetDirty?.(true);
                                    return { ...prev, widgets: w };
                                });
                            }}
                            className="px-3 py-1.5 rounded-md text-sm"
                            style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                        >
                            Fravælg alle
                        </button>
                    </div>
                </div>
            </div>

            {/* Venstre liste + højre panel */}
            <div className="grid gap-6 lg:grid-cols-[minmax(280px,420px)_1fr]">
                {/* Liste */}
                <aside className="rounded-2xl p-4" style={{ backgroundColor: "#1a1717", border: "1px solid var(--tt-accent)" }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium" style={{ color: "var(--tt-accent)" }}>
                            Widgets (klik for detaljer)
                        </div>
                        <div className="text-xs opacity-80" style={{ color: "var(--tt-accent)" }}>
                            {listItems.length} i alt
                        </div>
                    </div>

                    <ul className="space-y-2">
                        {listItems.map((key) => {
                            const w = row.widgets[key] || {};
                            const active = !!w.enabled;
                            const isSel = selected === key;
                            return (
                                <li key={key}>
                                    <button
                                        onClick={() => setSelected(key)}
                                        className={`w-full text-left rounded-xl px-3 py-3 transition ${isSel ? "border" : "hover:opacity-90"}`}
                                        style={{ backgroundColor: "#211d1d", borderColor: isSel ? "var(--tt-accent)" : "transparent" }}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium" style={{ color: "#E9CC6A" }}>
                                                        {TITLES[key]}
                                                    </div>
                                                    {w.recommended && (
                                                        <span className="px-2 py-0.5 rounded-md text-[11px]" style={{ backgroundColor: "var(--tt-accent)", color: "#211d1d" }}>
                              Anbefalet
                            </span>
                                                    )}
                                                </div>
                                                <div className="text-xs mt-0.5 truncate" style={{ color: "var(--tt-accent)" }}>
                                                    {DESCS[key]}
                                                </div>
                                            </div>
                                            <div className="shrink-0 pt-1">
                        <span
                            className="px-2 py-0.5 rounded-md text-[11px]"
                            style={{ border: "1px solid var(--tt-accent)", color: active ? "#76ed77" : "var(--tt-accent)" }}
                        >
                          {active ? "Aktiv" : "Inaktiv"}
                        </span>
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </aside>

                {/* Højre panel */}
                <section className="relative overflow-hidden rounded-2xl" style={{ border: "1px solid var(--tt-accent)", backgroundColor: "#1a1717", minHeight: 280 }}>
                    {!selected && (
                        <div className="h-full flex items-center justify-center p-10">
                            <div className="text-sm opacity-80 text-center" style={{ color: "var(--tt-accent)" }}>
                                Vælg en widget i venstre liste for at redigere dens indstillinger.
                            </div>
                        </div>
                    )}

                    {selected && (
                        <div className="absolute inset-0 p-6" style={{ animation: "slideIn .18s ease" }}>
                            <style>{`@keyframes slideIn{from{transform:translateX(12px);opacity:.0}to{transform:translateX(0);opacity:1}}`}</style>

                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                    <h3 className="text-base font-semibold" style={{ color: "#E9CC6A" }}>
                                        {TITLES[selected]}
                                    </h3>
                                    <div className="text-sm opacity-90" style={{ color: "var(--tt-accent)" }}>
                                        {LONG_DESCS[selected] || DESCS[selected]}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelected(null)}
                                    className="px-3 py-1.5 rounded-md text-sm"
                                    style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                                >
                                    Luk
                                </button>
                            </div>

                            <div className="mt-4 space-y-4">
                                {/* Fælles toggles — fjernet “Anbefalet”-toggle per ønske */}
                                <div className="flex flex-wrap items-center gap-4">
                                    <Toggle checked={!!row.widgets[selected]?.enabled} onChange={(v) => setWidget(selected, { enabled: v })} label="Aktivér" />
                                    <label className="inline-flex items-center gap-2">
                                        <input type="checkbox" checked={inArr(row.allowed, selected)} onChange={() => toggleAllowed(selected)} />
                                        <span style={{ color: "var(--tt-accent)" }}>Tillad at brugere kan til-/fravælge</span>
                                    </label>
                                    {isOfficial && selected === "announcements" && (
                                        <label className="inline-flex items-center gap-2">
                                            <input type="checkbox" checked={inArr(row.mandatory, selected)} onChange={() => toggleMandatory(selected)} />
                                            <span style={{ color: "var(--tt-accent)" }}>Gør obligatorisk</span>
                                        </label>
                                    )}
                                </div>

                                {renderDetail(selected, row, setWidget, teams)}

                                <div className="pt-2 flex items-center gap-2">
                                    <button
                                        onClick={() => doSave(true)}
                                        disabled={saving}
                                        className="px-3 py-2 rounded-lg text-sm font-medium"
                                        style={{ backgroundColor: saving ? "#333" : "#76ed77", color: saving ? "#888" : "#211d1d" }}
                                    >
                                        Gem ændringer
                                    </button>
                                    <Hint>Gem lukker panelet. Din globale “Gem” virker også.</Hint>
                                </div>
                            </div>
                        </div>
                    )}
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
        </div>
    );
}

/* Detail-render pr. widget */
function renderDetail(
    key: WidgetKey,
    row: DefaultsRow,
    setWidget: (k: WidgetKey, patch: any) => void,
    teams: Team[]
) {
    const w = row.widgets[key] || {};
    const Row = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
        <label className="block text-sm">
            <div className="mb-1 flex items-center gap-2" style={{ color: "var(--tt-accent)" }}>
                <span>{label}</span>
                {hint && <InfoIcon title={hint} />}
            </div>
            {children}
        </label>
    );

    // scope (back-compat)
    const effectiveScope = (() => {
        const scope = w.scope || {};
        const includeCommunity =
            typeof scope.includeCommunity === "boolean"
                ? scope.includeCommunity
                : (w.source ? w.source === "community" : true);
        const team_ids: string[] =
            Array.isArray(scope.team_ids) && scope.team_ids.length > 0
                ? scope.team_ids
                : w.team_id
                    ? [w.team_id]
                    : [];
        return { includeCommunity, team_ids };
    })();

    function TeamStarPicker({
                                value,
                                onChange,
                            }: {
        value: string[];
        onChange: (ids: string[]) => void;
    }) {
        const [q, setQ] = useState("");
        const set = new Set(value);
        const list = teams.filter((t) => (t.name || "").toLowerCase().includes(q.toLowerCase()));

        return (
            <div
                className="rounded-lg p-2"
                style={{ border: "1px solid var(--tt-accent)" }}
                onClick={(e) => e.stopPropagation()} // klik her skal ikke toggle andre ting
            >
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="text-xs" style={{ color: "var(--tt-accent)" }}>
                        Klik ⭐ for at (fra)vælge teams
                    </div>
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Søg team…"
                        className="rounded px-2 py-1 text-xs"
                        style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "#fff" }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>

                {teams.length === 0 ? (
                    <div className="text-xs opacity-80 px-1 py-2" style={{ color: "var(--tt-accent)" }}>
                        Ingen teams endnu.
                    </div>
                ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {list.map((t) => {
                            const on = set.has(t.id);
                            return (
                                <li
                                    key={t.id}
                                    className="flex items-center justify-between rounded-md px-2 py-1"
                                    style={{ background: "#211d1d", border: "1px solid color-mix(in srgb, var(--tt-accent) 25%, transparent)" }}
                                >
                  <span className="truncate" style={{ color: "var(--tt-accent)" }}>
                    {t.name || t.id.slice(0, 6)}
                  </span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const next = new Set(value);
                                            on ? next.delete(t.id) : next.add(t.id);
                                            onChange(Array.from(next));
                                        }}
                                        className="ml-2 text-lg leading-none"
                                        title={on ? "Fjern" : "Tilføj"}
                                        style={{ color: on ? "#ffd54f" : "var(--tt-accent)" }}
                                    >
                                        {on ? "★" : "☆"}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        );
    }

    function ScopeBlock() {
        return (
            <div className="space-y-3">
                <label
                    className="inline-flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    <input
                        type="checkbox"
                        checked={!!effectiveScope.includeCommunity}
                        onChange={(e) =>
                            setWidget(key, {
                                scope: { ...effectiveScope, includeCommunity: e.target.checked },
                                source: undefined,
                                team_id: undefined,
                            })
                        }
                    />
                    <span style={{ color: "var(--tt-accent)" }}>Medtag community-total</span>
                </label>

                <div onClick={(e) => e.stopPropagation()}>
                    <div className="mb-1 text-sm" style={{ color: "var(--tt-accent)" }}>
                        Udvalgte teams (valgfrit)
                    </div>
                    <TeamStarPicker
                        value={effectiveScope.team_ids}
                        onChange={(ids) =>
                            setWidget(key, {
                                scope: { ...effectiveScope, team_ids: ids },
                                source: undefined,
                                team_id: undefined,
                            })
                        }
                    />
                </div>
            </div>
        );
    }

    /* Widget-felter */
    switch (key) {
        case "announcements":
            return (
                <Row label="Antal opslag" hint="Hvor mange opslag vises på dashboardet">
                    <NumberField
                        value={w.limit ?? 3}
                        min={1}
                        max={10}
                        onChange={(num) => setWidget(key, { limit: num })}
                        style={{ maxWidth: 120 }}
                    />
                    <Hint>Vores anbefaling: 3</Hint>
                </Row>
            );

        case "pl_overview":
            return (
                <>
                    <ScopeBlock />
                    <Row label="Perioder" hint="Vælg hvilke perioder vises">
                        <div className="flex flex-wrap items-center gap-4">
                            {["day", "week", "month"].map((p) => (
                                <label key={p} className="inline-flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={Array.isArray(w.periods) && w.periods.includes(p)}
                                        onChange={(e) => {
                                            const curr: string[] = Array.isArray(w.periods) ? [...w.periods] : [];
                                            if (e.target.checked) {
                                                if (!curr.includes(p)) curr.push(p);
                                            } else {
                                                const i = curr.indexOf(p);
                                                if (i >= 0) curr.splice(i, 1);
                                            }
                                            setWidget(key, { periods: curr });
                                        }}
                                    />
                                    <span style={{ color: "var(--tt-accent)" }}>{p}</span>
                                </label>
                            ))}
                        </div>
                    </Row>
                </>
            );

        case "open_signals":
            return (
                <>
                    <ScopeBlock />
                    <Row label="Antal" hint="Hvor mange åbne signaler vises">
                        <NumberField
                            value={w.limit ?? 6}
                            min={1}
                            max={20}
                            onChange={(num) => setWidget(key, { limit: num })}
                            style={{ maxWidth: 120 }}
                        />
                        <Hint>Anbefalet: 6</Hint>
                    </Row>
                </>
            );

        case "team_leaderboard":
            return (
                <>
                    <Row label="Top N" hint="Hvor mange vises">
                        <NumberField
                            value={w.top_n ?? 5}
                            min={3}
                            max={10}
                            onChange={(num) => setWidget(key, { top_n: num })}
                            style={{ maxWidth: 120 }}
                        />
                        <Hint>Anbefalet: 5</Hint>
                    </Row>
                    <Row label="Periode">
                        <Select
                            value={w.range_days ?? 30}
                            onChange={(e) => setWidget(key, { range_days: Number(e.target.value || 30) })}
                            style={{ maxWidth: 160 }}
                        >
                            <option value={30}>30 dage</option>
                            <option value={90}>90 dage</option>
                        </Select>
                    </Row>
                    <Row label="Sortering">
                        <Select
                            value={w.sort_by ?? "pl"}
                            onChange={(e) => setWidget(key, { sort_by: e.target.value })}
                            style={{ maxWidth: 180 }}
                        >
                            <option value="pl">P/L</option>
                            <option value="win_rate">Win-rate</option>
                        </Select>
                    </Row>
                </>
            );

        case "news_feed":
            return (
                <>
                    <Row label="Valutaer" hint="Kommasepareret: USD,EUR,GBP">
                        <Input
                            value={(w.currencies || []).join(",")}
                            onChange={(e) =>
                                setWidget(key, {
                                    currencies: e.target.value
                                        .split(",")
                                        .map((s: string) => s.trim())
                                        .filter(Boolean),
                                })
                            }
                            placeholder="USD,EUR"
                        />
                    </Row>
                    <Row label="Impact" hint="Hold Ctrl/Cmd for at vælge flere">
                        <Select
                            multiple
                            value={w.impact || []}
                            onChange={(e) => {
                                const arr = Array.from(e.target.selectedOptions).map((o) => o.value);
                                setWidget(key, { impact: arr });
                            }}
                            style={{ minHeight: 90, maxWidth: 220 }}
                        >
                            <option value="high">High (rød)</option>
                            <option value="medium">Medium (orange)</option>
                            <option value="low">Low (grøn)</option>
                        </Select>
                    </Row>
                    <Row label="Antal">
                        <NumberField
                            value={w.limit ?? 5}
                            min={1}
                            max={20}
                            onChange={(num) => setWidget(key, { limit: num })}
                            style={{ maxWidth: 120 }}
                        />
                        <Hint>Anbefalet: 5</Hint>
                    </Row>
                </>
            );

        case "calendar":
            return (
                <Row label="Antal">
                    <NumberField
                        value={w.limit ?? 4}
                        min={1}
                        max={10}
                        onChange={(num) => setWidget(key, { limit: num })}
                        style={{ maxWidth: 120 }}
                    />
                    <Hint>Anbefalet: 4</Hint>
                </Row>
            );

        case "risk_meter":
            return (
                <>
                    <ScopeBlock />
                    <Row label="Periode">
                        <Select
                            value={w.range_days ?? 90}
                            onChange={(e) => setWidget(key, { range_days: Number(e.target.value || 90) })}
                            style={{ maxWidth: 160 }}
                        >
                            <option value={30}>30 dage</option>
                            <option value={90}>90 dage</option>
                        </Select>
                    </Row>
                    <Row label="Enhed">
                        <Select value={w.units ?? "R"} onChange={(e) => setWidget(key, { units: e.target.value })} style={{ maxWidth: 180 }}>
                            <option value="R">R</option>
                            <option value="currency">Valuta</option>
                        </Select>
                    </Row>
                    <Row label="Community anbefaler" hint="Risk % pr. trade der vises til brugere">
                        <NumberField
                            value={w.recommended_risk_percent ?? 1.0}
                            min={0}
                            onChange={(num) => setWidget(key, { recommended_risk_percent: num })}
                            style={{ maxWidth: 140 }}
                        />
                        <Hint>Anbefalet: 1.0%</Hint>
                    </Row>
                </>
            );

        case "equity_curve":
            return (
                <>
                    <ScopeBlock />
                    <Row label="Periode">
                        <Select
                            value={w.range_days ?? 30}
                            onChange={(e) => setWidget(key, { range_days: Number(e.target.value || 30) })}
                            style={{ maxWidth: 160 }}
                        >
                            <option value={30}>30 dage</option>
                            <option value={90}>90 dage</option>
                        </Select>
                    </Row>
                </>
            );

        case "win_rate":
            return (
                <>
                    <ScopeBlock />
                    <Row label="Perioder">
                        <div className="flex flex-wrap items-center gap-4">
                            {[7, 30, 90].map((n) => (
                                <label key={`wr-${n}`} className="inline-flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={Array.isArray(w.periods) && w.periods.includes(n)}
                                        onChange={(e) => {
                                            const curr: number[] = Array.isArray(w.periods) ? [...w.periods] : [];
                                            if (e.target.checked) {
                                                if (!curr.includes(n)) curr.push(n);
                                            } else {
                                                const i = curr.indexOf(n);
                                                if (i >= 0) curr.splice(i, 1);
                                            }
                                            setWidget(key, { periods: curr });
                                        }}
                                    />
                                    <span style={{ color: "var(--tt-accent)" }}>{n} dage</span>
                                </label>
                            ))}
                        </div>
                    </Row>
                    <Row label="Minimum trades">
                        <NumberField
                            value={w.min_trades ?? 5}
                            min={0}
                            onChange={(num) => setWidget(key, { min_trades: num })}
                            style={{ maxWidth: 140 }}
                        />
                        <Hint>Anbefalet: 5</Hint>
                    </Row>
                </>
            );

        case "integration_status":
            return (
                <Row label="Integrationer" hint="Kommasepareret liste (visningsfilter)">
                    <Input
                        value={(w.integrations || []).join(",")}
                        onChange={(e) =>
                            setWidget(key, {
                                integrations: e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                            })
                        }
                        placeholder="discord,mt5"
                    />
                </Row>
            );

        case "watchlist":
            return (
                <>
                    <Row label="Symboler" hint="Kommasepareret (EURUSD,XAUUSD,AAPL)">
                        <Input
                            value={(w.symbols || []).join(",")}
                            onChange={(e) =>
                                setWidget(key, {
                                    symbols: e.target.value
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean),
                                })
                            }
                            placeholder="EURUSD,XAUUSD"
                        />
                    </Row>
                    <Row label="Antal">
                        <NumberField
                            value={w.limit ?? 6}
                            min={1}
                            max={20}
                            onChange={(num) => setWidget(key, { limit: num })}
                            style={{ maxWidth: 140 }}
                        />
                        <Hint>Anbefalet: 6</Hint>
                    </Row>
                </>
            );

        default:
            return null;
    }
}
