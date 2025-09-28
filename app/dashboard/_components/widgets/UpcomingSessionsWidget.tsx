"use client";

import { useMemo, useState } from "react";
import { usePrefs } from "@/lib/usePrefs";
import { formatDateTime } from "@/lib/format";
import HelpTip from "../HelpTip";
import TeamToggle from "../TeamToggle";
import { seededRng } from "../seededRandom";

/**
 * Upcoming Sessions (community call / mentor)
 * - Viser næste 3 sessions for valgt team/community
 * - Lokal tidszone visning
 * - Hydration-safe demo-data
 */

type Props = { instanceId: string };

type SessionItem = {
    id: string;
    title: string;
    host: string;
    atMs: number;
    kind: "Mentor" | "Community" | "Q&A";
    url: string;
};

function localTz() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Copenhagen";
    } catch {
        return "Europe/Copenhagen";
    }
}
function fmt(ms: number, tz = localTz()) {
    return new Intl.DateTimeFormat("da-DK", {
        timeZone: tz,
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(ms));
}

export default function UpcomingSessionsWidget({ instanceId }: Props) {
    const [team, setTeam] = useState<string>();
    const { prefs } = usePrefs();

    const rows = useMemo<SessionItem[]>(() => {
        // dummy data
        const rng = seededRng(instanceId + (team || "all"));
        const base = Date.now() + 4 * 3600 * 1000; // om ~4 timer frem
        const items = Array.from({ length: 6 }).map((_, i) => {
            const kind: SessionItem["kind"] = i % 3 === 0 ? "Mentor" : i % 3 === 1 ? "Community" : "Q&A";
            const title = kind === "Mentor" ? "Mentor Call" : kind === "Community" ? "Community Sync" : "Q&A Session";
            const host = kind === "Mentor" ? "Signe" : kind === "Community" ? "Team Alpha" : "Frederik";
            const atMs = base + Math.floor((i + 1) * 36 * 3600 * 1000 * (0.7 + rng() * 0.8)); // ca. 1-3 dage imellem
            return { id: `${i}`, title, host, atMs, kind, url: "#" };
        });

        // tag næste 3 frem i tid (sorteret)
        return items.sort((a, b) => a.atMs - b.atMs).slice(0, 3);
    }, [instanceId, team]);

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium">Kommende sessions</h3>
                    <HelpTip>Viser de næste par sessions for dit valgte team eller community.</HelpTip>
                </div>
                <TeamToggle value={team} onChange={setTeam} />
            </div>

            {rows.length === 0 ? (
                <div className="h-24 rounded-md border border-neutral-800 bg-neutral-900/40 flex items-center justify-center text-neutral-400">
                    Ingen planlagte sessions
                </div>
            ) : (
                <ul className="space-y-2">
                    {rows.map((s) => (
                        <li key={s.id} className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                    <div className="text-sm text-neutral-100 truncate">{s.title}</div>
                                    <div className="text-[11px] text-neutral-400">
                                        {formatDateTime(s.atMs, prefs, { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                        {" • "}
                                        Vært {s.host} ({s.kind})
                                    </div>
                                </div>
                                <a
                                    href={s.url}
                                    className="text-xs text-neutral-200 border border-neutral-600 rounded-md px-2 py-1 hover:bg-neutral-800"
                                >
                                    Join
                                </a>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
