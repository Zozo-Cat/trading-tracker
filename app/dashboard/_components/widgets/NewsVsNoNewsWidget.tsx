// app/dashboard/_components/widgets/NewsVsNoNewsWidget.tsx
"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

/**
 * NewsVsNoNewsWidget (hydration-safe)
 * - Sammenligner performance "tæt på nyheder" vs "ikke nyheder"
 * - Toggle: Dag/Uge/Måned + P/L / Win%
 * - Demo-data: deterministisk & fast-ankret i UTC (ingen afhængighed af “nu”)
 */

type Props = { instanceId: string };

type ClosedTrade = {
    openedAt: number;  // ms (UTC)
    pl: number;        // P/L i konto-valuta
    result?: "WIN" | "LOSS" | "BE";
};

type NewsEvent = {
    time: number;      // ms (UTC)
    impact: number;    // 1=low,2=med,3=high
};

const MINUTE = 60 * 1000;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;

/* ===== Fast anker (stabil SSR/CSR) ===== */
const BASE_UTC = Date.UTC(2024, 0, 1, 0, 0, 0, 0);

/* ===== Vindue baglæns fra givet slut === */
function windowFromEnd(endMs: number, p: PeriodValue) {
    if (p === "day")  return { startMs: endMs - 1 * DAY, endMs };
    if (p === "week") return { startMs: endMs - 7 * DAY, endMs };
    return { startMs: endMs - 30 * DAY, endMs }; // “måned” = 30d rullende
}

/* ===== Demo-data (deterministisk) ===== */
function demoTradesUTC(rng: () => number): ClosedTrade[] {
    // Generér trades over ~48 timer, hvert 2. time, fast forankret i UTC
    const start = BASE_UTC + 10 * HOUR; // start dag 1 kl. 10Z
    const out: ClosedTrade[] = [];

    for (let h = 0; h <= 48; h += 2) {
        const t = start + h * HOUR;
        // Sandsynlighed for trade
        if (rng() < (h % 6 === 0 ? 0.85 : 0.45)) {
            const win = rng() < 0.55;
            const magnitude = 30 + rng() * 120;
            out.push({ openedAt: t, pl: (win ? 1 : -1) * magnitude, result: win ? "WIN" : "LOSS" });

            // Nogle timer får to trades
            if (rng() < 0.25) {
                const t2 = t + 35 * MINUTE;
                const win2 = rng() < 0.52;
                const mag2 = 20 + rng() * 90;
                out.push({ openedAt: t2, pl: (win2 ? 1 : -1) * mag2, result: win2 ? "WIN" : "LOSS" });
            }
        }
    }
    return out;
}

function demoEventsUTC(rng: () => number): NewsEvent[] {
    // 6 events over ~36 timer, impacts 1..3, fast-ankret
    const base = BASE_UTC + 6 * HOUR;
    const out: NewsEvent[] = [];
    const hours = [ 0, 6, 12, 18, 24, 36 ];
    for (const h of hours) {
        const t = base + h * HOUR;
        const r = rng();
        const impact = r < 0.15 ? 1 : r < 0.6 ? 2 : 3;
        out.push({ time: t, impact });
    }
    return out;
}

