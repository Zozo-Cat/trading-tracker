"use client";

import { useEffect, useMemo, useState } from "react";
import { seededRng } from "../seededRandom";
import { usePrefs } from "@/lib/usePrefs";
import { formatDateTime } from "@/lib/format";

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
            { mentor: "Sara", tag: "Setup", text: "Vent på luk over niveau, ikke bare wick." },
            { mentor: "Jonas", tag: "Risk", text: "Skalere ned til 0.5R i news-vindue." },
            { mentor: "Anna", tag: "Journal", text: "Skriv hvad der gik godt – ikke kun fejl." },
            { mentor: "Nikolaj", tag: "Setup", text: "Trend-dage: undgå mean-reversion entries." },
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
                <a href="/mentor/feedback" className="text-xs px-2 py-1 rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800">
                    Se al feedback
                </a>
            </div>
        </div>
    );
}

function FeedbackRow({ item }: { item: Feedback }) {
    const { prefs } = usePrefs();
    const when = formatDateTime(item.iso, prefs, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

    const tagColor =
        item.tag === "Psykologi"
            ? "bg-purple-500/20 text-purple-200"
            : item.tag === "Risk"
                ? "bg-rose-500/20 text-rose-200"
                : item.tag === "Journal"
                    ? "bg-sky-500/20 text-sky-200"
                    : "bg-amber-500/20 text-amber-200";

    return (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded ${tagColor}`}>{item.tag}</span>
                        <span className="text-xs text-neutral-400">{when}</span>
                    </div>
                    <div className="font-medium mt-1">{item.text}</div>
                    <div className="text-xs text-neutral-400">— {item.mentor}</div>
                </div>
                <button className="text-xs px-2 py-1 rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800 shrink-0">Markér som læst</button>
            </div>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg border border-neutral-800 bg-neutral-900/40 animate-pulse" />
            ))}
        </div>
    );
}
