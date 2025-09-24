"use client";
import HelpTip from "../HelpTip";

type Goal = { id: string; title: string; progress: number };

export default function TradingGoalsWidget({ instanceId }: { instanceId: string }) {
    const goals: Goal[] = [
        { id: "g1", title: "Følg plan 5/5 dage", progress: 0.6 },
        { id: "g2", title: "Max 1 tab/dag", progress: 0.4 },
        { id: "g3", title: "Ingen revenge-trades", progress: 0.8 },
    ];

    return (
        <div className="h-full rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col">
            <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-300 flex items-center gap-2">
                    Trading mål <HelpTip text="Dine vigtigste mål. Hold det simpelt." />
                </div>
                <div className="flex items-center gap-2">
                    <button className="text-xs px-2 py-1 rounded border border-neutral-700 hover:bg-neutral-800">Se alle mål</button>
                    <button className="text-xs px-2 py-1 rounded border border-neutral-700 hover:bg-neutral-800">Opret mål</button>
                </div>
            </div>

            <div className="mt-3 space-y-2 flex-1">
                {goals.map((g) => (
                    <div key={g.id} className="rounded-md border border-neutral-800 p-2">
                        <div className="text-sm">{g.title}</div>
                        <div className="mt-1 h-2 rounded bg-neutral-800 overflow-hidden">
                            <div className="h-2 bg-yellow-400" style={{ width: `${Math.round(g.progress * 100)}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
