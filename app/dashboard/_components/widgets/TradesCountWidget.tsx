"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";

type Props = {
    instanceId: string;
};

/**
 * TradesCountWidget v2.0 (KPI + badge)
 * - KPI: antal handler i valgt periode
 * - Badge: pil + procent vs. historisk gennemsnit (samme granularitet)
 *   - I dag  → vs. gennemsnit pr. dag (seneste 30 dage)
 *   - Uge    → vs. gennemsnit pr. uge (seneste 8 uger)
 *   - Måned  → vs. gennemsnit pr. 30-dages "måned" (seneste 6 mdr)
 * - Periodeskifter (I dag / Uge / Måned) med LS-persist (via PeriodToggle)
 * - Mørk baggrund; konsistent UI med øvrige widgets
 * - Dummy datasæt (timestamps) → BYT ud når backend er klar
 */
export default function TradesCountWidget({ instanceId }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");

    // ---------- Dummy data (byttes ud med rigtige trades senere) ----------
    // Generér pseudo trade-timestamps for de seneste ~180 dage
    const rawTradeTimestamps = useMemo(() => synthDummyTrades(180), []);

    // ---------- Aggregering for valgt periode ----------
    const now = useMemo(() => new Date(), []);
    const currentCount = useMemo(
        () => countForPeriod(rawTradeTimestamps, now, period),
        [rawTradeTimestamps, now, period]
    );

    // ---------- Historisk gennemsnit til badge ----------
    const avg = useMemo(
        () => historicalAverage(rawTradeTimestamps, now, period),
        [rawTradeTimestamps, now, period]
    );

    // ---------- Badge (pil + procent) ----------
    const badge = useMemo(() => makeBadge(currentCount, avg), [currentCount, avg]);

    // ---------- KPI farve (guld hvis >0, ellers neutral grå) ----------
    const kpiColor = currentCount > 0 ? "#D4AF37" : "#9ca3af";

    return (
        <div
            className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800"
            id={`${instanceId}-panel`}
        >
            {/* Header: Titel + help + toggle */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Antal handler</div>
                    <HelpTip text="Samlet antal handler i den valgte periode" />
                </div>
                <PeriodToggle
                    instanceId={instanceId}
                    slug="tradesCount"
                    defaultValue="day"
                    onChange={setPeriod}
                />
            </div>

            {/* KPI + badge (pilen ved tallet) */}
            <div className="flex items-center gap-2">
                <div className="flex flex-col">
                    <div className="text-sm text-neutral-400">Handler i alt</div>
                    <div className="text-3xl font-semibold" style={{ color: kpiColor }} aria-live="polite">
                        {currentCount}
                    </div>
                </div>

                {/* Badge: tydelig pil + procent med hover-tooltip */}
                {badge ? (
                    <TooltipBadge
                        arrow={badge.arrow}
                        percentText={badge.percentText}
                        color={badge.color}
                        tooltip={badge.tooltip}
                    />
                ) : (
                    <span className="text-xs text-neutral-500" title="Ingen historik til gennemsnit endnu">
            —
          </span>
                )}
            </div>

            {/* Skærmlæsertekst */}
            <p className="sr-only">
                Antal handler for valgt periode ({label(period)}): {currentCount}.
            </p>
        </div>
    );
}

/* ================= Hjælpere / beregning ================= */

function label(p: PeriodValue) {
    if (p === "day") return "I dag";
    if (p === "week") return "Uge";
    return "Måned";
}

/** Lav en badge med pil + procent og tooltip. Threshold ±5% = neutral. */
function makeBadge(current: number, average: number) {
    if (!Number.isFinite(average) || average <= 0) return null;
    const diffPct = ((current - average) / average) * 100;
    const abs = Math.abs(diffPct);
    let color = "#D4AF37";
    let arrow: "▲" | "▼" | "→" = "→";
    if (diffPct >= 5) {
        color = "#10b981";
        arrow = "▲";
    } else if (diffPct <= -5) {
        color = "#ef4444";
        arrow = "▼";
    }
    return {
        arrow,
        percentText: `${diffPct >= 0 ? "+" : "-"}${abs.toFixed(0)}%`,
        color,
        tooltip: "Mere eller mindre aktiv end normalt.",
    };
}

/** Syntetisk dummy-datasæt: timestamps for trades de sidste N dage. */
function synthDummyTrades(days: number) {
    const now = new Date();
    const ts: number[] = [];
    for (let d = 0; d < days; d++) {
        const day = new Date(now);
        day.setDate(now.getDate() - d);

        // pseudo mønster: flere trades på hver 3. dag, færre i weekenden
        const weekday = day.getDay(); // 0=Sun .. 6=Sat
        const base = d % 3 === 0 ? 4 : d % 2 === 0 ? 2 : 1;
        const weekendPenalty = weekday === 0 || weekday === 6 ? -1 : 0;
        const count = Math.max(0, base + weekendPenalty);

        for (let i = 0; i < count; i++) {
            const t = new Date(day);
            t.setHours(9 + i * 2, 15);
            ts.push(t.getTime());
        }
    }
    return ts;
}

/** Antal trades i valgt periode, sluttende "nu". */
function countForPeriod(timestamps: number[], now: Date, period: PeriodValue) {
    const end = now.getTime();
    let start: number;

    if (period === "day") {
        const s = new Date(now);
        s.setHours(0, 0, 0, 0);
        start = s.getTime();
    } else if (period === "week") {
        start = end - 7 * 24 * 60 * 60 * 1000;
    } else {
        start = end - 30 * 24 * 60 * 60 * 1000;
    }

    let count = 0;
    for (const ts of timestamps) {
        if (ts >= start && ts <= end) count++;
    }
    return count;
}

/** Historisk gennemsnit for samme granularitet. */
function historicalAverage(timestamps: number[], now: Date, period: PeriodValue) {
    if (period === "day") {
        // gennemsnit pr. dag for sidste 30 hele dage (ekskl. i dag)
        const days = 30;
        const arr = [];
        for (let i = 1; i <= days; i++) {
            const end = new Date(now);
            end.setDate(now.getDate() - i);
            end.setHours(23, 59, 59, 999);
            const start = new Date(end);
            start.setHours(0, 0, 0, 0);
            arr.push(countBetween(timestamps, start.getTime(), end.getTime()));
        }
        return avg(arr);
    }

    if (period === "week") {
        // gennemsnit pr. 7-dages vindue for sidste 8 hele uger (ekskl. indeværende)
        const weeks = 8;
        const arr = [];
        let end = new Date(now);
        end.setHours(0, 0, 0, 0);
        // start fra sidste hele uge
        end.setDate(end.getDate() - end.getDay()); // ryk til søndag (for simplicity)
        for (let w = 0; w < weeks; w++) {
            const start = new Date(end);
            start.setDate(end.getDate() - 7);
            arr.push(countBetween(timestamps, start.getTime(), end.getTime()));
            end = start; // gå en uge tilbage
        }
        return avg(arr);
    }

    // Måned (30-dages vindue) for sidste 6 hele "måneder"
    const months = 6;
    const arr = [];
    let end = new Date(now);
    end.setHours(0, 0, 0, 0);
    // start fra sidste hele 30-dages blok
    for (let m = 0; m < months; m++) {
        const start = new Date(end);
        start.setDate(end.getDate() - 30);
        arr.push(countBetween(timestamps, start.getTime(), end.getTime()));
        end = start;
    }
    return avg(arr);
}

function countBetween(timestamps: number[], startMs: number, endMs: number) {
    let c = 0;
    for (const ts of timestamps) if (ts >= startMs && ts <= endMs) c++;
    return c;
}

function avg(arr: number[]) {
    if (!arr.length) return 0;
    return arr.reduce((s, n) => s + n, 0) / arr.length;
}

/* =============== Badge-komponent med tooltip =============== */

function TooltipBadge({
                          arrow,
                          percentText,
                          color,
                          tooltip,
                      }: {
    arrow: "▲" | "▼" | "→";
    percentText: string;
    color: string;
    tooltip: string;
}) {
    return (
        <span className="relative inline-flex items-center group">
      {/* Badge */}
            <span
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-md border select-none"
                style={{ color, borderColor: color }}
            >
        <span style={{ fontSize: 16, lineHeight: 1 }}>{arrow}</span>
                {percentText}
      </span>

            {/* Tooltip (hover/focus) */}
            <span
                role="tooltip"
                className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 z-20 hidden
                   whitespace-nowrap rounded-md border border-neutral-700 bg-neutral-900 text-neutral-100
                   text-xs px-3 py-2 shadow-lg group-hover:block group-focus-within:block"
            >
        {tooltip}
      </span>
    </span>
    );
}
