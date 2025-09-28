"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";
import { usePrefs } from "@/lib/usePrefs";
import { formatDate } from "@/lib/format";

/**
 * AccountGrowthWidget v1.0
 * - KPI: procentvis kontovækst for valgt periode (fra periodens start til nu)
 * - Line chart: equity i % relativt til periodens start (=0%)
 * - Periode: Dag/Uge/Måned
 * - Dummy equity-kurve; byt ud med backend når klar
 */

type Props = { instanceId: string };

export default function AccountGrowthWidget({ instanceId }: Props) {
    const { prefs } = usePrefs();
    const [period, setPeriod] = useState<PeriodValue>("day");

    // Deterministisk RNG (for at undgå hydration-mismatch)
    const rng = useMemo(() => seededRng(`${instanceId}::accountGrowth`), [instanceId]);

    // ===== Dummy equity-kurve (erstattes af backend) =====
    const fullSeries = useMemo(() => synthEquityCurve(220, 10000, rng), [rng]);

    // Filtrér til valgt periode
    const { points, labels } = useMemo(() => {
        const now = new Date();
        const { startMs, endMs } = periodWindow(now, period);
        const pts = fullSeries.filter((p) => p.t >= startMs && p.t <= endMs);
        const safe = pts.length ? pts : fullSeries.slice(-24); // fallback
        return {
            points: safe,
            // 👉 eneste formatter-ændring: brug formatDate + prefs
            labels: safe.map((p) => formatDate(p.t, prefs)),
        };
    }, [fullSeries, period, prefs]);

    const hasData = points.length > 1;
    const startEquity = hasData ? points[0].v : 0;

    // Normaliser til % fra periodens start (0% baseline)
    const seriesPct = useMemo(() => {
        if (!hasData || startEquity <= 0) return [];
        return points.map((p) => ((p.v / startEquity) - 1) * 100);
    }, [points, hasData, startEquity]);

    // KPI: Δ% fra start til sidste punkt
    const kpiPct = hasData && startEquity > 0
        ? ((points[points.length - 1].v - startEquity) / startEquity) * 100
        : 0;

    // ✅ FIX: definer kpiText i parent
    const kpiText = hasData && startEquity > 0 ? formatPct(kpiPct) : "—";

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800" id={`${instanceId}-panel`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Kontovækst %</div>
                    <HelpTip>Relativ equity (0% = periodens start)</HelpTip>
                </div>
                <PeriodToggle value={period} onChange={setPeriod} />
            </div>

            {/* KPI */}
            <div className="mb-3">
                <div className="text-sm text-neutral-300">Ændring siden start</div>
                <div className="text-3xl font-semibold text-yellow-300">{kpiText}</div>
            </div>

            {/* Chart */}
            <LineChartPct values={seriesPct} labels={labels} />
        </div>
    );
}

/* =================== Chart (uændret, bortset fra fjernet kpiText-linje) =================== */

function LineChartPct({ values, labels }: { values: number[]; labels?: string[] }) {
    const hasData = values.length > 1;
    const w = 560, h = 160, pad = 10;
    const minV = Math.min(...values, 0), maxV = Math.max(...values, 0);
    const span = Math.max(1, maxV - minV);
    const y = (v: number) => h - pad - ((v - minV) / span) * (h - pad * 2);
    const x = (i: number) => pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);

    return (
        <div className="relative rounded-xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-2">
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40">
                {/* baseline 0% */}
                <line x1={0} x2={w} y1={y(0)} y2={y(0)} stroke="#444" strokeDasharray="4 4" />

                {/* fyld */}
                <path
                    d={values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ")}
                    fill="rgba(212,175,55,0.15)"
                    stroke="none"
                />
                {/* linje */}
                <path
                    d={values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ")}
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth={2}
                />

                {/* punkter + tooltips */}
                {values.map((v, i) => (
                    <g key={i}>
                        <circle cx={x(i)} cy={y(v)} r={3} fill="#D4AF37" />
                        <title>{(labels?.[i] ?? `#${i + 1}`) + " · " + formatPct(v)}</title>
                    </g>
                ))}
            </svg>
        </div>
    );
}

/* =================== Helpers & dummy =================== */

type Point = { t: number; v: number };

function formatPct(v: number) {
    const sign = v > 0 ? "+" : v < 0 ? "−" : "";
    const abs = Math.abs(v).toFixed(1).replace(".", ",");
    return `${sign}${abs}%`;
}

// Deterministisk dd/mm (UTC) for stabil SSR/CSR
function formatDayMonth(tMs: number) {
    const d = new Date(tMs);
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}`;
}

function synthEquityCurve(days: number, startValue: number, rng: () => number): Point[] {
    const now = new Date();
    const pts: Point[] = [];
    let equity = startValue;

    for (let d = days; d >= 0; d--) {
        const day = new Date(now);
        day.setDate(now.getDate() - d);

        const weekday = day.getDay();
        const vol = weekday === 0 || weekday === 6 ? 0.002 : 0.004;
        const drift = 0.0007;
        const shock = rng() < 0.06 ? (rng() < 0.5 ? -0.03 : 0.025) : 0;
        const r = drift + (rng() - 0.5) * vol * 2 + shock;

        equity = Math.max(100, equity * (1 + r));
        pts.push({ t: day.setHours(16, 0, 0, 0), v: Math.round(equity) });
    }
    return pts;
}

function periodWindow(now: Date, p: PeriodValue) {
    const end = now.getTime();
    if (p === "day") {
        const start = new Date(now); start.setHours(0, 0, 0, 0);
        return { startMs: start.getTime(), endMs: end };
    }
    if (p === "week") {
        const start = new Date(now);
        const day = start.getDay() || 7; // 1..7 (mandag=1)
        start.setDate(start.getDate() - (day - 1));
        start.setHours(0, 0, 0, 0);
        return { startMs: start.getTime(), endMs: end };
    }
    // month
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startMs: start.getTime(), endMs: end };
}
