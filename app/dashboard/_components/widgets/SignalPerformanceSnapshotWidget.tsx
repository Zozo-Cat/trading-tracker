"use client";

import { useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import { seededRng } from "../seededRandom";

/**
 * Signal Performance Snapshot
 * - KPI'er: Winrate, Total P/L (R), Gennemsnitlig R, Antal signaler
 * - Mini horisontal barchart: winrate pr. symbol/strategi (top 4)
 * - Hydration-safe demo data
 */

type Props = { instanceId: string };

type Sig = {
    sym: string;
    r: number; // resultat i R
};

const SYMBOLS = ["EURUSD", "XAUUSD", "NAS100", "US30", "BTCUSD", "ETHUSD", "GBPUSD", "DAX40"];

export default function SignalPerformanceSnapshotWidget({ instanceId }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");

    const rows = useMemo<Sig[]>(() => {
        // deterministisk pr. instans + periode
        const rng = seededRng(`${instanceId}::sigperf::${period}`);
        // syntetiser 40-80 signaler alt efter periode
        const nBase = period === "day" ? 40 : period === "week" ? 60 : 80;
        const n = nBase;
        const out: Sig[] = [];
        for (let i = 0; i < n; i++) {
            const sym = SYMBOLS[Math.floor(rng() * SYMBOLS.length)];
            // ca. 47-58% hitrate – spredning omkring 0
            const win = rng() < (0.47 + rng() * 0.11);
            const magnitude = 0.3 + rng() * 1.1; // 0.3..1.4R
            const r = win ? magnitude : -magnitude * (0.7 + rng() * 0.6); // tab typisk lidt større/lig
            out.push({ sym, r: round2(r) });
        }
        return out;
    }, [instanceId, period]);

    const kpis = useMemo(() => {
        if (rows.length === 0) {
            return { wr: 0, totalR: 0, avgR: 0, n: 0 };
        }
        const n = rows.length;
        const wins = rows.filter((x) => x.r > 0).length;
        const wr = wins / n;
        const totalR = rows.reduce((s, x) => s + x.r, 0);
        const avgR = totalR / n;
        return { wr, totalR, avgR, n };
    }, [rows]);

    const bySym = useMemo(() => {
        const map = new Map<string, { n: number; w: number }>();
        for (const r of rows) {
            const m = map.get(r.sym) ?? { n: 0, w: 0 };
            m.n += 1;
            if (r.r > 0) m.w += 1;
            map.set(r.sym, m);
        }
        const all = Array.from(map.entries()).map(([sym, v]) => ({
            sym,
            wr: v.n ? v.w / v.n : 0,
            n: v.n,
        }));
        // top 4 efter winrate, min 4 trades
        return all
            .filter((x) => x.n >= 4)
            .sort((a, b) => b.wr - a.wr)
            .slice(0, 4);
    }, [rows]);

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Signal Performance (snapshot)</div>
                    <HelpTip text="Hurtigt overblik over signalers performance. Winrate, samlet R, gennemsnitlig R og top-symboler." />
                </div>
                <PeriodToggle instanceId={instanceId} slug="sigperf" defaultValue="day" onChange={setPeriod} />
            </div>

            {/* KPI'er */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <Kpi label="Winrate" value={pctStr(kpis.wr)} intent={kpis.wr >= 0.5 ? "good" : kpis.wr >= 0.4 ? "warn" : "bad"} />
                <Kpi label="Total (R)" value={numStr(kpis.totalR, 2)} intent={kpis.totalR >= 0 ? "good" : "bad"} />
                <Kpi label="Avg (R)" value={numStr(kpis.avgR, 2)} intent={kpis.avgR >= 0 ? "good" : kpis.avgR > -0.1 ? "warn" : "bad"} />
                <Kpi label="Antal" value={String(kpis.n)} intent="neutral" />
            </div>

            {/* Mini bar chart: winrate pr. symbol (top 4) */}
            <div>
                <div className="text-xs text-neutral-400 mb-1">Top symboler (winrate)</div>
                <div className="space-y-2">
                    {bySym.length === 0 ? (
                        <div className="h-20 rounded-lg border border-dashed border-neutral-700 flex items-center justify-center text-neutral-400 text-sm">
                            Ingen data.
                        </div>
                    ) : (
                        bySym.map((x) => <BarRow key={x.sym} label={x.sym} value={x.wr} count={x.n} />)
                    )}
                </div>
            </div>
        </div>
    );
}

function Kpi({ label, value, intent }: { label: string; value: string; intent: "good" | "warn" | "bad" | "neutral" }) {
    const cls =
        intent === "good"
            ? "text-emerald-300"
            : intent === "warn"
                ? "text-amber-300"
                : intent === "bad"
                    ? "text-rose-300"
                    : "text-neutral-200";
    return (
        <div className="rounded-lg border border-neutral-700 p-3">
            <div className="text-xs text-neutral-400">{label}</div>
            <div className={`text-xl font-semibold tabular-nums ${cls}`}>{value}</div>
        </div>
    );
}

function BarRow({ label, value, count }: { label: string; value: number; count: number }) {
    const pct = Math.max(0, Math.min(1, value)) * 100;
    const color =
        value >= 0.55 ? "#10b981" : value >= 0.45 ? "#D4AF37" : "#ef4444"; // grøn / guld / rød
    return (
        <div className="flex items-center gap-3">
            <div className="w-20 shrink-0 text-xs text-neutral-300">{label}</div>
            <div className="flex-1 h-5 rounded bg-neutral-800 overflow-hidden border border-neutral-700">
                <div
                    className="h-full"
                    style={{ width: `${pct}%`, background: color, transition: "width 200ms ease" }}
                    aria-label={`${label}: ${Math.round(pct)}% winrate · n=${count}`}
                />
            </div>
            <div className="w-20 text-right text-xs text-neutral-300">
                {Math.round(pct)}% · n={count}
            </div>
        </div>
    );
}

function pctStr(v: number) {
    if (!isFinite(v)) return "—";
    return (v * 100).toFixed(0).replace(".", ",") + "%";
}
function numStr(v: number, d = 2) {
    if (!isFinite(v)) return "—";
    return (v >= 0 ? "+" : "") + v.toFixed(d).replace(".", ",");
}
function round2(n: number) {
    return Math.round(n * 100) / 100;
}
