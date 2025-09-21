"use client";

import { useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import TeamToggle from "../TeamToggle";
import { seededRng } from "../seededRandom";

type Props = { instanceId: string };

type Signal = {
    id: string;
    symbol: string;
    dir: "Long" | "Short";
    entry: number;
    sl: number;
    tp: number;
    atMs: number;
    status: "Aktiv" | "TP" | "SL";
};

const TZ = "Europe/Copenhagen";

function fmt(ms: number, tz = TZ) {
    return new Intl.DateTimeFormat("da-DK", {
        timeZone: tz,
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(ms));
}

const SYMBOLS = ["EURUSD","GBPUSD","XAUUSD","US30","NAS100","DAX40","BTCUSD","ETHUSD"];

export default function CommunitySignalsWidget({ instanceId }: Props) {
    const [team, setTeam] = useState<string>();
    const [mode, setMode] = useState<"recent" | "active">("recent"); // default: Seneste

    const rowsAll = useMemo<Signal[]>(() => {
        const base = Date.UTC(2024, 4, 1, 7, 0, 0);
        const rng = seededRng(`${instanceId}::signals::${team ?? "default"}`);

        return Array.from({ length: 12 }).map((_, i) => {
            const sym = SYMBOLS[Math.floor(rng() * SYMBOLS.length)];
            const dir = rng() < 0.5 ? "Long" : "Short";
            const p = 100 + rng() * 2000;
            const entry = round2(p);
            const sl = round2(dir === "Long" ? entry * (0.996 - rng() * 0.006) : entry * (1.004 + rng() * 0.006));
            const tp = round2(dir === "Long" ? entry * (1.004 + rng() * 0.01) : entry * (0.996 - rng() * 0.01));
            const atMs = base + Math.floor((i + 1) * 9 * 3600 * 1000 * (0.7 + rng() * 0.8));
            const r = rng();
            const status: Signal["status"] = r < 0.2 ? "SL" : r < 0.55 ? "TP" : "Aktiv";
            return { id: `${i}-${sym}`, symbol: sym, dir, entry, sl, tp, atMs, status };
        }).sort((a, b) => b.atMs - a.atMs);
    }, [instanceId, team]);

    const rows = useMemo(() => {
        const src = mode === "active" ? rowsAll.filter((r) => r.status === "Aktiv") : rowsAll;
        return src.slice(0, 6);
    }, [rowsAll, mode]);

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Community Signals</div>
                    <HelpTip text="Toggle for at se seneste eller kun aktive signaler. Demo-data pr. team." />
                </div>
                <div className="flex items-center gap-3">
                    {/* Mode toggle */}
                    <div className="rounded-md bg-neutral-800/70 p-0.5 border border-neutral-700">
                        <button
                            type="button"
                            onClick={() => setMode("recent")}
                            className={`px-2 py-1 text-xs rounded ${mode === "recent" ? "bg-neutral-700 text-neutral-100" : "text-neutral-300 hover:text-neutral-100"}`}
                            title="Seneste"
                        >
                            Seneste
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("active")}
                            className={`px-2 py-1 text-xs rounded ${mode === "active" ? "bg-neutral-700 text-neutral-100" : "text-neutral-300 hover:text-neutral-100"}`}
                            title="Aktive"
                        >
                            Aktive
                        </button>
                    </div>
                    <TeamToggle instanceId={`${instanceId}-cs`} onChange={setTeam} />
                </div>
            </div>

            <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-sm">
                    <thead className="text-xs text-neutral-400">
                    <tr className="text-left">
                        <th className="py-1 font-normal">Tid</th>
                        <th className="py-1 font-normal">Symbol</th>
                        <th className="py-1 font-normal">Retning</th>
                        <th className="py-1 font-normal">Entry</th>
                        <th className="py-1 font-normal">SL</th>
                        <th className="py-1 font-normal">TP</th>
                        <th className="py-1 font-normal text-right">Status</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                    {rows.map((s) => (
                        <tr key={s.id}>
                            <td className="py-2 text-neutral-400">{fmt(s.atMs)}</td>
                            <td className="py-2">{s.symbol}</td>
                            <td className="py-2">
                  <span className={`px-2 py-0.5 rounded-full border text-xs ${
                      s.dir === "Long"
                          ? "border-emerald-600/50 text-emerald-200 bg-emerald-600/20"
                          : "border-rose-600/50 text-rose-200 bg-rose-600/20"
                  }`}>
                    {s.dir}
                  </span>
                            </td>
                            <td className="py-2 tabular-nums">{s.entry}</td>
                            <td className="py-2 tabular-nums">{s.sl}</td>
                            <td className="py-2 tabular-nums">{s.tp}</td>
                            <td className="py-2 text-right">
                                <StatusPill status={s.status} />
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}

function StatusPill({ status }: { status: Signal["status"] }) {
    const meta =
        status === "TP"
            ? { cls: "border-emerald-600/50 text-emerald-200 bg-emerald-600/20", label: "TP hit" }
            : status === "SL"
                ? { cls: "border-rose-600/50 text-rose-200 bg-rose-600/20", label: "SL hit" }
                : { cls: "border-neutral-600/50 text-neutral-200 bg-neutral-700/20", label: "Aktiv" };

    return <span className={`px-2 py-0.5 rounded-full border text-xs ${meta.cls}`}>{meta.label}</span>;
}

function round2(n: number) {
    return Math.round(n * 100) / 100;
}
