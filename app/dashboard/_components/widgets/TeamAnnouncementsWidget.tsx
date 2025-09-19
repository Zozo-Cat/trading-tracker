"use client";

import { useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import TeamToggle from "../TeamToggle";
import { seededRng } from "../seededRandom";

type Props = { instanceId: string };

type Ann = {
    id: string;
    title: string;
    body: string;
    author: string;
    atMs: number; // absolut tid (fast anker)
};

const TZ = "Europe/Copenhagen";

function fmtDateTime(ms: number, tz = TZ) {
    return new Intl.DateTimeFormat("da-DK", {
        timeZone: tz,
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(ms));
}

export default function TeamAnnouncementsWidget({ instanceId }: Props) {
    const [team, setTeam] = useState<string>();

    const anns = useMemo<Ann[]>(() => {
        const base = Date.UTC(2024, 4, 1, 8, 0, 0); // fast anker
        const key = `${instanceId}::ann::${team ?? "default"}`;
        const rng = seededRng(key);

        const titles = [
            "Weekly review søndag kl. 19:00",
            "Nye risk-regler fra mandag",
            "Reminder: Journal før luk",
            "Q&A med mentor på torsdag",
            "Fokus: London open strategi",
            "Roadmap for juli",
        ];

        const bodies = [
            "Vi samler de vigtigste læringer fra ugen. Tag 2–3 screenshots af dine key trades.",
            "Max 1–1.5% pr. trade, ingen overtrades. Læs opslag i #risk.",
            "Kort note per trade: setup, begrundelse og efteranalyse.",
            "Åben session — medbring spørgsmål om entries, exits, SL/TP.",
            "Hold disciplin ved micro-struktur og vent på konfluens.",
            "Vi prioriterer EV-forbedring og færre B-setups.",
        ];

        const authors = ["Aisha", "Jonas", "Mikkel", "Sara", "Yasmin", "Noah", "Ida"];

        // 5 deterministiske opslag
        return Array.from({ length: 5 }).map((_, i) => {
            const t = titles[Math.floor(rng() * titles.length)];
            const b = bodies[Math.floor(rng() * bodies.length)];
            const a = authors[Math.floor(rng() * authors.length)];
            // spred ud i tid (± nogle døgn)
            const atMs = base + Math.floor((i + 1) * 36 * 3600 * 1000 * (0.6 + rng() * 0.8));
            return { id: `${i}`, title: t, body: b, author: a, atMs };
        }).sort((a, b) => b.atMs - a.atMs);
    }, [instanceId, team]);

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Team Announcements</div>
                    <HelpTip text="Opslag fra teamleder/mentorer. Toggle team for at skifte feed." />
                </div>
                <div className="flex items-center gap-3">
                    <TeamToggle instanceId={`${instanceId}-ta`} onChange={setTeam} />
                    <a href="#" className="text-xs text-neutral-300 hover:underline">Se alle</a>
                </div>
            </div>

            <ul className="divide-y divide-neutral-800">
                {anns.map((a) => (
                    <li key={a.id} className="py-3 flex items-start gap-3">
                        <Avatar name={a.author} />
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-neutral-100">{a.title}</div>
                                <div className="text-[11px] text-neutral-400">{fmtDateTime(a.atMs)}</div>
                            </div>
                            <div className="text-sm text-neutral-300 mt-1">{a.body}</div>
                            <div className="text-xs text-neutral-400 mt-1">af {a.author}</div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function Avatar({ name }: { name: string }) {
    const initials = name
        .split(" ")
        .map((x) => x[0]?.toUpperCase() ?? "")
        .slice(0, 2)
        .join("");
    return (
        <div className="w-8 h-8 rounded-full bg-neutral-700 text-neutral-100 text-xs flex items-center justify-center">
            {initials || "?"}
        </div>
    );
}
