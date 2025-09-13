"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

/**
 * ExpectancyWidget v1.3 (hydration-safe)
 * - KPI: Expectancy pr. trade i display currency (fallback USD)
 * - Sparkline: EV i display currency for de seneste 12 delperioder
 * - Tooltip: "label · +$X.XX"
 * - Dummy data; byt ud med backend når klar
 */

type Props = { instanceId: string };

/* ===== Display currency (samme approach som Profit/Loss) ===== */
function useDisplayCurrency() {
    return "USD" as const; // TODO: læs fra brugerens indstillinger
}
function makeCurrencyFormatter(currency: string) {
    try {
        return new Intl.NumberFormat("en-US", { style: "currency", currency });
    } catch {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    }
}

export default function ExpectancyWidget({ instanceId }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");
    const displayCurrency = useDisplayCurrency();
    const fmt = makeCurrencyFormatter(displayCurrency);

    // ===== Dummy closed trades med R og risk pr. trade i valuta (deterministisk) =====
    const rng = useMemo(() => seededRng(`${instanceId}::expectancy`), [instanceId]);
    const trades = useMemo(() => synthClosedTrades(150, rng), [rng]);

    // Filtrer trades i valgt periode (UTC-vinduer)
    const inPeriod = useMemo(() => {
        const now = new Date();
        const { startMs, endMs } = periodWindowUTC(now, period);
        return trades.filter((t) => t.closedAt >= startMs && t.closedAt <= endMs);
    }, [trades, period]);

    const hasData = inPeriod.length > 0;

    // Expectancy i R
    const expectancyR = useMemo(() => {
        if (!hasData) return 0;
        const rValues = inPeriod.map((t) => t.rMultiple);
        const wins = rValues.filter((r) => r > 0);
        const losses = rValues.filter((r) => r <= 0).map((r) => Math.abs(r));
        const pWin = rValues.length ? wins.length / rValues.length : 0;
        const pLoss = 1 - pWin;
        const avgWinR = wins.length ? mean(wins) : 0;
        const avgLossR = losses.length ? mean(losses) : 0;
        return pWin * avgWinR - pLoss * avgLossR;
    }, [inPeriod, hasData]);

    // Expectancy i valuta = EV(R) * typisk risk (median) i valuta
    const expectancyCurrency = useMemo(() => {
        if (!hasData) return 0;
        const risks = inPeriod.map((t) => t.riskCurrency);
        const typicalRisk = median(risks) || 0;
        return expectancyR * typicalRisk;
    }, [inPeriod, hasData, expectancyR]);

    const kpiValue = expectancyCurrency;
    const kpiText = formatCurrencySigned(kpiValue, fmt);
    const kpiColor = kpiValue > 0 ? "#10b981" : kpiValue < 0 ? "#ef4444" : "#D4AF37";

    // Sparkline: EV i currency for 12 sidste delperioder + labels (UTC)
    const { points: sparkCurrency, labels: sparkLabels } = useMemo(() => {
        const now = new Date();
        const windows = lastNWindowsUTC(now, period, 12);
        const pts: number[] = [];
        const labels: string[] = [];

        for (const w of windows) {
            const inWin = trades.filter((t) => t.closedAt >= w.start && t.closedAt < w.end);
            const vals = inWin.map((t) => t.rMultiple);
            const risks = inWin.map((t) => t.riskCurrency);

            let evR = 0;
            if (vals.length) {
                const wins = vals.filter((r) => r > 0);
                const losses = vals.filter((r) => r <= 0).map((r) => Math.abs(r));
                const pWin = wins.length / vals.length;
                const pLoss = 1 - pWin;
                const avgWinR = wins.length ? mean(wins) : 0;
                const avgLossR = losses.length ? mean(losses) : 0;
                evR = pWin * avgWinR - pLoss * avgLossR;
            }
            const typicalRisk = risks.length ? median(risks) : 0;
            pts.push(evR * typicalRisk); // ← currency-værdi for vinduet
            labels.push(windowLabelUTC(w, period));
        }
        return { points: pts, labels };
    }, [trades, period]);

    return (
        <div
            className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800"
            id={`${instanceId}-panel`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Expectancy (EV)</div>
                    <HelpTip text="Forventet værdi pr. trade. EV = p(win)×avgWin − p(loss)×avgLoss." />
                </div>
                <PeriodToggle instanceId={instanceId} slug="expectancy" defaultValue="day" onChange={setPeriod} />
            </div>

            {/* Indhold: KPI + sparkline */}
            {hasData ? (
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <div className="text-sm text-neutral-400">EV pr. trade ({displayCurrency})</div>
                        <div className="text-3xl font-semibold" style={{ color: kpiColor }} aria-live="polite">
                            {kpiText}
                        </div>
                    </div>

                    <div className="ml-auto">
                        <Sparkline
                            data={sparkCurrency}
                            labels={sparkLabels}
                            width={200}
                            height={56}
                            format={(v, label) => `${label} · ${formatCurrencySigned(v, fmt)}`}
                        />
                        <div className="mt-1 text-[11px] text-neutral-400">
                            Trend (seneste 12 {periodLabel(period, true)})
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-neutral-500">— Ingen lukkede trades i valgt periode.</div>
            )}

            {/* A11y */}
            <p className="sr-only">
                Expectancy i {displayCurrency} for valgt periode ({periodLabel(period)}): {kpiText}.
            </p>
        </div>
    );
}

/* =================== Sparkline med prikker + tooltip =================== */

function Sparkline({
                       data,
                       labels,
                       width,
                       height,
                       format = (v: number, label?: string) => (label ? `${label}: ${v}` : String(v)),
                   }: {
    data: number[];
    labels?: string[];
    width: number;
    height: number;
    format?: (v: number, label?: string) => string;
}) {
    const [active, setActive] = useState<{ i: number; x: number; y: number } | null>(null);

    const pad = 4;
    const w = Math.max(width, 40);
    const h = Math.max(height, 24);
    const min = Math.min(...data, 0);
    const max = Math.max(...data, 0);
    const span = max - min || 1;

    const toX = (i: number) => (data.length === 1 ? pad : pad + (i * (w - pad * 2)) / (data.length - 1));
    const toY = (v: number) => {
        const norm = (v - min) / span;
        return h - pad - norm * (h - pad * 2);
    };

    const d = data.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");

    return (
        <div className="relative" style={{ width: w, height: h }}>
            <svg width={w} height={h} className="opacity-90">
                {/* baseline ved 0 */}
                <line x1={pad} x2={w - pad} y1={toY(0)} y2={toY(0)} stroke="#3a3a3a" strokeWidth={1} />

                {/* områdefyld (svag) */}
                <path d={`${d} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`} fill="#D4AF37" opacity={0.12} />

                {/* linje */}
                <path d={d} fill="none" stroke="#D4AF37" strokeWidth={2} strokeLinecap="round" />

                {/* prikker */}
                <g>
                    {data.map((v, i) => {
                        const cx = toX(i);
                        const cy = toY(v);
                        return (
                            <g key={i}>
                                {/* usynlig hitbox for nem hover */}
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={8}
                                    fill="transparent"
                                    onMouseEnter={() => setActive({ i, x: cx, y: cy })}
                                    onMouseLeave={() => setActive(null)}
                                />
                                {/* synlig prik */}
                                <circle cx={cx} cy={cy} r={2.5} fill="#D4AF37" />
                                {/* browser-title fallback */}
                                <title>{format(v, labels?.[i])}</title>
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
                        left: Math.max(0, Math.min(w - 160, active.x - 80)),
                        top: Math.max(0, active.y - 28),
                    }}
                >
                    {format(data[active.i], labels?.[active.i])}
                </div>
            )}
        </div>
    );
}

/* =================== Helpers & dummy =================== */

type ClosedTrade = { closedAt: number; rMultiple: number; riskCurrency: number };

/** Deterministisk dummy-data (UTC-tider) */
function synthClosedTrades(days: number, rng: () => number): ClosedTrade[] {
    const now = new Date();
    const arr: ClosedTrade[] = [];
    for (let d = 0; d < days; d++) {
        const day = new Date(now);
        day.setUTCDate(now.getUTCDate() - d);
        const n = d % 3 === 0 ? 3 : d % 2 === 0 ? 2 : 1;
        for (let i = 0; i < n; i++) {
            const t = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 9 + i * 3, 10));
            const base = 0.4 + rng() * 0.8; // 0.4..1.2
            const sign = rng() < 0.42 ? -1 : 1;
            const out = rng() < 0.08 ? (rng() < 0.5 ? -1.6 : 2.0) : 0;
            const r = sign > 0 ? base + out : -(Math.min(1, base) - rng() * 0.25);
            const risk = 50 + rng() * 100; // 50–150 i displayCurrency
            arr.push({ closedAt: t.getTime(), rMultiple: r, riskCurrency: risk });
        }
    }
    return arr;
}

