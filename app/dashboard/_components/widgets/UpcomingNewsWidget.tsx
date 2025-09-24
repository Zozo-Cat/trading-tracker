"use client";
import { useMemo } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

type News = { id: string; time: string; country: string; event: string; impact: "High"|"Medium"|"Low" };

export default function UpcomingNewsWidget({ instanceId }: { instanceId: string }) {
    const rng = useMemo(() => seededRng(`${instanceId}-news`), [instanceId]);
    const items = useMemo<News[]>(() => seedNews(rng), [rng]);

    return (
        <div className="h-full rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col">
            <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-300 flex items-center gap-2">
                    High Volatility News <HelpTip text="De næste høj-impact nyheder (stub-data i demo)." />
                </div>
                <button className="text-xs px-2 py-1 rounded border border-neutral-700 hover:bg-neutral-800">Kalender</button>
            </div>

            {/* Ingen scroll – vi viser kun 5 og lader boksen fylde højde h=5 */}
            <div className="mt-3 flex-1 grid grid-rows-5 gap-2">
                {items.slice(0, 5).map((n) => (
                    <div key={n.id} className="rounded-md border border-neutral-800 p-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-neutral-400 w-[46px]">{n.time}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded border border-neutral-700">{n.country}</span>
                            <span className="text-sm">{n.event}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${n.impact==="High"?"bg-red-600/30 text-red-200":"bg-yellow-600/30 text-yellow-200"}`}>{n.impact}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function seedNews(rng: () => number): News[] {
    const pool: News[] = [
        { id: "n1", time: "08:30", country: "US", event: "CPI (YoY)", impact: "High" },
        { id: "n2", time: "10:00", country: "EU", event: "ECB Presser", impact: "High" },
        { id: "n3", time: "14:00", country: "US", event: "FOMC Statement", impact: "High" },
        { id: "n4", time: "07:45", country: "CH", event: "SNB Rate", impact: "High" },
        { id: "n5", time: "01:30", country: "JP", event: "BoJ Outlook", impact: "High" },
        { id: "n6", time: "09:00", country: "GB", event: "GDP (m/m)", impact: "Medium" },
    ];
    // Shuffle deterministisk
    const arr = [...pool];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
