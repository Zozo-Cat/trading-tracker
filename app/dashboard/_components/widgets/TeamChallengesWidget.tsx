"use client";

import { useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";
import TeamToggle from "../TeamToggle";

type Props = { instanceId: string };

type Chal = { title: string; current: number; target: number };

export default function TeamChallengesWidget({ instanceId }: Props) {
    const [team, setTeam] = useState<string>();
    const rng = useMemo(() => seededRng(`${instanceId}::team-challenges`), [instanceId]);

    const challenges: Chal[] = useMemo(() => {
        const tkey = team ?? "default";
        const trng = seededRng(`${instanceId}::chals::${tkey}`);

        const make = (title: string, target: number) => {
            const pct = 0.15 + trng() * 0.7; // 15..85%
            return { title, current: Math.round(pct * target), target };
        };
        return [
            make("100R i måneden (fælles)", 100),
            make("200 journal-noter i teamet", 200),
            make("Winrate ≥ 58% (ugens snit)", 58),
        ];
    }, [instanceId, team, rng]);

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Team Challenges</div>
                    <HelpTip text="Fælles udfordringer for teamet. Fremdrift beregnes på tværs af medlemmer." />
                </div>
                <div className="flex items-center gap-3">
                    <TeamToggle instanceId={`${instanceId}-tc`} onChange={setTeam} />
                    <a href="#" className="text-xs text-neutral-300 hover:underline">Se alle</a>
                </div>
            </div>

            <div className="space-y-3">
                {challenges.map((c, i) => (
                    <Line key={i} title={c.title} current={c.current} target={c.target} />
                ))}
            </div>
        </div>
    );
}

function Line({ title, current, target }: { title: string; current: number; target: number }) {
    const pct = Math.max(0, Math.min(100, Math.round((current / Math.max(1, target)) * 100)));
    const color = pct < 40 ? "#ef4444" : pct < 80 ? "#D4AF37" : "#10b981";
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-neutral-200">{title}</div>
                <div className="text-xs text-neutral-400">
                    {current}/{target} ({pct}%)
                </div>
            </div>
            <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                    className="h-full transition-[width] duration-300 ease-out"
                    style={{ width: `${pct}%`, background: color }}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pct}
                    role="progressbar"
                />
            </div>
        </div>
    );
}
