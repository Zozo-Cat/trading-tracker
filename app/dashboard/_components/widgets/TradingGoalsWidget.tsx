"use client";

import { useEffect, useMemo, useState } from "react";
import { seededRng } from "../seededRandom";

type Goal = {
    id: string;
    title: string;
    progress: number; // 0..1
    dueISO: string;   // absolut dato, vises i lokal TZ
    scope: "Global" | "Scalping" | "Swing";
};

export default function TradingGoalsWidget({ instanceId }: { instanceId: string }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const rng = useMemo(() => seededRng(`${instanceId}::goals`), [instanceId]);

    const goals = useMemo<Goal[]>(() => {
        // Fast UTC-anker så data er deterministiske
        const BASE = Date.UTC(2024, 0, 1, 0, 0, 0);
        // lav 3 mål
        const mk = (i: number, title: string, scope: Goal["scope"]) => {
            const pct = Math.min(1, Math.max(0, (rng() * 0.6) + 0.2)); // 20–80%
            const days = 7 + Math.floor(rng() * 21); // 1–4 uger
            const due = new Date(BASE + (i + 1) * days * 24 * 60 * 60 * 1000).toISOString();
            return { id: `g${i}`, title, progress: pct, dueISO: due, scope } as Goal;
        };
        return [
            mk(0, "Følg tradingplan i 14 dage", "Global"),
            mk(1, "Maks 1 tabt trade i træk", "Scalping"),
            mk(2, "Min. R/R ≥ 1:2 gennemsnit", "Swing"),
        ];
    }, [rng]);

    if (!mounted) return <Skeleton />;

    return (
        <div className="space-y-3">
            {goals.map((g) => (
                <GoalRow key={g.id} goal={g} />
            ))}

            <div className="flex items-center gap-2 pt-1">
                <a
                    href="/maal"
                    className="text-xs px-2 py-1 rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                >
                    Vis alle mål
                </a>
                <a
                    href="/maal/ny"
                    className="text-xs px-2 py-1 rounded-md border border-emerald-600 text-emerald-200 hover:bg-emerald-900/30"
                >
                    Opret mål
                </a>
            </div>
        </div>
    );
}

function GoalRow({ goal }: { goal: Goal }) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const due = new Date(goal.dueISO);
    const dateStr = new Intl.DateTimeFormat("da-DK", {
        timeZone: tz,
        day: "2-digit",
        month: "2-digit",
    }).format(due);

    const pct = Math.round(goal.progress * 100);
    const bar = Math.max(4, Math.min(100, pct));

    const color =
        pct >= 80 ? "bg-emerald-500"
            : pct >= 50 ? "bg-amber-400"
                : "bg-red-500";

    return (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
            <div className="flex items-center justify-between gap-2">
                <div className="truncate">
                    <div className="font-medium truncate">{goal.title}</div>
                    <div className="text-xs text-neutral-400">Scope: {goal.scope} • Deadline: {dateStr}</div>
                </div>
                <div className="text-sm tabular-nums text-neutral-200">{pct}%</div>
            </div>
            <div className="h-2 mt-2 rounded bg-neutral-800/70 overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${bar}%` }} />
            </div>
        </div>
    );
}

function Skeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg border border-neutral-800 bg-neutral-900/40 animate-pulse" />
            ))}
        </div>
    );
}
