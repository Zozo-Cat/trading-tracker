"use client";

import { useMemo } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

type Props = { instanceId: string };

type Trade = {
    id: string;
    symbol: string;
    openedAt: number;   // ms UTC
    closedAt?: number;  // ms UTC (if closed)
    status: "OPEN" | "CLOSED";
    setup?: string | null;
    named?: boolean;
    pl: number;         // demo: account currency
    r?: number;         // demo: R-multiple
};

/* ========= Hydration-safe time base ========= */
const BASE_UTC = Date.UTC(2024, 0, 1, 0, 0, 0, 0);
const HOUR = 60 * 60 * 1000;
const DAY  = 24 * HOUR;

function sameUtcDate(a: number, b: number) {
    const A = new Date(a), B = new Date(b);
    return (
        A.getUTCFullYear() === B.getUTCFullYear() &&
        A.getUTCMonth() === B.getUTCMonth() &&
        A.getUTCDate() === B.getUTCDate()
    );
}
function endOfSeries(trades: Trade[]): number {
    let t = BASE_UTC;
    for (const tr of trades) t = Math.max(t, tr.closedAt ?? tr.openedAt);
    return t;
}
function hhmmUTC(ms: number) {
    const d = new Date(ms);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm}Z`;
}

export default function TodaysTradesWidget({ instanceId }: Props) {
    const rng = useMemo(() => seededRng(`${instanceId}::todaysTrades`), [instanceId]);
    const trades = useMemo(() => synthTrades(rng), [rng]);

    const endMs = useMemo(() => endOfSeries(trades), [trades]);

    const todays = useMemo(
        () =>
            trades.filter(
                (t) => sameUtcDate(t.openedAt, endMs) || (t.closedAt && sameUtcDate(t.closedAt, endMs))
            ),
        [trades, endMs]
    );

    const openToday = useMemo(() => todays.filter((t) => t.status === "OPEN"), [todays]);
    const closedToday = useMemo(
        () =>
            todays
                .filter((t) => t.status === "CLOSED")
                .sort((a, b) => (b.closedAt! - a.closedAt!))
                .slice(0, 5),
        [todays]
    );

    const hasAny = todays.length > 0;

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            {/* Own header (like test page) */}
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="font-medium">Dagens trades</h3>
                    <HelpTip text="Dagens åbne handler og senest lukkede. Demo-UTC-data (hydration-safe). Virkelige data kobles senere." />
                </div>

                <a
                    className="text-sm text-neutral-300 hover:text-white underline underline-offset-2"
                    href="/trades/tag"
                >
                    Navngiv/Tag trades
                </a>
            </div>

            {!hasAny ? (
                <div className="h-28 rounded-xl border border-dashed border-neutral-700 flex items-center justify-center text-neutral-400 text-sm">
                    Ingen handler i dag.
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Åbne handler */}
                        <section className="rounded-lg border border-neutral-800 p-3">
                            <h4 className="text-sm font-medium text-neutral-200 mb-2">Åbne</h4>
                            {openToday.length === 0 ? (
                                <div className="text-sm text-neutral-400">Ingen åbne handler i dag.</div>
                            ) : (
                                <ul className="space-y-2">
                                    {openToday.map((t) => (
                                        <li key={t.id} className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{t.symbol}</span>
                                                    <span className="text-xs text-neutral-400">{hhmmUTC(t.openedAt)}</span>
                                                </div>
                                                <div className="text-xs text-neutral-400 truncate">
                                                    {t.setup ? t.setup : <span className="text-amber-400">Unavngivet</span>}
                                                </div>
                                            </div>
                                            <div
                                                className={`text-sm font-semibold ${
                                                    t.pl >= 0 ? "text-emerald-400" : "text-red-400"
                                                }`}
                                            >
                                                {formatPL(t.pl)}
                                                {typeof t.r === "number" ? ` · ${formatR(t.r)}` : ""}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        {/* Senest lukkede (max 5) */}
                        <section className="rounded-lg border border-neutral-800 p-3">
                            <h4 className="text-sm font-medium text-neutral-200 mb-2">Senest lukkede</h4>
                            {closedToday.length === 0 ? (
                                <div className="text-sm text-neutral-400">Ingen lukkede handler i dag.</div>
                            ) : (
                                <ul className="space-y-2">
                                    {closedToday.map((t) => (
                                        <li key={t.id} className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{t.symbol}</span>
                                                    <span className="text-xs text-neutral-400">{hhmmUTC(t.closedAt!)}</span>
                                                </div>
                                                <div className="text-xs text-neutral-400 truncate">
                                                    {t.setup ? t.setup : <span className="text-amber-400">Unavngivet</span>}
                                                </div>
                                            </div>
                                            <div
                                                className={`text-sm font-semibold ${
                                                    t.pl >= 0 ? "text-emerald-400" : "text-red-400"
                                                }`}
                                            >
                                                {formatPL(t.pl)}
                                                {typeof t.r === "number" ? ` · ${formatR(t.r)}` : ""}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>

                    {/* Footer under body */}

                </>
            )}

            {/* A11y */}
            <p className="sr-only">
                Åbne handler og senest lukkede handler i dag, inkl. tidspunkter og P/L.
            </p>
        </div>
    );
}

/* =================== Deterministic demo data =================== */

function synthTrades(rng: () => number): Trade[] {
    const out: Trade[] = [];
    let id = 1;

    for (let d = 0; d < 3; d++) {
        const dayStart = BASE_UTC + d * DAY;
        for (let h = 9; h <= 20; h += 2 + (d % 2)) {
            const opened = dayStart + h * HOUR + Math.floor(rng() * 30) * 60 * 1000;
            const isClosed = rng() < 0.7 || d < 2;
            const sym = pick(["EURUSD", "GBPUSD", "XAUUSD", "US100", "SPX500"], rng);
            const named = rng() < 0.7;
            const setup = named ? pick(["Breakout", "Reversal", "Pullback", "Range Fade"], rng) : null;

            let closedAt: number | undefined;
            let pl = 0;
            let r: number | undefined;

            if (isClosed) {
                const holdH = 1 + Math.floor(rng() * 4);
                closedAt = opened + holdH * HOUR + Math.floor(rng() * 30) * 60 * 1000;
                const win = rng() < 0.55;
                const mag = 30 + rng() * 120;
                pl = (win ? 1 : -1) * Math.round(mag);
                r = (win ? 0.5 + rng() * 1.8 : -(0.4 + rng() * 0.8));
            } else {
                pl = Math.round((rng() - 0.5) * 40);
                r = undefined;
            }

            out.push({
                id: `T${id++}`,
                symbol: sym,
                openedAt: opened,
                closedAt,
                status: isClosed ? "CLOSED" : "OPEN",
                setup,
                named,
                pl,
                r,
            });
        }
    }
    out.sort((a, b) => a.openedAt - b.openedAt);
    return out;
}

function pick<T>(arr: T[], rng: () => number): T {
    return arr[Math.floor(rng() * arr.length)];
}
function formatPL(v: number) {
    const sign = v > 0 ? "+" : v < 0 ? "−" : "";
    const abs = Math.abs(v);
    return `${sign}${abs}`;
}
function formatR(v: number) {
    const sign = v < 0 ? "-" : "";
    const abs = Math.abs(v).toFixed(2).replace(".", ",");
    return `${sign}${abs}R`;
}
