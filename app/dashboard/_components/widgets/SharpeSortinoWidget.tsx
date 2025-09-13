"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

/**
 * SharpeSortinoWidget v1.2 (hydration-safe)
 * - Viser to KPI-kort: Sharpe og Sortino side om side
 * - Forklaringstekst (noob-friendly) under hvert KPI
 * - Periode: Dag / Uge / Måned
 * - Dummy trades; erstattes af backend
 */

type Props = { instanceId: string };

type ClosedTrade = {
    closedAt: number;    // ms
    retPct: number;      // afkast i %
};

export default function SharpeSortinoWidget({ instanceId }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");

    // Deterministisk data (undgår hydration-mismatch)
    const rng = useMemo(() => seededRng(`${instanceId}::sharpeSortino`), [instanceId]);
    const trades = useMemo(() => synthReturns(200, rng), [rng]);

    // Filtrer trades i valgt periode (UTC-vinduer)
    const now = new Date();
    const inPeriod = useMemo(() => {
        const { startMs, endMs } = periodWindowUTC(now, period);
        return trades.filter((t) => t.closedAt >= startMs && t.closedAt <= endMs);
    }, [trades, period]);

    const rets = inPeriod.map((t) => t.retPct / 100); // som decimals

    const { sharpe, sortino, stdDev, downsideDev } = useMemo(
        () => calcRatios(rets),
        [rets]
    );

    const hasData = rets.length > 1;

    return (
        <div
            className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800"
            id={`${instanceId}-panel`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Sharpe / Sortino</div>
                    <HelpTip text="Sharpe = (R − Rf) / σ. Sortino = (R − Rf) / σdown. Viser risikojusteret afkast." />
                </div>
                <PeriodToggle instanceId={instanceId} slug="sharpeSortino" defaultValue="day" onChange={setPeriod} />
            </div>

            {hasData ? (
                <div className="grid grid-cols-2 gap-4">
                    {/* Sharpe */}
                    <RatioCard
                        label="Sharpe"
                        value={sharpe}
                        sub={`Vol: ${formatPct(stdDev)}`}
                    />
                    {/* Sortino */}
                    <RatioCard
                        label="Sortino"
                        value={sortino}
                        sub={`Down: ${formatPct(downsideDev)}`}
                    />
                </div>
            ) : (
                <div className="text-neutral-500">— For få trades i perioden.</div>
            )}
        </div>
    );
}

/* =================== UI sub =================== */

function RatioCard({
                       label,
                       value,
                       sub,
                   }: {
    label: string;
    value: number;
    sub: string;
}) {
    const color = value > 1 ? "#10b981" : value > 0 ? "#D4AF37" : "#ef4444";
    const text = isFinite(value) ? value.toFixed(2) : "—";

    let explainer = "";
    if (label === "Sharpe") {
        explainer =
            "Måler hvor meget afkast du får pr. risiko. Jo højere tallet er, jo bedre er din risiko/afkast-balance. " +
            "Sharpe 2 betyder fx at du får 2% afkast for hver 1% risiko.";
    } else {
        explainer =
            "Ligner Sharpe, men tæller kun de dårlige perioder (når du taber). " +
            "Giver et mere retfærdigt billede for tradere.";
    }

    return (
        <div className="rounded-lg border border-neutral-700 p-3 flex flex-col items-start space-y-1">
            <div className="text-sm text-neutral-400">{label}</div>
            <div className="text-2xl font-semibold" style={{ color }}>
                {text}
            </div>
            <div className="text-xs text-neutral-500">{sub}</div>
            <div className="text-xs text-neutral-400 mt-2 leading-snug">{explainer}</div>
        </div>
    );
}

/* =================== Logic & helpers =================== */

function calcRatios(rets: number[]) {
    if (rets.length < 2) return { sharpe: NaN, sortino: NaN, stdDev: NaN, downsideDev: NaN };

    const mean = rets.reduce((s, r) => s + r, 0) / rets.length;
    const rf = 0; // risk free 0% to start

    const diffs = rets.map((r) => r - rf);
    const variance = diffs.reduce((s, d) => s + d * d, 0) / (diffs.length - 1);
    const stdDev = Math.sqrt(variance);

    const negDiffs = diffs.filter((d) => d < 0);
    const downVar = negDiffs.length
        ? negDiffs.reduce((s, d) => s + d * d, 0) / negDiffs.length
        : 0;
    const downsideDev = Math.sqrt(downVar);

    const sharpe = stdDev > 0 ? mean / stdDev : NaN;
    const sortino = downsideDev > 0 ? mean / downsideDev : NaN;

    return { sharpe, sortino, stdDev, downsideDev };
}

function formatPct(v: number) {
    if (!isFinite(v)) return "—";
    return (v * 100).toFixed(1) + "%";
}

/** Periodevindue i UTC (stabilt på tværs af SSR/CSR) */
function periodWindowUTC(now: Date, p: PeriodValue) {
    const end = now.getTime();
    if (p === "day") {
        const s = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        return { startMs: s.getTime(), endMs: end };
    }
    if (p === "week") {
        return { startMs: end - 7 * 24 * 60 * 60 * 1000, endMs: end };
    }
    return { startMs: end - 30 * 24 * 60 * 60 * 1000, endMs: end };
}

/** Dummy: genererer daglige afkast omkring 0 med std ca. 1% (deterministisk, UTC-ankret) */
function synthReturns(days: number, rng: () => number): ClosedTrade[] {
    const now = new Date();
    const arr: ClosedTrade[] = [];
    for (let d = 0; d < days; d++) {
        const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 16, 0, 0, 0));
        day.setUTCDate(day.getUTCDate() - d);
        const retPct = (rng() - 0.5) * 2; // -1% til +1%
        arr.push({ closedAt: day.getTime(), retPct });
    }
    return arr;
}