/* ===== Komponent ===== */
export default function NewsVsNoNewsWidget({ instanceId }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");
    const [metric, setMetric] = useState<"pl" | "win">("pl");

    // Parametre
    const impactThreshold = 2;      // med+ = news
    const eventWindowMinutes = 60;  // ±60 min
    const windowMs = eventWindowMinutes * MINUTE;

    // Deterministisk RNG pr. widget-instans
    const rng = useMemo(() => seededRng(`${instanceId}::newsVsNoNews`), [instanceId]);

    // Demo-data (fast-ankret; uafhængig af "nu")
    const trades = useMemo(() => demoTradesUTC(rng), [rng]);
    const events = useMemo(() => demoEventsUTC(rng), [rng]);

    // Stabilt periodevindue: brug seriens sidste timestamp som "nu"
    const calc = useMemo(() => {
        if (!trades.length) return { data: [], totalN: 0 };

        const endMs = trades[trades.length - 1].openedAt;
        const { startMs } = windowFromEnd(endMs, period);

        const inRange = trades.filter((t) => t.openedAt >= startMs && t.openedAt <= endMs);

        let newsTotal = 0, newsWins = 0, newsPL = 0;
        let noneTotal = 0, noneWins = 0, nonePL = 0;

        for (const t of inRange) {
            const isNews = events.some(
                (e) => e.impact >= impactThreshold && Math.abs(t.openedAt - e.time) <= windowMs
            );
            const win = t.result ? t.result === "WIN" : t.pl > 0;

            if (isNews) {
                newsTotal++; if (win) newsWins++; newsPL += t.pl;
            } else {
                noneTotal++; if (win) noneWins++; nonePL += t.pl;
            }
        }

        const newsWinPct = newsTotal ? (newsWins / newsTotal) * 100 : 0;
        const noneWinPct = noneTotal ? (noneWins / noneTotal) * 100 : 0;

        return {
            data: [
                { label: "News",    pl: +newsPL.toFixed(2),  win: +newsWinPct.toFixed(2),  count: newsTotal },
                { label: "No-news", pl: +nonePL.toFixed(2),  win: +noneWinPct.toFixed(2),  count: noneTotal },
            ],
            totalN: newsTotal + noneTotal,
        };
    }, [trades, events, period, impactThreshold, windowMs]);

    const hasAny = calc.totalN > 0;

    return (
        <div
            className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800"
            id={`${instanceId}-panel`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="font-medium">News vs. no-news</div>
                    <HelpTip text="Sammenligner handler tæt på nyheder (impact≥medium, ±60 min) mod andre handler. Toggle P/L eller Win%." />
                </div>
                <div className="flex items-center gap-2">
                    {/* Metric toggle */}
                    <div className="flex rounded-lg overflow-hidden border border-neutral-700">
                        <button
                            onClick={() => setMetric("pl")}
                            className={`px-2 py-1 text-xs ${metric === "pl" ? "bg-neutral-700 text-white" : "text-neutral-300 hover:bg-neutral-800"}`}
                        >
                            P/L
                        </button>
                        <button
                            onClick={() => setMetric("win")}
                            className={`px-2 py-1 text-xs ${metric === "win" ? "bg-neutral-700 text-white" : "text-neutral-300 hover:bg-neutral-800"}`}
                        >
                            Win%
                        </button>
                    </div>
                    <PeriodToggle instanceId={instanceId} slug="newsVsNoNews" defaultValue="day" onChange={setPeriod} />
                </div>
            </div>

            {/* Body */}
            {!hasAny ? (
                <div className="flex h-40 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-neutral-700 text-center">
                    <p className="text-sm text-neutral-300">Ingen trades i valgt periode.</p>
                    <p className="text-xs text-neutral-500">Tip: Importér eller udfør flere handler – eller justér perioden.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {calc.data.map((row) => (
                        <BarRow
                            key={row.label}
                            label={row.label}
                            value={metric === "pl" ? row.pl : row.win}
                            metric={metric}
                            count={row.count}
                        />
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
                <span>Vinduet: ±{eventWindowMinutes} min • Impact≥{impactThreshold}</span>
                <a href="/analytics/setups" className="text-neutral-300 underline-offset-2 hover:underline">
                    Dyk dybere i analyser
                </a>
            </div>
        </div>
    );
}

function BarRow({
                    label,
                    value,
                    metric,
                    count,
                }: {
    label: string;
    value: number;     // P/L eller Win%
    metric: "pl" | "win";
    count: number;
}) {
    // Win%: direkte 0..100
    // P/L: blød skala via atan, clampet til ±50%, centreret omkring 50%
    const pct = metric === "win"
        ? Math.max(0, Math.min(100, value))
        : 50 + Math.max(-50, Math.min(50, value === 0 ? 0 : (Math.atan(value / 500) / (Math.PI / 2)) * 50));

    const labelRight = metric === "pl"
        ? `${value >= 0 ? "+" : ""}${Math.round(value)}`
        : `${value.toFixed(0)}%`;

    // Farve: grøn/guld/rød
    const color =
        metric === "win"
            ? pct >= 60 ? "#10b981" : pct >= 45 ? "#D4AF37" : "#ef4444"
            : value >= 0 ? "#10b981" : "#ef4444";

    return (
        <div className="flex items-center gap-3">
            <div className="w-20 text-xs text-neutral-300">{label}</div>
            <div className="flex-1 h-5 bg-neutral-800 rounded overflow-hidden">
                <div
                    className="h-full"
                    style={{ width: `${pct}%`, background: color, transition: "width 200ms ease" }}
                    title={`${label}: ${labelRight} · n=${count}`}
                />
            </div>
            <div className="w-20 text-right text-xs text-neutral-300">{labelRight}</div>
        </div>
    );
}
