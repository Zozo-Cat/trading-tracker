"use client";

import { useEffect, useMemo, useState } from "react";
import { seededRng } from "../seededRandom";

type Feedback = {
    id: string;
    mentor: string;
    tag: "Psykologi" | "Setup" | "Risk" | "Journal";
    text: string;
    iso: string; // absolut tidspunkt
};

export default function MentorFeedbackWidget({ instanceId }: { instanceId: string }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const rng = useMemo(() => seededRng(`${instanceId}::mentor`), [instanceId]);

    const items = useMemo<Feedback[]>(() => {
        const BASE = Date.UTC(2024, 1, 1, 8, 0, 0);
        const pool: Array<Omit<Feedback, "id" | "iso">> = [
            { mentor: "Mikkel", tag: "Psykologi", text: "God ro — hold fast i plan før entry." },
            { mentor: "Sara",   tag: "Setup",     text: "Vent på luk over niveau, ikke bare wick." },
            { mentor: "Jonas",  tag: "Risk",      text: "Skalere ned til 0.5R i news-vindue." },
            { mentor: "Anna",   tag: "Journal",   text: "Skriv hvad der gik godt – ikke kun fejl." },
            { mentor: "Nikolaj",tag: "Setup",     text: "Trend-dage: undgå mean-reversion entries." },
        ];
        return Array.from({ length: 4 }).map((_, i) => {
            const p = pool[Math.floor(rng() * pool.length)];
            const offsetMin = 60 * (i + 1) * (1 + Math.floor(rng() * 3));
            const iso = new Date(BASE + offsetMin * 60 * 1000).toISOString();
            return { id: `fb${i}`, iso, ...p };
        });
    }, [rng]);

    if (!mounted) return <Skeleton />;

    return (
        <div className="space-y-3">
            {items.map((x) => (
                <FeedbackRow key={x.id} item={x} />
            ))}

            <div className="flex items-center gap-2 pt-1">
                <a
                    href="/mentor/feedback"
                    className="text-xs px-2 py-1 rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                >
                    Se al feedback
                </a>
            </div>
        </div>
    );
}

function FeedbackRow({ item }: { item: Feedback }) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const d = new Date(item.iso);
    const when = new Intl.DateTimeFormat("da-DK", {
        timeZone: tz,
        day: "2-digit", month: "2-digit",
        hour: "2-digit", minute: "2-digit",
    }).format(d);

    const tagColor =
        item.tag === "Psykologi" ? "bg-purple-500/20 text-purple-200"
            : item.tag === "Risk" ? "bg-rose-500/20 text-rose-200"
                : item.tag === "Journal" ? "bg-sky-500/20 text-sky-200"
                    : "bg-amber-500/20 text-amber-200";

    return (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={item.mentor} />
                    <div className="min-w-0">
                        <div className="font-medium truncate">{item.mentor}</div>
                        <div className="text-xs text-neutral-400">{when}</div>
                    </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-md ${tagColor}`}>{item.tag}</span>
            </div>
            <div className="text-sm mt-2 text-neutral-200">{item.text}</div>
        </div>
    );
}

function Avatar({ name }: { name: string }) {
    const initials = name
        .split(" ")
        .map((s) => s[0]?.toUpperCase())
        .slice(0, 2)
        .join("");
    return (
        <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-neutral-100">
            {initials || "M"}
        </div>
    );
}

function Skeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-lg border border-neutral-800 bg-neutral-900/40 animate-pulse" />
            ))}
        </div>
    );
}
