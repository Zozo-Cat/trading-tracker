"use client";

import { useEffect, useMemo, useState } from "react";
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
    href?: string;
};

export default function NotificationsCenterWidget({ instanceId }: { instanceId: string }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const rng = useMemo(() => seededRng(`${instanceId}::notifs`), [instanceId]);

    const [notes, setNotes] = useState<Note[]>(() => {
        // deterministisk seedet
        const BASE = Date.UTC(2024, 2, 3, 9, 0, 0);
        const mk = (i: number, n: Partial<Note>): Note => ({
            id: `n${i}`,
            kind: "system",
            level: "info",
            title: "Notifikation",
            iso: new Date(BASE + (i + 1) * 42 * 60 * 1000).toISOString(),
            read: false,
            ...n,
        });

        const arr: Note[] = [
            mk(0, {
                kind: "news",
                level: "warning",
                title: "Høj-impact nyhed om 15 min",
                detail: "USD CPI",
                href: "/dashboard?w=upcomingNews",
            }),
            mk(1, {
                kind: "trade",
                level: "info",
                title: "Trade uden note",
                detail: "Husk at tilføje note til seneste trade.",
                href: "/journal",
            }),
            mk(2, {
                kind: "goal",
                level: "success",
                title: "Mål opnået: 7 dages plan-følge",
                href: "/maal",
            }),
            mk(3, {
                kind: "system",
                level: "info",
                title: "Dashboard layout gemt",
            }),
            mk(4, {
                kind: "trade",
                level: "danger",
                title: "Drawdown advarsel",
                detail: "Nærmer dig -8% max DD.",
                href: "/risk",
            }),
        ];

        // bland læst/ulæst deterministisk
        return arr.map((n) => ({ ...n, read: rng() > 0.5 ? true : false }));
    });

    const unread = notes.filter((n) => !n.read).length;

    const markAllRead = () =>
        setNotes((cur) => cur.map((n) => ({ ...n, read: true })));

    const toggleRead = (id: string) =>
        setNotes((cur) =>
            cur.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
        );

    if (!mounted) return <Skeleton />;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-300">
                    {unread ? `${unread} ulæste` : "Alt læst"}
                </div>
                <button
                    onClick={markAllRead}
                    className="text-xs px-2 py-1 rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                >
                    Markér alle som læst
                </button>
            </div>

            <ul className="space-y-2">
                {notes.map((n) => (
                    <li key={n.id}>
                        <NoteRow note={n} onToggle={() => toggleRead(n.id)} />
                    </li>
                ))}
            </ul>

            <div className="pt-1">
                <a
                    href="/notifikationer"
                    className="text-xs px-2 py-1 rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                >
                    Se alle notifikationer
                </a>
            </div>
        </div>
    );
}

/* -------------------- UI helpers -------------------- */

function NoteRow({ note, onToggle }: { note: Note; onToggle: () => void }) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const d = new Date(note.iso);
    const when = new Intl.DateTimeFormat("da-DK", {
        timeZone: tz,
        day: "2-digit", month: "2-digit",
        hour: "2-digit", minute: "2-digit",
    }).format(d);

    const ring =
        note.level === "danger" ? "ring-rose-500/40"
            : note.level === "warning" ? "ring-amber-400/40"
                : note.level === "success" ? "ring-emerald-500/40"
                    : "ring-neutral-700/40";

    const dot =
        note.level === "danger" ? "bg-rose-500"
            : note.level === "warning" ? "bg-amber-400"
                : note.level === "success" ? "bg-emerald-500"
                    : "bg-neutral-400";

    const icon = note.kind === "news" ? "📰" : note.kind === "trade" ? "📈" : note.kind === "goal" ? "🎯" : "⚙️";

    const content = (
        <div className={`rounded-lg border border-neutral-800 bg-neutral-900/40 p-3 ring-1 ${ring}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                    <span className="text-base leading-6">{icon}</span>
                    <div className="min-w-0">
                        <div className="font-medium truncate">
                            {!note.read && <span className={`inline-block w-2 h-2 rounded-full ${dot} mr-2 align-middle`} />}
                            {note.title}
                        </div>
                        {note.detail && (
                            <div className="text-sm text-neutral-300 truncate">{note.detail}</div>
                        )}
                        <div className="text-xs text-neutral-400 mt-0.5">{when}</div>
                    </div>
                </div>
                <button
                    onClick={onToggle}
                    className="text-xs px-2 py-1 rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800 shrink-0"
                    title={note.read ? "Markér som ulæst" : "Markér som læst"}
                >
                    {note.read ? "Ulæst" : "Læst"}
                </button>
            </div>
        </div>
    );

    if (note.href) {
        return (
            <a href={note.href} className="block focus:outline-none focus:ring-1 focus:ring-neutral-600 rounded-md">
                {content}
            </a>
        );
    }
    return content;
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
