"use client";

import { useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";
import TeamToggle from "../TeamToggle";

type Props = { instanceId: string };

type Row = { name: string; score: number; rank: number };

const NAMES = [
    "Aisha", "Jonas", "Mikkel", "Sara", "Yasmin", "Noah", "Ida", "Sofia", "Liam", "Oliver",
    "Freja", "Alma", "Lucas", "Elias", "Emil",
];

type Metric = "points" | "ev" | "winrate" | "r-multiple";

export default function LeaderboardSnapshotWidget({ instanceId }: Props) {
    const [team, setTeam] = useState<string>();
    const [metric, setMetric] = useState<Metric>("points");

    const rows = useMemo(() => {
        const key = `${instanceId}::lb::${team ?? "default"}::${metric}`;
        const rng = seededRng(key);

        // pluk 8 navne deterministisk
        const shuffled = [...NAMES]
            .map((n) => ({ n, r: rng() }))
            .sort((a, b) => a.r - b.r)
            .slice(0, 8)
            .map((x) => x.n);

        // Generer “grunddata” per medlem
        const base = shuffled.map((n) => ({
            name: n,
            ev: round2((rng() * 0.5) - 0.05),            // -0.05 .. +0.45
            win: 45 + Math.round(rng() * 25),            // 45..70%
            rMult: round2(0.7 + rng() * 1.2),            // 0.7..1.9
            journal: 50 + Math.round(rng() * 50),        // 50..100%
            consistency: 50 + Math.round(rng() * 50),    // 50..100%
        }));

        // Scorer efter valgt metric
        const scored = base.map((m) => ({
            name: m.name,
            score:
                metric === "ev" ? m.ev :
                    metric === "winrate" ? m.win :
                        metric === "r-multiple" ? m.rMult :
                            // points (blandet): EV*50 + Win%*0.5 + Consistency*0.2 + Journal*0.2
                            round2(m.ev * 50 + m.win * 0.5 + m.consistency * 0.2 + m.journal * 0.2),
            meta: m,
        }));

        scored.sort((a, b) => b.score - a.score);
        const top = scored.slice(0, 5);
        return top.map((r, i) => ({ name: r.name, score: r.score, rank: i + 1 })) as Row[];
    }, [instanceId, team, metric]);

    const metricLabel =
        metric === "points"
            ? "Points (blandet: EV, winrate, consistency, journal)"
            : metric === "ev"
                ? "Expectancy (EV)"
                : metric === "winrate"
                    ? "Winrate"
                    : "R-multiple (gennemsnit)";

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Leaderboard (snapshot)</div>
                    <HelpTip text="Top 3–5 i teamet. Skift team og scoremetrik for at se et relevant snapshot." />
                </div>
                <div className="flex items-center gap-3">
                    <TeamToggle instanceId={`${instanceId}-lb`} onChange={setTeam} />
                    <MetricSelect value={metric} onChange={setMetric} />
                    <a href="#" className="text-xs text-neutral-300 hover:underline">Se fuldt leaderboard</a>
                </div>
            </div>

            <div className="mb-2 text-xs text-neutral-400">{metricLabel}</div>

            <ul className="divide-y divide-neutral-800">
                {rows.map((r) => (
                    <li key={r.name} className="py-2 flex items-center">
                        <div className="w-8">
                            {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                        </div>
                        <div className="flex-1 text-sm text-neutral-100">{r.name}</div>
                        <div className="text-sm tabular-nums text-neutral-200">
                            {metric === "ev" ? `${r.score.toFixed(2)} EV`
                                : metric === "winrate" ? `${r.score.toFixed(0)}%`
                                    : metric === "r-multiple" ? `${r.score.toFixed(2)}R`
                                        : `${r.score.toFixed(1)} pts`}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function MetricSelect({
                          value,
                          onChange,
                      }: {
    value: Metric;
    onChange: (m: Metric) => void;
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value as Metric)}
            className="bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1 text-xs text-neutral-100"
            title="Vælg scoremetrik"
        >
            <option value="points">Points (blandet)</option>
            <option value="ev">EV</option>
            <option value="winrate">Winrate</option>
            <option value="r-multiple">R-multiple</option>
        </select>
    );
}

function round2(n: number) {
    return Math.round(n * 100) / 100;
}
