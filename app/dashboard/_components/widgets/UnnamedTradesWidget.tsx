"use client";
import HelpTip from "../HelpTip";

type Item = { id: string; symbol: string; side: "LONG" | "SHORT"; note?: string };

export default function UnnamedTradesWidget({ instanceId }: { instanceId: string }) {
    const items: Item[] = [
        { id: "u1", symbol: "EURUSD", side: "LONG", note: "Mangler navn/setup" },
        { id: "u2", symbol: "XAUUSD", side: "SHORT", note: "Kun note udfyldt" },
        { id: "u3", symbol: "GBPUSD", side: "LONG", note: "Mangler alt" },
        { id: "u4", symbol: "US100", side: "SHORT", note: "Mangler navn" },
    ];

    return (
        <div className="h-full rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col">
            <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-300 flex items-center gap-2">
                    Unavngivne trades <HelpTip text="Hurtig genvej til at få navngivet og kategoriseret." />
                </div>
                <button className="text-xs px-2 py-1 rounded border border-neutral-700 hover:bg-neutral-800">Åbn journal</button>
            </div>

            <div className="mt-3 space-y-2 flex-1">
                {items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between rounded-md border border-neutral-800 p-2">
                        <div className="flex items-center gap-3">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${it.side==="LONG"?"bg-emerald-600/30 text-emerald-200":"bg-red-600/30 text-red-200"}`}>{it.side}</span>
                            <div className="text-sm">{it.symbol}</div>
                            <div className="text-xs text-neutral-400">{it.note}</div>
                        </div>
                        <button className="text-xs px-2 py-1 rounded border border-neutral-700 hover:bg-neutral-800">Navngiv</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