/** Period window i UTC (stabile grænser) */
function periodWindowUTC(now: Date, p: PeriodValue) {
    const end = now.getTime();
    let start: number;
    if (p === "day") {
        const s = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        start = s.getTime();
    } else if (p === "week") {
        start = end - 7 * 24 * 60 * 60 * 1000;
    } else {
        start = end - 30 * 24 * 60 * 60 * 1000;
    }
    return { startMs: start, endMs: end };
}

/** N sammenhængende vinduer bagud i UTC (dag/uge/måned) */
function lastNWindowsUTC(now: Date, p: PeriodValue, n: number) {
    const arr: { start: number; end: number }[] = [];
    // Ankér til UTC-midnat
    let cursorEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

    for (let i = 0; i < n; i++) {
        const end = cursorEnd.getTime();
        const startDate = new Date(cursorEnd);
        if (p === "day") startDate.setUTCDate(cursorEnd.getUTCDate() - 1);
        else if (p === "week") startDate.setUTCDate(cursorEnd.getUTCDate() - 7);
        else startDate.setUTCDate(cursorEnd.getUTCDate() - 30);
        arr.unshift({ start: startDate.getTime(), end });
        cursorEnd = startDate;
    }
    return arr;
}

/** dd/mm eller dd/mm–dd/mm i UTC (stabil SSR/CSR) */
function windowLabelUTC(w: { start: number; end: number }, p: PeriodValue) {
    const s = new Date(w.start);
    const e = new Date(w.end - 1);
    const ddmm = (d: Date) => {
        const dd = String(d.getUTCDate()).padStart(2, "0");
        const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
        return `${dd}/${mm}`;
    };
    if (p === "day") return ddmm(e);
    return `${ddmm(s)}–${ddmm(e)}`;
}

function mean(arr: number[]) {
    return arr.reduce((s, n) => s + n, 0) / arr.length;
}
function median(arr: number[]) {
    const copy = [...arr].sort((a, b) => a - b);
    const m = Math.floor(copy.length / 2);
    return copy.length % 2 ? copy[m] : (copy[m - 1] + copy[m]) / 2;
}
function formatCurrencySigned(value: number, fmt: Intl.NumberFormat) {
    const abs = Math.abs(value);
    const formatted = fmt.format(abs);
    if (value > 0) return `+${formatted}`;
    if (value < 0) return `-${formatted}`;
    return formatted;
}
function periodLabel(p: PeriodValue, plural = false) {
    if (p === "day") return plural ? "dage" : "I dag";
    if (p === "week") return plural ? "uger" : "Uge";
    return plural ? "måneder" : "Måned";
}
