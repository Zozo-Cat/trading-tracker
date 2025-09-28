"use client";

import { useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import TeamToggle from "../TeamToggle";
import { seededRng } from "../seededRandom";
import { usePrefs } from "@/lib/usePrefs";
import { formatDateTime } from "@/lib/format";

type Props = { instanceId: string };

type Ann = {
    id: string;
    title: string;
    body: string;
    author: string;
    atMs: number; // absolut tid (fast anker)
};

const TZ = "Europe/Copenhagen";

function fmtDateTimeLegacy(ms: number, tz = TZ) {
    return new Intl.DateTimeFormat("da-DK", {
        timeZone: tz,
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(ms));
}

export default function TeamAnnouncementsWidget({ instanceId }: Props) {
    const { prefs } = usePrefs();
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
        return Array.from({ length: 5 })
            .map((_, i) => {
                const t = titles[Math.floor(rng() * titles.length)];
                const b = bodies[Math.floor(rng() * bodies.length)];
                const a = authors[Math.floor(rng() * authors.length)];
                // spred ud i tid (± nogle døgn)
                const atMs = base + Math.floor((i + 1) * 36 * 3600 * 1000 * (0.6 + rng() * 0.8));
                return { id: `${i}`, title: t, body: b, author: a, atMs };
            })
            .sort((a, b) => b.atMs - a.atMs);
    }, [instanceId, team]);

    return (
        <div className="h-full flex flex-col">
            <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold opacity-90">Team Annonceringer</div>
                <div className="flex items-center gap-3">
                    <HelpTip>Interne opslag fra dit team/mentor.</HelpTip>
                    <TeamToggle onChange={setTeam} />
                </div>
            </div>

            <div className="space-y-3">
                {anns.map((a) => (
                    <div key={a.id} className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="font-medium">{a.title}</div>
                                <div className="text-sm text-neutral-300">{a.body}</div>
                                <div className="text-xs text-neutral-400 mt-0.5">— {a.author}</div>
                            </div>
                            <div className="text-xs text-neutral-400 whitespace-nowrap">
                                {formatDateTime(a.atMs, prefs, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
