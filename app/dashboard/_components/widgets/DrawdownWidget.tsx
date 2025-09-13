"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

/**
 * DrawdownWidget (hydration-safe)
 * - KPI: Maks. drawdown & Aktuel drawdown
 * - Area chart af drawdown-serien (under nul-linje)
 * - Egen tooltip (ingen <title>-noder i SVG)
 * - Demo-data: deterministisk og fast-ankret i UTC (ingen afhængighed af "nu")
 */

type Props = { instanceId: string };

// ====== Seriegen: equity -> drawdown ======
type Pt = { t: number; equity: number };

/** Deterministisk equity-serie (fast UTC-anker) */
function synthEquityPts(n: number, rng: () => number): Pt[] {
    // Fast anker: 2024-01-01 00:00:00Z
    const BASE_UTC = Date.UTC(2024, 0, 1, 0, 0, 0, 0);
    const DAY = 24 * 60 * 60 * 1000;

    // Start equity = 10_000. Dagsafkast ~ N(0, 0.8%) (approks.)
    const pts: Pt[] = [];
    let eq = 10000;

    for (let i = 0; i < n; i++) {
        const t = BASE_UTC + i * DAY;
        // Box-Muller light: sum af to uniforms → “klokke-agtig”
        const retPct = ((rng() + rng() - 1) * 0.8) / 100; // ca. -0.8%..+0.8%
        eq = eq * (1 + retPct);
        pts.push({ t, equity: eq });
    }
    return pts;
}

/** Omregn equity-serie til drawdown% (negativ eller 0) */
function toDrawdownPct(pts: Pt[]): { t: number; dd: number }[] {
    let peak = -Infinity;
    return pts.map((p) => {
        peak = Math.max(peak, p.equity);
        const dd = peak > 0 ? (p.equity - peak) / peak : 0; // <= 0
        return { t: p.t, dd };
    });
}

/** Periodevindue målt baglæns fra endMs */
function periodWindowFromEnd(endMs: number, p: PeriodValue) {
    const DAY = 24 * 60 * 60 * 1000;
    if (p === "day") return { startMs: endMs - 1 * DAY, endMs };
    if (p === "week") return { startMs: endMs - 7 * DAY, endMs };
    return { startMs: endMs - 30 * DAY, endMs }; // “måned” = 30d rullende
}

