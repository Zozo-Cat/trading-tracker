"use client";
import { useMemo, useState } from "react";
import DashboardCard from "../DashboardCard";

type Unnamed = {
    id: string;
    pair: string;
    account: string;
    r: number;
    entryAt: string;  // ISO
    exitAt: string;   // ISO
    name?: string;    // hvis udfyldt er den "færdig"
};

const SUGGESTED_LABELS = [
    "Breakout A",
    "Pullback B",
    "Range Fade",
    "News scalp",
    "Reversal C",
];

function fmt(t: string) {
    const d = new Date(t);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function UnnamedTradesWidget() {
    const initial = useMemo<Unnamed[]>(
        () => [
            { id: "u1", pair: "EURUSD", account: "Hovedkonto", r: +0.7, entryAt: iso(-95), exitAt: iso(-63) },
            { id: "u2", pair: "GBPUSD", account: "Swing",      r: -0.2, entryAt: iso(-80), exitAt: iso(-55) },
            { id: "u3", pair: "XAUUSD", account: "Hovedkonto", r: +1.3, entryAt: iso(-50), exitAt: iso(-32) },
            { id: "u4", pair: "USDJPY", account: "Hovedkonto", r: +0.4, entryAt: iso(-44), exitAt: iso(-18) },
            { id: "u5", pair: "NAS100", account: "Index",      r: -0.6, entryAt: iso(-30), exitAt: iso(-10) },
        ],
        []
    );

    const [items, setItems] = useState<Unnamed[]>(initial);

    const saveName = (id: string, value: string) => {
        if (!value.trim()) return;
        // I “rigtig” verden sendes til backend her.
        setItems((arr) => arr.filter((x) => x.id !== id));
    };

    return (
        <DashboardCard
            title="Unavngivne trades"
            subtitle={<span className="italic text-[11px] text-neutral-400">Navngiv dine handler for bedre statistik.</span>}
        >
            {items.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center py-4">
                    <div className="text-[12px] text-neutral-400">Alt godt! Der er ingen unavngivne trades.</div>
                </div>
            ) : (
                <>
                    {/* 2 kort pr. række */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {items.slice(0, 4).map((it) => (
                            <TradeCard key={it.id} item={it} onSave={saveName} />
                        ))}
                    </div>
                    {items.length > 4 && (
                        <div className="mt-2 text-right">
                            <a href="/trades/unnamed" className="text-[12px] text-neutral-300 hover:text-white underline">Vis alle ({items.length})</a>
                        </div>
                    )}
                </>
            )}
        </DashboardCard>
    );
}

function TradeCard({ item, onSave }: { item: Unnamed; onSave: (id: string, value: string) => void }) {
    const [text, setText] = useState("");
    const [drop, setDrop] = useState<string>("");

    const finalName = (drop || "").trim() || text.trim();

    return (
        <div className="rounded-lg bg-neutral-900/60 border border-neutral-800 p-2">
            {/* øverste række: pair + konto + P/L */}
            <div className="flex items-center justify-between">
                <div className="text-white text-sm font-medium">{item.pair}</div>
                <div className="text-[12px] text-neutral-300">{item.account}</div>
                <div className={`text-[12px] ${item.r >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {item.r >= 0 ? "+" : ""}{item.r}R
                </div>
            </div>

            {/* tider */}
            <div className="mt-1 text-[11px] text-neutral-400">
                {fmt(item.entryAt)} → {fmt(item.exitAt)}
            </div>

            {/* navn (dropdown + tekst) */}
            <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
                    <select
                        value={drop}
                        onChange={(e) => setDrop(e.target.value)}
                        className="px-2 py-1 rounded bg-neutral-950 border border-neutral-700 text-[12px] text-neutral-200"
                    >
                        <option value="">Vælg label…</option>
                        {SUGGESTED_LABELS.map((l) => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>

                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Eller skriv et navn…"
                        className="px-2 py-1 rounded bg-neutral-950 border border-neutral-700 text-[12px] text-neutral-200"
                    />
                </div>

                <button
                    title="Gem navn"
                    disabled={!finalName}
                    onClick={() => onSave(item.id, finalName)}
                    className={`px-3 py-1 rounded text-[12px] border ${finalName ? "border-green-500 text-green-300 hover:bg-green-500/10" : "border-neutral-700 text-neutral-500 cursor-not-allowed"}`}
                >
                    ✔︎ Gem
                </button>
            </div>
        </div>
    );
}

function iso(deltaMinutes: number) {
    const d = new Date();
    d.setMinutes(d.getMinutes() + deltaMinutes);
    return d.toISOString();
}
