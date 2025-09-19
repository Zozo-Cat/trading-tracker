"use client";

import { useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import TeamToggle from "../TeamToggle";
import { seededRng } from "../seededRandom";

type Props = { instanceId: string };

type Badge = {
    id: string;
    user: string;
    kind: "Green3" | "RiskDiscipline" | "JournalHero" | "RR2" | "Consistency";
    ms: number;
};

const TZ = "Europe/Copenhagen";

function fmt(ms: number, tz = TZ) {
    return new Intl.DateTimeFormat("da-DK", {
        timeZone: tz,
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(ms));
}

const NAMES = [
    "Aisha","Jonas","Mikkel","Sara","Yasmin","Noah","Ida","Sofia","Liam","Oliver",
    "Freja","Alma","Lucas","Elias","Emil","Malik","Omar","Maya","Ella","Anton",
];

export default function BadgesEarnedByTeamWidget({ instanceId }: Props) {
    const [team, setTeam] = useState<string>();

    const items = useMemo<Badge[]>(() => {
        const base = Date.UTC(2024, 4, 1, 9, 0, 0);
        const rng = seededRng(`${instanceId}::badges::${team ?? "default"}`);
        const kinds: Badge["kind"][] = ["Green3", "RiskDiscipline", "JournalHero", "RR2", "Consistency"];

        // 6 "seneste"
        return Array.from({ length: 6 }).map((_, i) => {
            const user = NAMES[Math.floor(rng() * NAMES.length)];
            const kind = kinds[Math.floor(rng() * kinds.length)];
            const ms = base + Math.floor((i + 1) * 26 * 3600 * 1000 * (0.7 + rng() * 0.6));
            return { id: `${i}-${user}`, user, kind, ms };
        }).sort((a, b) => b.ms - a.ms);
    }, [instanceId, team]);

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Badges Earned by Team</div>
                    <HelpTip text="Seneste badges optjent af holdkammerater. Hold musen over for forklaring." />
                </div>
                <div className="flex items-center gap-3">
                    <TeamToggle instanceId={`${instanceId}-bt`} onChange={setTeam} />
                    <a href="#" className="text-xs text-neutral-300 hover:underline">Se alle badges</a>
                </div>
            </div>

            <ul className="divide-y divide-neutral-800">
                {items.map((b) => (
                    <li key={b.id} className="py-2 flex items-center justify-between">
                        <div className="text-sm text-neutral-200">{b.user}</div>
                        <div className="flex items-center gap-3">
                            <BadgePill kind={b.kind} />
                            <div className="text-[11px] text-neutral-400">{fmt(b.ms)}</div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function BadgePill({ kind }: { kind: Badge["kind"] }) {
    const meta = badgeMeta(kind);
    return (
        <span
            className={`text-xs px-2 py-0.5 rounded-full border ${meta.cls}`}
            title={meta.tip}
        >
      {meta.icon} {meta.label}
    </span>
    );
}

function badgeMeta(kind: Badge["kind"]) {
    switch (kind) {
        case "Green3":
            return {
                label: "3 grønne dage",
                icon: "🟢",
                tip: "Tre sammenhængende grønne sessions/dage.",
                cls: "border-emerald-600/50 text-emerald-200 bg-emerald-600/20",
            };
        case "RiskDiscipline":
            return {
                label: "Risk Discipline",
                icon: "🛡️",
                tip: "Alle trades under max-risk i en uge.",
                cls: "border-sky-600/50 text-sky-200 bg-sky-600/20",
            };
        case "JournalHero":
            return {
                label: "Journal Hero",
                icon: "📓",
                tip: "Journalført 100% af ugens trades med noter.",
                cls: "border-amber-600/50 text-amber-200 bg-amber-600/20",
            };
        case "RR2":
            return {
                label: "2.0R+",
                icon: "🏁",
                tip: "Gns. R/R ≥ 2.0 i løbet af ugen.",
                cls: "border-fuchsia-600/50 text-fuchsia-200 bg-fuchsia-600/20",
            };
        default:
            return {
                label: "Consistency",
                icon: "📈",
                tip: "Stabil performance uden store udsving.",
                cls: "border-neutral-600/50 text-neutral-200 bg-neutral-700/20",
            };
    }
}
