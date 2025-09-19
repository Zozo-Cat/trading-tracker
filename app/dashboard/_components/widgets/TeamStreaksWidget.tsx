"use client";

import { useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import TeamToggle from "../TeamToggle";
import { seededRng } from "../seededRandom";

type Props = { instanceId: string };

type Row = { name: string; w: number }; // win-streak længde

const NAMES = [
    "Aisha","Jonas","Mikkel","Sara","Yasmin","Noah","Ida","Sofia","Liam","Oliver",
    "Freja","Alma","Lucas","Elias","Emil","Malik","Omar","Maya","Ella","Anton",
];

export default function TeamStreaksWidget({ instanceId }: Props) {
    const [team, setTeam] = useState<string>();

    const rows = useMemo<Row[]>(() => {
        const rng = seededRng(`${instanceId}::streaks::${team ?? "default"}`);

        // Vælg præcis 6 deterministisk
        const pool = [...NAMES]
            .map((n) => ({ n, r: rng() }))
            .sort((a, b) => a.r - b.r)
            .slice(0, 6)
            .map((x) => x.n);

        return pool
            .map((n) => ({ name: n, w: Math.floor(rng() * 8) })) // 0..7
            .sort((a, b) => b.w - a.w);
    }, [instanceId, team]);

    const inStreak = rows.filter((r) => r.w >= 2).length;

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Team Streaks</div>
                    <HelpTip text="Hvor mange i teamet er på win-streak lige nu. Viser top 6 i én række." />
                </div>
                <TeamToggle instanceId={`${instanceId}-ts`} onChange={setTeam} />
            </div>

            <div className="text-xs text-neutral-400 mb-3">
                Antal i win-streak (≥2): <span className="text-neutral-100">{inStreak}</span> / 6
            </div>

            {/* ÉN række med horisontal scroll hvis pladsen er snæver */}
            <div className="overflow-x-auto -mx-2 px-2">
                <div className="inline-flex gap-3 min-w-max">
                    {rows.map((r) => (
                        <Member key={r.name} name={r.name} w={r.w} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function Member({ name, w }: { name: string; w: number }) {
    const color =
        w >= 5 ? "bg-emerald-600/30 text-emerald-200 border-emerald-600/50" :
            w >= 3 ? "bg-amber-600/20 text-amber-200 border-amber-600/50" :
                w >= 1 ? "bg-neutral-800 text-neutral-200 border-neutral-700" :
                    "bg-neutral-900 text-neutral-400 border-neutral-800";
    return (
        <div className={`rounded-lg border px-3 py-2 flex items-center justify-between ${color}`}>
            <div className="text-sm">{name}</div>
            <div className="text-sm tabular-nums">{w > 0 ? <>🔥 W{w}</> : "—"}</div>
        </div>
    );
}
