"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

/**
 * AccountGrowthWidget v1.0
 * - KPI: procentvis kontovækst for valgt periode (fra periodens start til nu)
 * - Line chart: equity i % relativt til periodens start (=0%)
 * - Periode: Dag/Uge/Måned
 * - Matcher dark/quiet stil, tooltips på punkter
 * - Dummy equity-kurve; byt ud med backend når klar
 */

type Props = { instanceId: string };

export default function AccountGrowthWidget({ instanceId }: Props) {
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
            // Deterministisk datoformat (UTC) for at undgå SSR/CSR locale-forskelle
            labels: safe.map((p) => formatDayMonth(p.t)),
        };
    }, [fullSeries, period]);

    const hasData = points.length > 1;
    const startEquity = hasData ? points[0].v : 0;

    // Normaliser til % fra periodens start (0% baseline)
    const seriesPct = useMemo(() => {
        if (!hasData || startEquity <= 0) return [];
        return points.map((p) => ((p.v / startEquity) - 1) * 100);
    }, [points, hasData, startEquity]);

    // KPI: Δ% fra start til sidste punkt
    const kpiPct = hasData && startEquity > 0
        ? ((points[points.length - 1].v / startEquity) - 1) * 100
        : 0;

    const kpiColor = kpiPct > 0.5 ? "#10b981" : kpiPct < -0.5 ? "#ef4444" : "#D4AF37";
    const kpiText = hasData && startEquity > 0 ? formatPct(kpiPct) : "—";

    return (
        <div
            className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800"
            id={`${instanceId}-panel`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Kontovækst %</div>
                    <HelpTip text="Procentvis ændring i equity siden periodens start. Grafen viser equity relativt til start (= 0%)." />
                </div>
                <PeriodToggle instanceId={instanceId} slug="accountGrowth" defaultValue="day" onChange={setPeriod} />
            </div>

            {/* Body */}
            {hasData && startEquity > 0 ? (
                <div className="flex items-center gap-6">
                    {/* KPI (kompakt til 3–4 cols) */}
                    <div className="flex flex-col">
                        <div className="text-sm text-neutral-400">Ændring siden start</div>
                        <div className="text-3xl font-semibold" style={{ color: kpiColor }} aria-live="polite">
                            {kpiText}
                        </div>
                    </div>

                    {/* Line chart med tooltips */}
                    <div className="ml-auto">
                        <LineChartPct
                            values={seriesPct}
                            labels={labels}
                            width={320}
                            height={110}
                        />
                        <div className="mt-1 text-[11px] text-neutral-400">
                            Relativ equity (0% = periodens start)
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-neutral-500">
                    — Ingen equity data i perioden eller ugyldig startbalance.
                </div>
            )}

            {/* A11y */}
            <p className="sr-only">
                Kontovækst i procent for valgt periode: {kpiText}.
            </p>
        </div>
    );
}

/* =================== Chart =================== */

function LineChartPct({
                          values,
                          labels,
                          width,
                          height,
                      }: {
    values: number[];
    labels?: string[];
    width: number;
    height: number;
}) {
    const [active, setActive] = useState<{ i: number; x: number; y: number } | null>(null);

    const pad = 8;
    const w = Math.max(width, 160);
    const h = Math.max(height, 80);

    // Inkludér 0 i min/max så baseline altid er synlig
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    const span = max - min || 1;

    const toX = (i: number) => (values.length === 1 ? pad : pad + (i * (w - pad * 2)) / (values.length - 1));
    const toY = (v: number) => {
        const norm = (v - min) / span;
        return h - pad - norm * (h - pad * 2);
    };

    const path = values.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
    const area = `${path} L ${toX(values.length - 1)} ${h - pad} L ${toX(0)} ${h - pad} Z`;

    return (
        <div className="relative" style={{ width: w, height: h }}>
            <svg width={w} height={h}>
                {/* 0%-baseline */}
                <line x1={pad} x2={w - pad} y1={toY(0)} y2={toY(0)} stroke="#3a3a3a" strokeWidth={1} />

                {/* area fill (svag) */}
                <path d={area} fill="#D4AF37" opacity={0.12} />
                {/* hovedlinje */}
                <path d={path} fill="none" stroke="#D4AF37" strokeWidth={2} strokeLinecap="round" />

                {/* punkter + hover hitbox */}
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
                                <circle cx={cx} cy={cy} r={2.5} fill="#D4AF37" />
                                <title>{(labels?.[i] ?? `#${i + 1}`) + " · " + formatPct(v)}</title>
                            </g>
                        );
                    })}
                </g>
            </svg>

            {/* custom tooltip */}
            {active && (
                <div
                    role="tooltip"
                    className="pointer-events-none absolute z-10 rounded-md border border-neutral-700 bg-neutral-900 text-neutral-100 text-xs px-2 py-1 shadow-lg"
                    style={{
                        left: Math.max(0, Math.min(w - 140, active.x - 70)),
                        top: Math.max(0, active.y - 30),
                    }}
                >
                    <div className="font-medium">{labels?.[active.i] ?? `#${active.i + 1}`}</div>
                    <div>{formatPct(values[active.i])}</div>
                </div>
            )}
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

/** Syntetisk equity-kurve med svag opdrift og lejlighedsvise shocks. */
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
    let start: number;
    if (p === "day") {
        const s = new Date(now);
        s.setHours(0, 0, 0, 0);
        start = s.getTime();
    } else if (p === "week") {
        start = end - 7 * 24 * 60 * 60 * 1000;
    } else {
        start = end - 30 * 24 * 60 * 60 * 1000;
    }
    return { startMs: start, endMs: end };
}
