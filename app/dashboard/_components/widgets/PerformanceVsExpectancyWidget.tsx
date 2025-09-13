"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

/**
 * PerformanceVsExpectancyWidget
 * - Sammenligner realiseret P/L med beregnet Expectancy
 * - Side-by-side bars, highlight forskel
 * - Hydration-safe: deterministisk demo-data + UTC-periodevinduer
 */

type Props = { instanceId: string };

type Trade = {
    id: string;
    entry: number; // ms (UTC)
    exit?: number; // ms (UTC)
    pl: number;    // profit/loss i konto-valuta
};

/* ========== UTC helpers (stabil SSR/CSR) ========== */
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUTCDay(d: Date) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}
function periodStartUTC(now: Date, p: PeriodValue) {
    const end = now.getTime();
    if (p === "day") return startOfUTCDay(now).getTime();
    if (p === "week") return end - 7 * DAY_MS;
    return end - 30 * DAY_MS; // "måned" = seneste 30 dage
}

/* ========== Demo-trades (deterministisk) ========== */
function demoTradesUTC(rng: () => number): Trade[] {
    // Generer trades ca. hver 2. time over ~36 timer, centreret omkring 14:00Z
    const baseUTC = startOfUTCDay(new Date()).getTime();
    const out: Trade[] = [];
    let id = 1;

    for (let h = -36; h <= 0; h += 2) {
        const t = baseUTC + (14 + h) * 60 * 60 * 1000;
        // Sandsynlighed for trade afhænger svagt af time; deterministisk via rng()
        if (rng() < (h % 6 === 0 ? 0.8 : 0.5)) {
            const win = rng() < 0.55;
            const magnitude = 30 + rng() * 120; // 30..150
            out.push({
                id: `t-${id++}`,
                entry: t,
                exit: t + 45 * 60 * 1000,
                pl: (win ? 1 : -1) * magnitude,
            });

            // Lejlighedsvis en ekstra trade 30 min senere
            if (rng() < 0.22) {
                const win2 = rng() < 0.52;
                const mag2 = 20 + rng() * 90;
                out.push({
                    id: `t-${id++}`,
                    entry: t + 30 * 60 * 1000,
                    exit: t + 75 * 60 * 1000,
                    pl: (win2 ? 1 : -1) * mag2,
                });
            }
        }
    }
    return out;
}

export default function PerformanceVsExpectancyWidget({ instanceId }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");

    // Deterministisk RNG pr. instans for stabil SSR/CSR
    const rng = useMemo(() => seededRng(`${instanceId}::perfVsExpectancy`), [instanceId]);

    // Demo-data
    const allTrades = useMemo(() => demoTradesUTC(rng), [rng]);

    // Filter trades i valgt periode (UTC)
    const trades = useMemo(() => {
        const now = new Date();
        const from = periodStartUTC(now, period);
        return allTrades.filter((t) => t.entry >= from);
    }, [allTrades, period]);

    const calc = useMemo(() => {
        if (!trades.length) return null;

        const wins = trades.filter((t) => t.pl > 0);
        const losses = trades.filter((t) => t.pl < 0);

        const winPct = trades.length ? (wins.length / trades.length) : 0;
        const lossPct = trades.length ? (losses.length / trades.length) : 0;

        const avgWin = wins.length ? wins.reduce((a, b) => a + b.pl, 0) / wins.length : 0;
        const avgLoss = losses.length ? Math.abs(losses.reduce((a, b) => a + b.pl, 0) / losses.length) : 0;

        const expectancy = winPct * avgWin - lossPct * avgLoss;
        const realized = trades.reduce((a, b) => a + b.pl, 0);
        const diff = realized - expectancy;

        return { expectancy, realized, diff };
    }, [trades]);

    const Header = (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="font-medium">Performance vs. Expectancy</div>
                <HelpTip text="Sammenligner dine faktiske resultater med din forventede performance (Expectancy = Win% × gns. gevinst − Loss% × gns. tab)." />
            </div>
            <PeriodToggle
                instanceId={instanceId}
                slug="perfVsExpectancy"
                defaultValue="day"
                onChange={setPeriod}
            />
        </div>
    );

    if (!calc) {
        return (
            <div className="rounded-xl p-4 bg-neutral-900/60 border border-neutral-800" id={`${instanceId}-panel`}>
                {Header}
                <div className="h-28 rounded-xl border border-dashed border-neutral-700 flex items-center justify-center text-neutral-400 text-sm">
                    Ingen trades i perioden.
                </div>
            </div>
        );
    }

    const { expectancy, realized, diff } = calc;
    const maxVal = Math.max(Math.abs(expectancy), Math.abs(realized), 1);

    const bar = (label: string, value: number, color: string) => {
        const pct = (Math.abs(value) / maxVal) * 100;
        return (
            <div className="flex items-center gap-2">
                <div className="w-20 text-xs text-neutral-300">{label}</div>
                <div className="flex-1 h-4 bg-neutral-800 rounded">
                    <div
                        className="h-full rounded transition-all"
                        style={{ width: `${pct}%`, background: color }}
                        title={`${label}: ${value.toFixed(2)}`}
                    />
                </div>
                <div className="w-20 text-right text-xs text-neutral-300">
                    {value.toFixed(2)}
                </div>
            </div>
        );
    };

    const diffColor = diff >= 0 ? "#10b981" : "#ef4444";

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 border border-neutral-800" id={`${instanceId}-panel`}>
            {Header}

            <div className="flex flex-col gap-3">
                {bar("Expectancy", expectancy, "#D4AF37")}
                {bar("Realiseret", realized, "#3b82f6")}

                {/* Diff note */}
                <div className="mt-2 text-sm" style={{ color: diffColor }}>
                    {diff >= 0
                        ? `Du outperformer expectancy med ${diff.toFixed(2)}`
                        : `Du underperformer expectancy med ${Math.abs(diff).toFixed(2)}`}
                </div>
            </div>
        </div>
    );
}
