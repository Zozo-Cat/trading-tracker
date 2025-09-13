"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

/**
 * SetupDistributionWidget v2.1 (hydration-safe)
 * - Horisontal bar chart: Top 5 setups efter WINRATE (%)
 * - Label: {setup} (Win% · N)
 * - Smart CTA hvis 0 taggede trades i perioden (med links)
 * - Note: "Se alle" når >5 setups (link til oversigt)
 * - Inline note hvis nogle trades er untaggede i perioden
 * - Periode: Dag/Uge/Måned
 * - Dummy data; erstattes af backend
 */

type Props = {
    instanceId: string;
    /** Link til siden hvor man kan navngive/tagge trades */
    manageHref?: string; // fx "/trades/tag"
    /** Link til oversigt med alle setups */
    viewAllHref?: string; // fx "/analytics/setups"
};

type ClosedTrade = {
    closedAt: number;          // ms (UTC)
    setup?: string | null;     // setup-tag (brugeren kan navngive senere)
    pl: number;                // profit/loss i valuta (til at afgøre win/loss)
};

export default function SetupDistributionWidget({
                                                    instanceId,
                                                    manageHref = "/trades/tag",
                                                    viewAllHref = "/analytics/setups",
                                                }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");

    // Deterministisk RNG pr. instans (undgår hydration mismatch)
    const rng = useMemo(() => seededRng(`${instanceId}::setupDist`), [instanceId]);

    // Dummy trades (deterministisk, UTC-ankret)
    const trades = useMemo(() => synthTrades(180, rng), [rng]);

    // Filter trades til valgt periode (UTC)
    const inPeriod = useMemo(() => {
        const now = new Date();
        const { startMs, endMs } = periodWindowUTC(now, period);
        return trades.filter((t) => t.closedAt >= startMs && t.closedAt <= endMs);
    }, [trades, period]);

    // Split mellem taggede og untaggede
    const { tagged, untaggedCount } = useMemo(() => {
        const tagged = inPeriod.filter((t) => (t.setup ?? "").trim().length > 0);
        const untaggedCount = inPeriod.length - tagged.length;
        return { tagged, untaggedCount };
    }, [inPeriod]);

    // Aggreger pr. setup → winrate
    const { top5ByWinrate, totalSetups } = useMemo(() => {
        type Agg = { setup: string; wins: number; count: number; winrate: number };
        const map = new Map<string, Agg>();
        for (const t of tagged) {
            const key = (t.setup as string).trim();
            if (!map.has(key)) map.set(key, { setup: key, wins: 0, count: 0, winrate: 0 });
            const agg = map.get(key)!;
            agg.count += 1;
            if (t.pl > 0) agg.wins += 1;
        }
        const arr = Array.from(map.values()).map((a) => ({
            ...a,
            winrate: a.count ? a.wins / a.count : 0,
        }));
        // sortér efter winrate (%) desc, derefter count desc for stabilitet
        arr.sort((a, b) => (b.winrate - a.winrate) || (b.count - a.count));
        const top = arr.slice(0, 5);
        return { top5ByWinrate: top, totalSetups: arr.length };
    }, [tagged]);

    const hasTaggedData = top5ByWinrate.length > 0;

    return (
        <div
            className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800"
            id={`${instanceId}-panel`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Setup-distribution</div>
                    <HelpTip text="Top 5 setups efter winrate (andel af vundne handler). Klik 'Se alle' for fuld liste." />
                </div>
                <PeriodToggle instanceId={instanceId} slug="setupDist" defaultValue="day" onChange={setPeriod} />
            </div>

            {/* Inline note om untaggede trades */}
            {untaggedCount > 0 && hasTaggedData && (
                <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 mb-3">
                    <div className="text-xs text-neutral-300">
                        {untaggedCount} trade{untaggedCount === 1 ? "" : "s"} i perioden uden setup-navn.
                    </div>
                    <a
                        href={manageHref}
                        className="text-xs font-medium text-neutral-100 border border-neutral-600 rounded px-2 py-1 hover:bg-neutral-800"
                    >
                        Navngiv trades
                    </a>
                </div>
            )}

            {/* Body */}
            {hasTaggedData ? (
                <>
                    <BarChartWinrate data={top5ByWinrate} width={400} barHeight={22} />
                    {/* Footer note med "Se alle" når der er flere end 5 setups */}
                    {totalSetups > 5 && (
                        <div className="mt-2 text-xs text-neutral-400">
                            Viser Top 5 efter winrate.{" "}
                            <a href={viewAllHref} className="underline underline-offset-2 hover:text-neutral-200">
                                Se alle
                            </a>
                        </div>
                    )}
                </>
            ) : (
                <SmartCTA manageHref={manageHref} hasTrades={inPeriod.length > 0} />
            )}
        </div>
    );
}

/* =================== Smart CTA (ingen taggede) =================== */

function SmartCTA({ manageHref, hasTrades }: { manageHref: string; hasTrades: boolean }) {
    return (
        <div className="rounded-lg border border-dashed border-neutral-700 p-3">
            <div className="text-sm text-neutral-300">
                Der er ingen <span className="font-medium">navngivne trades</span> fra denne periode.
            </div>
            <div className="text-xs text-neutral-400 mt-1">
                Du kan navngive dine trades{" "}
                <a href={manageHref} className="underline underline-offset-2 hover:text-neutral-200">
                    her
                </a>{" "}
                (på undersiden), eller via <span className="italic">“Navngiv trades”</span> i dashboardet.
            </div>
        </div>
    );
}

/* =================== Bar chart (winrate %) =================== */

function BarChartWinrate({
                             data,
                             width,
                             barHeight,
                         }: {
    data: { setup: string; wins: number; count: number; winrate: number }[];
    width: number;
    barHeight: number;
}) {
    // skaler mod 100%, da winrate er 0..1
    return (
        <div className="flex flex-col gap-2" style={{ width }}>
            {data.map(({ setup, wins, count, winrate }) => {
                const pct = Math.max(0, Math.min(100, winrate * 100));
                const color = pct >= 60 ? "#10b981" : pct >= 45 ? "#D4AF37" : "#ef4444";
                return (
                    <div key={setup} className="flex items-center gap-2">
                        <div
                            className="rounded-md"
                            style={{
                                height: barHeight,
                                width: `${pct}%`,
                                backgroundColor: color,
                                minWidth: 2,
                            }}
                            title={`${setup}: Win ${pct.toFixed(0)}% · ${count} trades (${wins}W/${count - wins}L)`}
                        />
                        <div className="text-xs text-neutral-300 whitespace-nowrap">
                            {setup} ({pct.toFixed(0)}% · {count})
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* =================== Helpers & dummy =================== */

const DAY = 24 * 60 * 60 * 1000;

function startOfUTCDay(d: Date) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function periodWindowUTC(now: Date, p: PeriodValue) {
    const end = now.getTime();
    if (p === "day") {
        return { startMs: startOfUTCDay(now).getTime(), endMs: end };
    }
    if (p === "week") {
        return { startMs: end - 7 * DAY, endMs: end };
    }
    // "måned" = rul 30 dage
    return { startMs: end - 30 * DAY, endMs: end };
}

function synthTrades(n: number, rng: () => number): ClosedTrade[] {
    const setups = ["Breakout", "Reversal", "Trend-follow", "Range", "News", "Scalp", "Pullback", "Fade"];
    const todayUTC0 = startOfUTCDay(new Date()).getTime();
    const arr: ClosedTrade[] = [];

    for (let i = 0; i < n; i++) {
        // Fordel trades inden for seneste 30 dage (UTC)
        const daysAgo = Math.floor(rng() * 30);
        const ts = todayUTC0 - daysAgo * DAY + Math.floor(rng() * (20 * 60 * 60 * 1000)); // et tidspunkt i løbet af dagen

        // ~35% untagged for at teste CTA-path (deterministisk)
        const isUntagged = rng() < 0.35;
        const setup = isUntagged ? null : setups[Math.floor(rng() * setups.length)];

        // win bias lidt forskellig pr. setup for at få variation i winrate
        const bias =
            setup === "Trend-follow" ? 0.58 :
                setup === "Breakout"     ? 0.55 :
                    setup === "Range"        ? 0.48 :
                        0.5;

        const win = rng() < bias;
        const magnitude = 20 + rng() * 80;

        arr.push({
            closedAt: ts,
            setup,
            pl: (win ? 1 : -1) * magnitude,
        });
    }
    return arr;
}
