"use client";

import { useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";
import TeamToggle from "../TeamToggle";

type Props = { instanceId: string };
type Metric = "points" | "ev" | "winrate" | "r-multiple";

export default function MyRankInTeamWidget({ instanceId }: Props) {
    const [team, setTeam] = useState<string>();
    const [metric, setMetric] = useState<Metric>("points");

    const rng = useMemo(
        () => seededRng(`${instanceId}::my-rank::${team ?? "default"}::${metric}`),
        [instanceId, team, metric]
    );

    // deterministisk teamstørrelse + “min” performance → rank
    const teamSize = useMemo(() => 15 + Math.floor(rng() * 25), [rng]); // 15..39
    // vi “trækker” min score i distributionen → rank
    const myRank = useMemo(() => 1 + Math.floor(rng() * teamSize), [rng, teamSize]);

    const topPercent = Math.max(1, Math.round((myRank / teamSize) * 100));
    const pctBar = Math.round(((teamSize - myRank + 1) / teamSize) * 100); // god = høj
    const color = pctBar < 40 ? "#ef4444" : pctBar < 75 ? "#D4AF37" : "#10b981";

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
                    <div className="font-medium">Min placering i team</div>
                    <HelpTip text="Placering baseret på valgt scoremetrik. Skift team/metric for at se din relative position." />
                </div>
                <div className="flex items-center gap-3">
                    <TeamToggle instanceId={`${instanceId}-mr`} onChange={setTeam} />
                    <MetricSelect value={metric} onChange={setMetric} />
                    <a href="#" className="text-xs text-neutral-300 hover:underline">Se leaderboard</a>
                </div>
            </div>

            <div className="mb-1 text-xs text-neutral-400">{metricLabel}</div>

            <div className="flex items-end justify-between mb-2">
                <div className="text-sm text-neutral-300">Din placering</div>
                <div className="text-sm text-neutral-100">
                    #{myRank} af {teamSize} · top {topPercent}%
                </div>
            </div>

            <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                    className="h-full transition-[width] duration-300 ease-out"
                    style={{ width: `${pctBar}%`, background: color }}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pctBar}
                />
            </div>
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
