"use client";

import { useMemo, useState } from "react";
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

type Sess = {
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

    const rows = useMemo<Sess[]>(() => {
        const rng = seededRng(`${instanceId}::sessions::${team ?? "default"}`);
        const base = Date.UTC(2024, 6, 1, 14, 0, 0); // fast anker
        const TITLES = [
            "Weekly Mentor Call",
            "London Open Review",
            "Macro & News Outlook",
            "Risk Management Q&A",
            "Strategy Deep Dive",
            "Backtest Clinic",
        ];
        const HOSTS = ["Zara", "Yusuf", "Mikkel", "Sara", "Ida", "Malik"];

        const items = Array.from({ length: 6 }).map((_, i) => {
            const title = TITLES[Math.floor(rng() * TITLES.length)];
            const host = HOSTS[Math.floor(rng() * HOSTS.length)];
            const kind: Sess["kind"] = rng() < 0.4 ? "Mentor" : rng() < 0.7 ? "Community" : "Q&A";
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
                    <div className="font-medium">Upcoming Sessions</div>
                    <HelpTip text="Næste community/mentor-sessions. Skifter efter valgt team." />
                </div>
                <TeamToggle instanceId={`${instanceId}-ups`} onChange={setTeam} />
            </div>

            {rows.length === 0 ? (
                <div className="h-20 rounded-lg border border-dashed border-neutral-700 flex items-center justify-center text-neutral-400 text-sm">
                    Ingen planlagte sessions.
                </div>
            ) : (
                <ul className="space-y-2">
                    {rows.map((s) => (
                        <li key={s.id} className="rounded-lg border border-neutral-700 p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-sm text-neutral-200 truncate">{s.title}</div>
                                <div className="text-xs text-neutral-400">{fmt(s.atMs)} • Vært: {s.host}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded-full border text-xs ${
                    s.kind === "Mentor"
                        ? "border-emerald-600/50 text-emerald-200 bg-emerald-600/20"
                        : s.kind === "Community"
                            ? "border-sky-600/50 text-sky-200 bg-sky-600/20"
                            : "border-amber-600/50 text-amber-200 bg-amber-600/20"
                }`}>
                  {s.kind}
                </span>
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
