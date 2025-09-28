"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrefs } from "@/lib/usePrefs";
import { formatDateTime } from "@/lib/format";
import { seededRng } from "../seededRandom";

type Level = "info" | "success" | "warning" | "danger";
type Kind = "news" | "trade" | "goal" | "system";

type Note = {
    id: string;
    kind: Kind;
    level: Level;
    title: string;
    detail?: string;
    iso: string;
    read?: boolean;
};

type Props = { instanceId: string };

function pickKind(rng: () => number): Kind {
    const v = rng();
    if (v < 0.25) return "news";
    if (v < 0.5) return "trade";
    if (v < 0.75) return "goal";
    return "system";
}
function pickLevel(rng: () => number): Level {
    const v = rng();
    if (v < 0.25) return "info";
    if (v < 0.5) return "success";
    if (v < 0.75) return "warning";
    return "danger";
}

export default function NotificationsCenterWidget({ instanceId }: Props) {
    const [notes, setNotes] = useState<Note[] | null>(null);

    useEffect(() => {
        const rng = seededRng("notes_" + instanceId);
        const now = Date.now();
        const items: Note[] = Array.from({ length: 6 }).map((_, i) => {
            const iso = new Date(now - (i * 90 + rng() * 60) * 60 * 1000).toISOString();
            return {
                id: `${i}`,
                kind: pickKind(rng),
                level: pickLevel(rng),
                title: i % 3 === 0 ? "System opdateret" : i % 3 === 1 ? "Trade lukket" : "Nyt mål nået",
                detail: i % 3 === 0 ? "Baggrundsjob færdig" : i % 3 === 1 ? "TP ramte 1.5R" : "Streak 5/5",
                iso,
                read: i > 1,
            };
        });
        setNotes(items);
    }, [instanceId]);

    if (!notes) return <Skeleton />;

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium">Beskeder</h3>
                </div>
            </div>

            <div className="space-y-2">
                {notes.map(n => (
                    <NoteRow key={n.id} note={n} onToggle={() => {
                        setNotes(arr => arr?.map(x => x.id === n.id ? { ...x, read: !x.read } : x) ?? arr);
                    }} />
                ))}
            </div>
        </div>
    );
}

function NoteRow({ note, onToggle }: { note: Note; onToggle: () => void }) {
    const { prefs } = usePrefs();
    const d = new Date(note.iso);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const when = formatDateTime(d, prefs, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

    const ring =
        note.level === "danger" ? "ring-rose-500/40"
            : note.level === "warning" ? "ring-amber-400/40"
                : note.level === "success" ? "ring-emerald-500/40"
                    : "ring-neutral-500/30";

    return (
        <div className={`rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2 ring-1 ${ring}`}>
            <div className="flex items-center justify-between">
                <div className="min-w-0">
                    <div className="text-sm text-neutral-100 truncate">{note.title}</div>
                    <div className="text-[11px] text-neutral-400">{when} · {note.detail}</div>
                </div>
                <button
                    onClick={onToggle}
                    className={`text-xs rounded-md border px-2 py-1 ${note.read ? "border-neutral-700 hover:bg-neutral-800" : "border-emerald-600 text-emerald-300 hover:bg-emerald-900/20"}`}
                >
                    {note.read ? "Marker ulæst" : "Marker læst"}
                </button>
            </div>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg border border-neutral-800 bg-neutral-900/40 animate-pulse" />
            ))}
        </div>
    );
}
