// app/dashboard/_components/widgets/DailyFocusWidget.tsx
"use client";

import { useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

type Props = { instanceId: string };

export default function DailyFocusWidget({ instanceId }: Props) {
    const today = new Date().toISOString().slice(0, 10);

    const focus = useMemo(() => {
        const items = [
            "Kun A-setups (min. R/R ≥ 1:2).",
            "Journal-notat inden entry.",
            "Stop med at følge pris efter entry.",
            "Vent på retest før entry.",
            "Hold dig fra markedsåbning de første 5 min.",
            "Tag 3 bevidste pauser á 3 min i dag.",
        ];
        const rng = seededRng(`${instanceId}::focus::${today}`);
        return items[Math.floor(rng() * items.length)];
    }, [instanceId, today]);

    const [done, setDone] = useState<boolean>(() => {
        try {
            return localStorage.getItem(`${instanceId}::focus::done::${today}`) === "1";
        } catch { return false; }
    });

    const toggle = () => {
        const next = !done;
        setDone(next);
        try {
            localStorage.setItem(`${instanceId}::focus::done::${today}`, next ? "1" : "0");
        } catch {}
    };

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Daily Focus</div>
                    <HelpTip text="Én fokushandling for dagen—stabil pr. dato, kan markeres som fuldført." />
                </div>
                <button
                    onClick={toggle}
                    className={`text-xs px-2 py-1 rounded-md border ${
                        done ? "border-emerald-700 text-emerald-200 hover:bg-emerald-900/30"
                            : "border-neutral-600 text-neutral-200 hover:bg-neutral-800/40"
                    }`}
                >
                    {done ? "Fuldført ✓" : "Markér fuldført"}
                </button>
            </div>

            <div className={`text-neutral-100 ${done ? "line-through opacity-70" : ""}`}>
                {focus}
            </div>
        </div>
    );
}
