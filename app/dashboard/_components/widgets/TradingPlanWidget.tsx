"use client";

import { useMemo, useState } from "react";

type Rule = { id: string; text: string };
type Props = { instanceId: string };

export default function TradingPlanWidget({ instanceId }: Props) {
    const [plan, setPlan] = useState<"Global" | "Scalping" | "Swing">("Global");

    const rules = useMemo<Rule[]>(
        () => [
            { id: "r1", text: "Max 3 trades pr. dag" },
            { id: "r2", text: "Journal-notat inden entry" },
            { id: "r3", text: "Flyt SL til BE først efter 1R" },
            { id: "r4", text: "Ingen trades ±30 min før røde nyheder" },
            { id: "r5", text: "Screenshot før entry" },
            { id: "r6", text: "Risiko ≤ 1–2% pr. trade" },
            { id: "r7", text: "Kun handle whitelisted instrumenter" },
            { id: "r8", text: "Min. R/R ≥ 1:2 ved entry" },
            { id: "r9", text: "Ingen revenge-trades" },
            { id: "r10", text: "Følg tidsvinduer (fx 08–11, 14–16)" },
        ],
        []
    );

    return (
        <div className="h-full flex flex-col gap-3">
            {/* Kun actions – titel kommer fra WidgetChrome */}
            <div className="flex items-center justify-end gap-2">
                <select
                    className="bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1 text-xs"
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as any)}
                >
                    <option>Global</option>
                    <option>Scalping</option>
                    <option>Swing</option>
                </select>

                <button className="text-xs border border-neutral-700 rounded-md px-2 py-1 hover:bg-neutral-800">
                    Åbn fuld plan
                </button>
                <button className="text-xs border border-neutral-700 rounded-md px-2 py-1 hover:bg-neutral-800">
                    Redigér
                </button>
            </div>

            <div className="space-y-2 overflow-auto">
                {rules.slice(0, 10).map((r, i) => (
                    <div key={r.id} className="flex items-center gap-3 rounded-md border border-neutral-800 px-3 py-2">
                        <div className="w-6 h-6 shrink-0 rounded-full bg-neutral-800 text-neutral-200 text-xs flex items-center justify-center">
                            {i + 1}
                        </div>
                        <div className="text-sm">{r.text}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
