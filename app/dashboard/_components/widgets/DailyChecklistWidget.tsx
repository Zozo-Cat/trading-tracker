"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

type Props = { instanceId: string };

type Item = { id: string; label: string; critical?: boolean };

const ALL_ITEMS: Item[] = [
    { id: "bias", label: "Bias/idé er klar", critical: true },
    { id: "levels", label: "Niveauer/zoner valideret", critical: true },
    { id: "news", label: "Nyheder tjekket" },
    { id: "risk", label: "Risiko ≤ 1–2% pr. trade", critical: true },
    { id: "rr", label: "Min. 1:2 R/R" },
    { id: "journal", label: "Plan noteret i journal" },
    { id: "screens", label: "Screenshot taget" },
    { id: "mindset", label: "Mindset/pauser på plads" },
];

/** Vælg op til 6 items deterministisk (hydration-safe) */
function pickDaily(instanceId: string): Item[] {
    const rng = seededRng(`${instanceId}::dailyChecklist`);
    const shuffled = [...ALL_ITEMS].sort(() => (rng() < 0.5 ? -1 : 1));
    return shuffled.slice(0, 6);
}

/** Start-tilstand for checkboxes deterministisk */
function initialChecks(instanceId: string, n: number): boolean[] {
    const rng = seededRng(`${instanceId}::dailyChecklist::state`);
    return Array.from({ length: n }, () => rng() > 0.5);
}

export default function DailyChecklistWidget({ instanceId }: Props) {
    const items = useMemo(() => pickDaily(instanceId), [instanceId]);
    const [checks, setChecks] = useState<boolean[]>(initialChecks(instanceId, items.length));

    const toggle = (i: number) =>
        setChecks((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

    const done = checks.filter(Boolean).length;
    const total = items.length;

    return (
        <div
            className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800"
            id={`${instanceId}-daily-checklist`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Checklist (daglig)</div>
                    <HelpTip text="Dine daglige punkter for fokus og disciplin. Redigér på 'Min side' — dashboard viser op til 6 punkter." />
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-xs text-neutral-400">{done}/{total} ✓</div>
                    <Link
                        href="/my/checklist" // TODO: opdatér rute når underside laves
                        className="text-xs px-2 py-1 rounded-md border border-neutral-600 text-neutral-200 hover:bg-neutral-800"
                        title="Tilpas checklist"
                    >
                        Tilpas
                    </Link>
                </div>
            </div>

            {/* Liste (max 6) */}
            {items.length === 0 ? (
                <div className="h-20 rounded-lg border border-dashed border-neutral-700 flex items-center justify-center text-neutral-400 text-sm">
                    Ingen punkter endnu.
                </div>
            ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {items.map((it, i) => (
                        <li key={it.id}>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={checks[i]}
                                    onChange={() => toggle(i)}
                                    className="h-4 w-4 rounded border-neutral-600 bg-neutral-900 text-neutral-100"
                                />
                                <span className="text-sm text-neutral-300">
                  {it.label} {it.critical && <CriticalBadge />}
                </span>
                            </label>
                        </li>
                    ))}
                </ul>
            )}

            {/* Skærmlæser-summary */}
            <p className="sr-only">Checklist status: {done} af {total} punkter ✓</p>
        </div>
    );
}

function CriticalBadge() {
    return (
        <span
            className="ml-1 text-[10px] px-1 py-0.5 rounded border border-amber-700 bg-amber-900/30 text-amber-300"
            title="Kritisk punkt"
        >
      kritisk
    </span>
    );
}