/** dd/mm (UTC) */
function ddmmUTC(ms: number) {
    const d = new Date(ms);
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}`;
}

export default function DrawdownWidget({ instanceId }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");

    // Deterministisk RNG pr. instans
    const rng = useMemo(() => seededRng(`${instanceId}::drawdown`), [instanceId]);

    // Serie (fast-ankret)
    const equity = useMemo(() => synthEquityPts(220, rng), [rng]);
    const ddSeries = useMemo(() => toDrawdownPct(equity), [equity]);

    // Stabilt periodevindue (baglæns fra seriens sidste punkt)
    const filtered = useMemo(() => {
        if (!ddSeries.length) return [] as typeof ddSeries;
        const endMs = ddSeries[ddSeries.length - 1].t;
        const { startMs } = periodWindowFromEnd(endMs, period);
        return ddSeries.filter((p) => p.t >= startMs && p.t <= endMs);
    }, [ddSeries, period]);

    const hasData = filtered.length > 0;

    // KPI’er
    const { maxDD, curDD } = useMemo(() => {
        if (!hasData) return { maxDD: 0, curDD: 0 };
        let minDD = 0; // mest negativ
        for (const p of filtered) minDD = Math.min(minDD, p.dd);
        const current = filtered[filtered.length - 1].dd;
        return { maxDD: minDD, curDD: current };
    }, [filtered, hasData]);

    return (
        <div
            className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800"
            id={`${instanceId}-panel`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Drawdown</div>
                    <HelpTip text="Hvor meget du er faldet fra seneste top. Maks = værste dyk i perioden. Aktuel = dyk fra den seneste top til nu." />
                </div>
                <PeriodToggle instanceId={instanceId} slug="drawdown" defaultValue="day" onChange={setPeriod} />
            </div>

            {!hasData ? (
                <div className="h-28 rounded-xl border border-dashed border-neutral-700 flex items-center justify-center text-neutral-400 text-sm">
                    Ingen data i perioden.
                </div>
            ) : (
                <div className="flex items-start gap-4">
                    {/* KPI’er */}
                    <div className="flex flex-col gap-2 min-w-[160px]">
                        <Kpi label="Maks drawdown" value={maxDD} />
                        <Kpi label="Aktuel drawdown" value={curDD} />
                    </div>

                    {/* Chart */}
                    <AreaChart
                        values={filtered.map((p) => p.dd)} // negatives
                        labels={filtered.map((p) => ddmmUTC(p.t))}
                        width={420}
                        height={120}
                    />
                </div>
            )}

            {/* A11y */}
            <p className="sr-only">
                Maks drawdown {pctStr(maxDD)}. Aktuel drawdown {pctStr(curDD)}.
            </p>
        </div>
    );
}

/* =================== UI subkomponenter =================== */

function Kpi({ label, value }: { label: string; value: number }) {
    // value er negativ eller 0
    const color = value <= -0.1 ? "#ef4444" : value <= -0.03 ? "#D4AF37" : "#10b981"; // dyb rød / guld / grøn
    return (
        <div className="rounded-lg border border-neutral-700 p-3">
            <div className="text-sm text-neutral-400">{label}</div>
            <div className="text-2xl font-semibold" style={{ color }}>
                {pctStr(value)}
            </div>
        </div>
    );
}

function pctStr(v: number) {
    if (!isFinite(v)) return "—";
    return (v * 100).toFixed(1).replace(".", ",") + "%";
}

/** Simpel area chart med egen tooltip (ingen <title>-noder) */
function AreaChart({
                       values,  // negative tal (dd), ex: -0.12
                       labels,  // dd/mm
                       width,
                       height,
                   }: {
    values: number[];
    labels: string[];
    width: number;
    height: number;
}) {
    const pad = 6;
    const w = Math.max(width, 80);
    const h = Math.max(height, 60);

    // range: fra 0 (top) ned til min (bund)
    const min = Math.min(...values, 0);
    const max = 0;
    const span = max - min || 1;

    const toX = (i: number) => (values.length === 1 ? pad : pad + (i * (w - pad * 2)) / (values.length - 1));
    const toY = (v: number) => {
        const norm = (v - min) / span; // v er <= 0
        return h - pad - norm * (h - pad * 2);
    };

    const pathD =
        values
            .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`)
            .join(" ") +
        ` L ${toX(values.length - 1)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`;

    // hover tooltip (egen, ikke <title>)
    const [active, setActive] = useState<{ i: number; x: number; y: number } | null>(null);

    return (
        <div className="relative" style={{ width: w, height: h }}>
            <svg width={w} height={h}>
                {/* baseline ved 0 */}
                <path d={`M ${pad} ${toY(0)} L ${w - pad} ${toY(0)}`} stroke="#3a3a3a" strokeWidth={1} fill="none" />

                {/* area fyld */}
                <path d={pathD} fill="#ef4444" opacity={0.18} />

                {/* kantlinje */}
                <path
                    d={values.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ")}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeLinecap="round"
                />

                {/* punkter (hitbox + prik) */}
                <g>
                    {values.map((v, i) => {
                        const cx = toX(i);
                        const cy = toY(v);
                        return (
                            <g key={i}>
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={8}
                                    fill="transparent"
                                    onMouseEnter={() => setActive({ i, x: cx, y: cy })}
                                    onMouseLeave={() => setActive(null)}
                                />
                                <circle cx={cx} cy={cy} r={2.5} fill="#ef4444" />
                                {/* Ingen <title> her! */}
                            </g>
                        );
                    })}
                </g>
            </svg>

            {/* Egen tooltip */}
            {active && (
                <div
                    role="tooltip"
                    className="pointer-events-none absolute z-10 rounded-md border border-neutral-700 bg-neutral-900 text-neutral-100 text-xs px-2 py-1 shadow-lg"
                    style={{
                        left: Math.max(0, Math.min(w - 120, active.x - 60)),
                        top: Math.max(0, active.y - 28),
                    }}
                >
                    {labels[active.i]} · {pctStr(values[active.i])}
                </div>
            )}
        </div>
    );
}
