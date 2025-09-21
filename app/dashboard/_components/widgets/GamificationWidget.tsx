// app/dashboard/_components/widgets/GamificationWidget.tsx
"use client";

import HelpTip from "../HelpTip";
import { useMemo } from "react";
import { seededRng } from "../seededRandom";

type Props = { instanceId: string };

type Badge = { key: string; name: string };

const BADGE_DESCRIPTIONS: Record<string, string> = {
    "first-trade": "Din første loggede trade.",
    "5R-day": "Opnå samlet ≥ 5R på én dag.",
    "10-logs": "Udfyld 10 journal-noter.",
    "consistency-7": "Log hver dag i 7 dage.",
    "risk-ninja": "Holdt max-risk pr. trade i 10 dage.",
    "patience": "Ingen impuls-trades i en uge.",
};

export default function GamificationWidget({ instanceId }: Props) {
    const data = useMemo(() => {
        const rng = seededRng(`${instanceId}::gami`);
        const currentWinStreak = 1 + Math.floor(rng() * 5);
        const journalStreak = 2 + Math.floor(rng() * 7);
        const dayStreak = 3 + Math.floor(rng() * 10);

        const allBadges: Badge[] = [
            { key: "first-trade", name: "First Trade" },
            { key: "5R-day", name: "5R Day" },
            { key: "10-logs", name: "10 Logs" },
            { key: "consistency-7", name: "Consistency 7d" },
            { key: "risk-ninja", name: "Risk Ninja" },
            { key: "patience", name: "Patience Pro" },
        ];

        const unlocked = allBadges.filter(() => rng() > 0.45).slice(0, 4);
        return { currentWinStreak, journalStreak, dayStreak, unlocked };
    }, [instanceId]);

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Gamification</div>
                    <HelpTip text="Let gamification: streaks og badges. Ægte data kobles senere." />
                </div>
                <a className="text-xs text-neutral-300 hover:underline" href="#">
                    Se alle badges
                </a>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <Box label="Win-streak" value={`${data.currentWinStreak}`} />
                <Box label="Journal-streak (dage)" value={`${data.journalStreak}`} />
                <Box label="Day-streak (login)" value={`${data.dayStreak}`} />
            </div>

            <div className="mt-4">
                <div className="text-sm mb-2 text-neutral-300">Badges</div>
                <div className="flex flex-wrap gap-2">
                    {data.unlocked.length === 0 ? (
                        <span className="text-neutral-400 text-sm">Ingen badges endnu.</span>
                    ) : (
                        data.unlocked.map((b) => {
                            const desc = BADGE_DESCRIPTIONS[b.key] ?? b.name;
                            return (
                                <span
                                    key={b.key}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border border-emerald-700/60 bg-emerald-900/20 text-emerald-200"
                                    title={desc}
                                    aria-label={`${b.name}: ${desc}`}
                                >
                  🏅 {b.name}
                </span>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

function Box({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-neutral-700 p-3">
            <div className="text-xs text-neutral-400">{label}</div>
            <div className="text-2xl font-semibold">{value}</div>
        </div>
    );
}
