"use client";

import Link from "next/link";
import { useMemo } from "react";
import { seededRng } from "../seededRandom";

type Props = { instanceId: string };

type Trade = {
    id: string;
    symbol: string;
    side: "Long" | "Short";
    openedAtZ: string; // HH:MMZ (UTC-visning)
    reason?: string;   // “unavngivet/utagget” → tom
    pnlR?: number;     // ikke i brug her, men lader typen stå til senere
};

const SYMBOLS = [
    "SPX500",
    "US100",
    "XAUUSD",
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "GER40",
    "US30",
];

/** Hjælper: lav en deterministisk HH:MMZ på basis af et heltal-minut offset */
function hhmmZFromBaseOffset(minutesOffset: number): string {
    // Fast UTC-anker: 2024-01-01T00:00:00Z, og så plus et offset i minutter.
    const base = Date.UTC(2024, 0, 1, 0, 0, 0, 0);
    const d = new Date(base + minutesOffset * 60 * 1000);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm}Z`;
}

/** Generér deterministiske “unavngivne/utaggede” trades */
function synthUnnamedTrades(instanceId: string): Trade[] {
    const rng = seededRng(`${instanceId}::unnamed_trades`);
    const n = 4 + Math.floor(rng() * 3); // 4..6 rækker
    const items: Trade[] = [];

    let minuteCursor = 8 * 60; // start 08:00Z
    for (let i = 0; i < n; i++) {
        const sym = SYMBOLS[Math.floor(rng() * SYMBOLS.length)];
        const side: Trade["side"] = rng() > 0.5 ? "Long" : "Short";
        const step = 30 + Math.floor(rng() * 90); // 30..120 minutter
        minuteCursor += step;

        items.push({
            id: `${sym}-${i}`,
            symbol: sym,
            side,
            openedAtZ: hhmmZFromBaseOffset(minuteCursor),
            reason: undefined,
            pnlR: undefined,
        });
    }
    return items;
}

export default function UnnamedTradesWidget({ instanceId }: Props) {
    const trades = useMemo(() => synthUnnamedTrades(instanceId), [instanceId]);

    // Max 3 rækker à 2 = 6 stk.
    const toShow = trades.slice(0, 6);
    const empty = toShow.length === 0;

    return (
        <div
            className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800"
            id={`${instanceId}-unnamed`}
        >
            {/* Øverste boks/linje */}
            <div className="mb-4 text-sm text-neutral-300">
                Du har{" "}
                <span className="font-semibold text-neutral-100">{trades.length}</span>{" "}
                unavngivne/utaggede trades.{" "}
                <Link
                    href="/trades/tag"
                    className="underline underline-offset-2 hover:text-white"
                >
                    Se alle her
                </Link>
                .
            </div>

            {/* Liste */}
            {empty ? (
                <div className="h-24 rounded-lg border border-dashed border-neutral-700 flex items-center justify-center text-neutral-400 text-sm">
                    Ingen unavngivne/utaggede trades 🎉
                </div>
            ) : (
                <ul className="grid grid-cols-2 gap-3">
                    {toShow.map((t) => (
                        <li
                            key={t.id}
                            className="rounded-lg border border-neutral-800 p-3 flex items-start justify-between gap-3"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{t.symbol}</span>
                                    <SideBadge side={t.side} />
                                    <span className="text-xs text-neutral-400">{t.openedAtZ}</span>
                                </div>

                                <div className="mt-1 text-xs text-neutral-400">
                                    <span className="italic">Mangler navn/setup</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    className="px-2 py-1 text-xs rounded-md border border-neutral-600 text-neutral-200 hover:bg-neutral-800"
                                    title="Navngiv eller tilføj tags"
                                >
                                    Navngiv/Tag
                                </button>
                                <button
                                    type="button"
                                    className="px-2 py-1 text-xs rounded-md border border-neutral-600 text-neutral-200 hover:bg-neutral-800"
                                    title="Tilføj note"
                                >
                                    Tilføj note
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Footer fjernet efter ønske */}
        </div>
    );
}

/* ---------- UI helpers ---------- */

function SideBadge({ side }: { side: Trade["side"] }) {
    const isLong = side === "Long";
    const bg =
        isLong
            ? "bg-emerald-900/40 border-emerald-700 text-emerald-300"
            : "bg-red-900/40 border-red-700 text-red-300";
    return (
        <span
            className={`text-[10px] px-1.5 py-0.5 rounded border ${bg}`}
            title={side}
        >
      {side}
    </span>
    );
}
