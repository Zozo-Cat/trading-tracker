"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

type Props = {
    instanceId: string;
    goalR?: number; // mål i R, default 1.0
};

export default function RiskRewardWidget({ instanceId, goalR = 1.0 }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");

    // Deterministisk RNG pr. instans (undgår hydration-mismatch)
    const rng = useMemo(() => seededRng(`${instanceId}::riskReward`), [instanceId]);

    // Dummy data (BYT ud med rigtige data senere) — deterministisk & fast-ankret i UTC
    const trades = useMemo(() => synthClosedTrades(120, rng), [rng]);

    // === Stabilt vindue: brug seriens sidste timestamp som "nu" ===
    const rValues = useMemo(() => {
        if (!trades.length) return [];
        const endMs = trades[trades.length - 1].closedAt; // sidste punkt i serien
        const { startMs } = periodWindowFromEnd(endMs, period);
        return trades
            .filter((t) => t.closedAt >= startMs && t.closedAt <= endMs)
            .map((t) => t.rMultiple)
            .filter((r) => Number.isFinite(r));
    }, [trades, period]);

    const hasData = rValues.length > 0;

    const avgR = useMemo(() => (hasData ? mean(rValues) : 0), [hasData, rValues]);
    const medianR = useMemo(() => (hasData ? median(rValues) : 0), [hasData, rValues]);
    const pctAtLeast1R = useMemo(
        () => (hasData ? (rValues.filter((r) => r >= 1).length / rValues.length) * 100 : 0),
        [hasData, rValues]
    );

    // KPI-farve: grøn hvis >= mål, guld hvis 0.5–mål, rød hvis < 0.5
    const kpiColor = avgR >= goalR ? "#10b981" : avgR >= 0.5 ? "#D4AF37" : "#ef4444";

    return (
        <div
            className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800"
            id={`${instanceId}-panel`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="font-medium">R/R (gennemsnit)</div>
                    <HelpTip text="Gns. R pr. lukket trade. Termometeret viser fremdrift mod dit mål (default 1.0R)." />
                </div>
                <PeriodToggle instanceId={instanceId} slug="riskReward" defaultValue="day" onChange={setPeriod} />
            </div>

            {hasData ? (
                // ALT indhold samlet til venstre
                <div className="flex items-start gap-4">
                    {/* Termometer (venstre) */}
                    <Thermometer
                        avgR={avgR}
                        goalR={goalR}
                        title={`Fremdrift mod mål ${goalR.toFixed(2)}R — skala 0R→${goalR.toFixed(2)}R→2R`}
                    />

                    {/* KPI + badges (lige ved siden af, venstrealigneret) */}
                    <div className="flex flex-col items-start text-left">
                        <div className="text-sm text-neutral-400">Gns. R</div>
                        <div className="text-3xl font-semibold" style={{ color: kpiColor }} aria-live="polite">
                            {formatR(avgR)}
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                            <Badge
                                label="Median"
                                value={`${formatR(medianR)}`}
                                title="Median R: Den midterste værdi – mere robust mod outliers end gennemsnit."
                            />
                            <Badge
                                label="≥1R"
                                value={`${pctAtLeast1R.toFixed(0)}%`}
                                title="Andel af lukkede trades der gav mindst 1R (gevinst ≥ risiko)."
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <EmptyState />
            )}

            {/* A11y */}
            <p className="sr-only">
                Gns. R {avgR.toFixed(2)}. Mål {goalR.toFixed(2)}R. Median {medianR.toFixed(2)}R. {pctAtLeast1R.toFixed(0)}% af
                trades er mindst 1R.
            </p>
        </div>
    );
}

/* =================== UI-komponenter =================== */

function Badge({
                   label,
                   value,
                   title,
               }: {
    label: string;
    value: string;
    title?: string;
}) {
    return (
        <span
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-neutral-700 text-neutral-200"
            title={title}
        >
            <span className="text-neutral-400">{label}:</span>
            <span className="font-medium">{value}</span>
        </span>
    );
}

/** Vertical thermometer progress (SVG) */
function Thermometer({ avgR, goalR, title }: { avgR: number; goalR: number; title?: string }) {
    // Skala: 0R (bund) → goalR (mid marker) → 2R (top cap)
    const maxR = Math.max(goalR * 2, 2);
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const frac = clamp(avgR / maxR, 0, 1);

    const h = 140;
    const w = 46;
    const tubeW = 12;
    const xCenter = w / 2;
    const tubeTop = 12;
    const tubeBottom = h - 24;
    const tubeH = tubeBottom - tubeTop;

    const fillTopY = tubeBottom - tubeH * frac;
    const goalFrac = clamp(goalR / maxR, 0, 1);
    const goalY = tubeBottom - tubeH * goalFrac;

    return (
        <svg width={w} height={h} role="img" aria-label="R-mod-mål termometer" title={title}>
            {/* Bulb */}
            <circle cx={xCenter} cy={tubeBottom + 6} r={10} fill="#5c4a12" />
            <circle cx={xCenter} cy={tubeBottom + 6} r={8} fill="#806a1a" />

            {/* Tube */}
            <rect
                x={xCenter - tubeW / 2}
                y={tubeTop}
                width={tubeW}
                height={tubeH}
                rx={tubeW / 2}
                fill="#2a2a2a"
                stroke="#3a3a3a"
                strokeWidth="1"
            />

            {/* Segment-baggrunde (guldnuancer) */}
            {[
                { from: 0, to: 0.5, color: "#7d6820" },
                { from: 0.5, to: goalR / maxR, color: "#b4942b" },
                { from: goalR / maxR, to: 1, color: "#e2c75a" },
            ].map((seg, i) => {
                const y1 = tubeBottom - tubeH * clamp(seg.to, 0, 1);
                const y2 = tubeBottom - tubeH * clamp(seg.from, 0, 1);
                return (
                    <rect
                        key={i}
                        x={xCenter - (tubeW - 4) / 2}
                        y={y1}
                        width={tubeW - 4}
                        height={Math.max(0, y2 - y1)}
                        rx={(tubeW - 4) / 2}
                        fill={seg.color}
                        opacity={0.25}
                    />
                );
            })}

            {/* Fill */}
            <rect
                x={xCenter - (tubeW - 6) / 2}
                y={fillTopY}
                width={tubeW - 6}
                height={tubeBottom - fillTopY}
                rx={(tubeW - 6) / 2}
                fill="#D4AF37"
            />

            {/* Goal marker (titel flyttet til attribute for stabil hydration) */}
            <line
                x1={xCenter - tubeW / 2 - 6}
                x2={xCenter + tubeW / 2 + 6}
                y1={goalY}
                y2={goalY}
                stroke="#ffffff"
                strokeWidth={2}
                title={`Mål: ${goalR.toFixed(2)}R`}
            />

            {/* Top cap */}
            <rect x={xCenter - tubeW / 2} y={tubeTop - 2} width={tubeW} height={6} rx={3} fill="#2a2a2a" />
        </svg>
    );
}

/* =================== Helpers & dummy =================== */

type ClosedTrade = { closedAt: number; rMultiple: number };

/** Deterministisk, fast-ankret demo-serie af R-værdier (ingen afhængighed af “nu”). */
function synthClosedTrades(days: number, rng: () => number): ClosedTrade[] {
    // Fast anker: 2024-01-01 00:00:00Z
    const BASE_UTC = Date.UTC(2024, 0, 1, 0, 0, 0, 0);
    const DAY_MS = 24 * 60 * 60 * 1000;

    const arr: ClosedTrade[] = [];
    for (let d = 0; d < days; d++) {
        const dayUTC = new Date(BASE_UTC + d * DAY_MS);

        const tradesToday = d % 3 === 0 ? 3 : d % 2 === 0 ? 2 : 1;
        for (let i = 0; i < tradesToday; i++) {
            const t = new Date(dayUTC);
            t.setUTCHours(10 + i * 2, 0, 0, 0); // 10Z, 12Z, ...

            // Distribuer R-værdier omkring 0.6–1.4R med outliers (deterministisk)
            const base = 0.6 + rng() * 0.8;  // 0.6..1.4
            const sign = rng() < 0.35 ? -1 : 1;
            const out  = rng() < 0.08 ? (rng() < 0.5 ? -1.8 : 2.2) : 0;
            const r = sign > 0 ? base + out : -(Math.min(1, base) - rng() * 0.3);

            arr.push({ closedAt: t.getTime(), rMultiple: r });
        }
    }
    return arr;
}

/** Periodevinduer målt baglæns fra et givet endMs (i millisekunder). */
function periodWindowFromEnd(endMs: number, p: PeriodValue) {
    const DAY_MS = 24 * 60 * 60 * 1000;
    if (p === "day")  return { startMs: endMs - 1 * DAY_MS, endMs };
    if (p === "week") return { startMs: endMs - 7 * DAY_MS, endMs };
    return { startMs: endMs - 30 * DAY_MS, endMs };
}

function mean(arr: number[]) {
    return arr.reduce((s, n) => s + n, 0) / arr.length;
}
function median(arr: number[]) {
    const copy = [...arr].sort((a, b) => a - b);
    const m = Math.floor(copy.length / 2);
    return copy.length % 2 ? copy[m] : (copy[m - 1] + copy[m]) / 2;
}

function formatR(v: number) {
    const sign = v < 0 ? "-" : "";
    const abs = Math.abs(v).toFixed(2).replace(".", ",");
    return `${sign}${abs}R`;
}

/* =================== Empty state =================== */

function EmptyState() {
    return (
        <div className="flex items-center gap-4">
            <Thermometer avgR={0} goalR={1} title="Ingen data endnu" />
            <div>
                <div className="text-sm text-neutral-400">Gns. R</div>
                <div className="text-3xl font-semibold text-neutral-500">—</div>
            </div>
        </div>
    );
}
