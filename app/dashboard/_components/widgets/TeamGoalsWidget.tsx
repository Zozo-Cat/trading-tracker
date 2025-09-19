"use client";

import { useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";
import TeamToggle from "../TeamToggle";

type Props = { instanceId: string };

type Goal = {
    idx: number;
    title: string;
    scope: "Dagligt" | "Ugentligt" | "Månedligt";
    current: number; // progression
    target: number;  // mål
};

export default function TeamGoalsWidget({ instanceId }: Props) {
    const [team, setTeam] = useState<string>(); // styres af TeamToggle
    const rng = useMemo(() => seededRng(`${instanceId}::team-goals`), [instanceId]);

    const goals = useMemo<Goal[]>(() => {
        // Liste af mål som giver mening i et trading-team (pladsholdere)
        const base = [
            { title: "Journal efter hver trade", scope: "Dagligt", target: 100 },
            { title: "Hold max 1% risk pr. trade", scope: "Dagligt", target: 100 },
            { title: "Winrate ≥ 55% (ugens snit)", scope: "Ugentligt", target: 55 },
            { title: "EV ≥ 0.20 (ugens snit)", scope: "Ugentligt", target: 20 }, // vi viser 'current' skaleret i pct-points
            { title: "Weekly review søndag", scope: "Ugentligt", target: 1 },
        ] as const;

        // team påvirker seed, så hvert team får “sin” progress
        const teamKey = team ?? "default";
        const trng = seededRng(`${instanceId}::goals::${teamKey}`);

        return base.map((g, i) => {
            // lav en deterministisk progression
            const pct = 0.2 + trng() * 0.7; // 20..90%
            const current = Math.max(0, Math.round(pct * g.target));
            return { idx: i + 1, title: g.title, scope: g.scope, current, target: g.target };
        });
    }, [instanceId, team, rng]);

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Team Goals</div>
                    <HelpTip text="Defineret af teamleder. Her ser du progression på teamets vigtigste mål." />
                </div>
                <div className="flex items-center gap-3">
                    <TeamToggle instanceId={`${instanceId}-tg`} onChange={setTeam} />
                    <a href="#" className="text-xs text-neutral-300 hover:underline">Åbn team-side</a>
                </div>
            </div>

            {/* Liste med progression-bjælker (i stedet for checkboxes) */}
            <ul className="space-y-3">
                {goals.map((g) => (
                    <li key={g.idx}>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                <span className="text-xs w-5 h-5 inline-flex items-center justify-center rounded-md border border-neutral-700 text-neutral-300">
                  {g.idx}
                </span>
                                <span className="text-sm text-neutral-100">{g.title}</span>
                            </div>
                            <div className="text-xs text-neutral-400">{g.scope}</div>
                        </div>
                        <ProgressLine current={g.current} target={g.target} />
                    </li>
                ))}
            </ul>
        </div>
    );
}

function ProgressLine({ current, target }: { current: number; target: number }) {
    const pct = Math.max(0, Math.min(100, Math.round((current / Math.max(1, target)) * 100)));
    const color = pct < 40 ? "#ef4444" : pct < 80 ? "#D4AF37" : "#10b981";
    return (
        <div>
            <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                    className="h-full transition-[width] duration-300 ease-out"
                    style={{ width: `${pct}%`, background: color }}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pct}
                />
            </div>
            <div className="mt-1 text-[11px] text-neutral-400 tabular-nums">
                {current}/{target} ({pct}%)
            </div>
        </div>
    );
}
