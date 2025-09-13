"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

/**
 * TradeDurationWidget
 * - KPI: gennemsnitlig varighed af trades
 * - Histogram (fordeling på buckets)
 * - Custom buckets via prop (fx scalper presets)
 * - Hydration-safe: deterministisk demo-data + UTC-vinduer
 */

type Props = {
    instanceId: string;
    /** Optional: Custom buckets. Hvis tom/udeladt, bruges DEFAULT_BUCKETS. */
    buckets?: DurationBucket[];
};

type Trade = {
    id: string;
    entry: number; // ms (UTC)
    exit?: number; // ms (UTC), undefined hvis åben
};

type DurationBucket = {
    key: string;
    label: string;
    minHrs?: number; // inklusiv
    maxHrs?: number; // eksklusiv
};

const DEFAULT_BUCKETS: DurationBucket[] = [
    { key: "<1h",  label: "<1 time",   maxHrs: 1 },
    { key: "1-4h", label: "1–4 timer", minHrs: 1,  maxHrs: 4 },
    { key: "4-24h",label: "4–24 timer",minHrs: 4,  maxHrs: 24 },
    { key: ">1d",  label: ">1 dag",    minHrs: 24 },
];

/* ===== UTC helpers (stabil SSR/CSR) ===== */
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS  = 24 * HOUR_MS;

function startOfUTCDay(d: Date) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}
function periodWindowUTC(now: Date, p: PeriodValue) {
    const endMs = now.getTime();
    if (p === "day")  return { startMs: startOfUTCDay(now).getTime(), endMs };
    if (p === "week") return { startMs: endMs - 7 * DAY_MS,            endMs };
    return { startMs: endMs - 30 * DAY_MS, endMs }; // “måned” = 30d rullende
}

/* ===== Demo-trades (deterministisk, UTC-ankret) ===== */
function synthTradesUTC(n: number, rng: () => number): Trade[] {
    const todayUTC0 = startOfUTCDay(new Date()).getTime();
    const arr: Trade[] = [];

    for (let i = 0; i < n; i++) {
        // Placer trades jævnt/tilfældigt over de sidste 30 dage
        const daysAgo   = Math.floor(rng() * 30);
        const exitHour  = Math.floor(rng() * 24);            // 0..23
        const durationH = 0.25 + rng() * 48;                 // 0.25–48 timer
        const exitMs    = todayUTC0 - daysAgo * DAY_MS + exitHour * HOUR_MS + Math.floor(rng() * HOUR_MS);
        const entryMs   = exitMs - durationH * HOUR_MS;

        // 10% åbne trades (uden exit) for at teste filtrering
        if (rng() < 0.10) {
            arr.push({ id: `t${i}`, entry: entryMs /* exit: undefined */ });
        } else {
            arr.push({ id: `t${i}`, entry: entryMs, exit: exitMs });
        }
    }
    return arr;
}

function hoursBetweenMs(entryMs: number, exitMs: number) {
    return (exitMs - entryMs) / HOUR_MS;
}

export default function TradeDurationWidget({ instanceId, buckets }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");

    // Deterministisk RNG pr. instans (undgår hydration-mismatch)
    const rng = useMemo(() => seededRng(`${instanceId}::tradeDuration`), [instanceId]);
    const allTrades = useMemo(() => synthTradesUTC(80, rng), [rng]);

    // Periodefilter (kun lukkede trades i vinduet)
    const { closedInPeriod } = useMemo(() => {
        const now = new Date();
        const { startMs, endMs } = periodWindowUTC(now, period);
        const inRange = allTrades.filter((t) => t.exit != null && t.exit! >= startMs && t.exit! <= endMs);
        return { closedInPeriod: inRange };
    }, [allTrades, period]);

    const calc = useMemo(() => {
        if (!closedInPeriod.length) return null;

        const durations = closedInPeriod.map((t) => hoursBetweenMs(t.entry, t.exit!));
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;

        const spec = (buckets && buckets.length ? buckets : DEFAULT_BUCKETS);

        const bucketRows = spec.map((b) => {
            const count = durations.filter((h) => {
                if (b.minHrs !== undefined && h < b.minHrs) return false;
                if (b.maxHrs !== undefined && h >= b.maxHrs) return false;
                return true;
            }).length;
            return { ...b, count };
        });

        const min = Math.min(...durations);
        const max = Math.max(...durations);

        return { avg, buckets: bucketRows, min, max, total: durations.length };
    }, [closedInPeriod, buckets]);

    const Header = (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="font-medium">Trade Duration</div>
                <HelpTip text="Viser hvor længe dine trades varer i gennemsnit. Histogrammet grupperer efter dine valgte intervaller." />
            </div>
            <PeriodToggle instanceId={instanceId} slug="tradeDuration" defaultValue="day" onChange={setPeriod} />
        </div>
    );

    if (!calc) {
        return (
            <div className="rounded-xl p-4 bg-neutral-900/60 border border-neutral-800" id={`${instanceId}-panel`}>
                {Header}
                <div className="h-28 rounded-xl border border-dashed border-neutral-700 flex items-center justify-center text-neutral-400 text-sm">
                    Ingen lukkede trades i perioden.
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 border border-neutral-800" id={`${instanceId}-panel`}>
            {Header}

            <div className="flex flex-col gap-3">
                {/* KPI */}
                <div className="text-3xl font-bold text-neutral-100">{calc.avg.toFixed(1)}t</div>
                <div className="text-xs text-neutral-400">
                    Gennemsnitlig varighed · Min {calc.min.toFixed(1)}t · Max {calc.max.toFixed(1)}t
                </div>

                {/* Histogram */}
                <div className="flex flex-col gap-2">
                    {calc.buckets.map((b) => {
                        const pct = calc.total ? (b.count / calc.total) * 100 : 0;
                        return (
                            <div key={b.key} className="flex items-center gap-2">
                                <div className="w-20 text-xs text-neutral-300">{b.label}</div>
                                <div className="flex-1 h-4 bg-neutral-800 rounded">
                                    <div
                                        className="h-full rounded bg-blue-500 transition-all"
                                        style={{ width: `${pct}%` }}
                                        title={`${b.label}: ${b.count} trades`}
                                    />
                                </div>
                                <div className="w-10 text-right text-xs text-neutral-400">{b.count}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
