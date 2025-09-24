"use client";

import { useMemo } from "react";
import { seededRng } from "../seededRandom";

export default function TradingGoalsWidget({ instanceId }: { instanceId: string }) {
    const rng = useMemo(() => seededRng(`${instanceId}::goals`), [instanceId]);
    const goals = useMemo(() => seedGoals(rng), [rng]).slice(0, 3); // max 3 for kompakt h=4

    return (
        <div className="h-full flex flex-col min-h-0 overflow-hidden" id={`${instanceId}-goals`}>
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="font-medium">Trading mål</div>
            </div>

            {/* Kompakt liste — ingen scroll */}
            <div className="mt-3 space-y-2">
                {goals.map((g) => (
                    <GoalRow key={g.id} {...g} />
                ))}
            </div>

            {/* CTA i bunden */}
            <div className="mt-3 flex items-center justify-end gap-2 shrink-0">
                <button className="px-2.5 py-1.5 rounded-md text-xs border border-neutral-600 text-neutral-200 hover:bg-neutral-800">
                    Vis alle mål
                </button>
                <button className="px-2.5 py-1.5 rounded-md text-xs border border-emerald-600 text-emerald-200 hover:bg-emerald-900/30">
                    Opret mål
                </button>
            </div>
        </div>
    );
}

function GoalRow({
                     title, pct, tone = "warn", meta,
                 }: { title: string; pct: number; tone?: "neg" | "warn" | "ok"; meta?: string }) {
    const clampPct = Math.max(0, Math.min(100, Math.round(pct)));
    const bar = tone === "ok" ? "bg-emerald-500" : tone === "neg" ? "bg-red-500" : "bg-amber-500";
    return (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-2">
            <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-sm text-neutral-100 truncate">{title}</div>
                <div className="text-xs text-neutral-400">{clampPct}%</div>
            </div>
            {meta ? <div className="text-[11px] text-neutral-400 mt-0.5">{meta}</div> : null}
            <div className="mt-1.5 h-2 rounded bg-neutral-800 overflow-hidden">
                <div className={`h-2 ${bar}`} style={{ width: `${clampPct}%` }} />
            </div>
        </div>
    );
}

function seedGoals(rng: () => number) {
    return [
        { id: "g1", title: "Følg tradingplan i 14 dage", pct: 34, tone: "neg" as const,  meta: "Scope: Global • Deadline: 27.01" },
        { id: "g2", title: "Maks 1 tabt trade i træk",    pct: 67, tone: "warn" as const, meta: "Scope: Scalping • Deadline: 14.02" },
        { id: "g3", title: "Min. R/R ≥ 1.2 gennemsnit",   pct: 52, tone: "warn" as const, meta: "Scope: Swing • Deadline: 10.03" },
        { id: "g4", title: "Ingen trade uden journal-notat", pct: 80, tone: "ok"  as const, meta: "Scope: Global • Løbende" },
    ];
}
