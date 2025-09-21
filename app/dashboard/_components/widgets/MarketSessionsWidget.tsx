"use client";

import { useEffect, useMemo, useState } from "react";
import HelpTip from "../HelpTip";

/**
 * MarketSessionsWidget
 * - Viser 24h timeline i brugerens locale (lokal tz)
 * - Rækker: Sydney, Tokyo, London, New York
 * - Hver session er 08:00–17:00 i byens egen tz (med DST)
 * - Konverteres præcist til brugerens tz ved hjælp af Intl API
 * - Markerer "nu" og opdaterer hvert minut
 *
 * Ingen <title>-tags i SVG/DOM => hydration-safe.
 */

type Session = {
    key: "sydney" | "tokyo" | "london" | "newyork";
    name: string;
    tz: string;
    color: string; // base / active highlight
};

const SESSIONS: Session[] = [
    { key: "sydney",  name: "Sydney",  tz: "Australia/Sydney",  color: "#7aa7ff" },
    { key: "tokyo",   name: "Tokyo",   tz: "Asia/Tokyo",        color: "#b9c1ff" },
    { key: "london",  name: "London",  tz: "Europe/London",     color: "#8be28b" },
    { key: "newyork", name: "New York",tz: "America/New_York",  color: "#9fffa9" },
];

// ---------- Intl helpers (tz-safe uden libs) ----------

// tz offset for a given actual instant
function tzOffsetMsFor(date: Date, timeZone: string): number {
    const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    const parts = dtf.formatToParts(date);
    const filled: any = {};
    for (const p of parts) if (p.type !== "literal") filled[p.type] = p.value;
    const asUTC = Date.UTC(
        Number(filled.year),
        Number(filled.month) - 1,
        Number(filled.day),
        Number(filled.hour),
        Number(filled.minute),
        Number(filled.second)
    );
    // If the formatted-as-tz moment equals `asUTC` in UTC, the offset is:
    return asUTC - date.getTime();
}

// convert a local time in a tz to the true UTC instant
function zonedTimeToUtc(
    y: number, m: number, d: number, hh: number, mm: number,
    timeZone: string
): Date {
    // start with the naive UTC “same wall time”
    let guess = Date.UTC(y, m - 1, d, hh, mm, 0);
    // find tz offset *at that instant in that zone*
    const offset = tzOffsetMsFor(new Date(guess), timeZone);
    return new Date(guess - offset);
}

// return Y/M/D of `date` *in a zone*
function getYMDInZone(date: Date, timeZone: string) {
    const dtf = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    const [y, m, d] = dtf.format(date).split("-").map(Number);
    return { y, m, d };
}

function fmtTimeLocal(date: Date, timeZone?: string) {
    return new Intl.DateTimeFormat("da-DK", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}
function fmtHM(ms: number) {
    const d = new Date(ms);
    return fmtTimeLocal(d);
}

// compute one-day window in user's local tz
function localDayWindow(now: Date) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
}

type Interval = { start: number; end: number };

function intersect(a: Interval, b: Interval): Interval | null {
    const s = Math.max(a.start, b.start);
    const e = Math.min(a.end, b.end);
    return e > s ? { start: s, end: e } : null;
}

/**
 * Lav (op til) 3 mulige dags-intervaler i bruger-tz for en by-session:
 * - dagen i by-tz i går, i dag, i morgen (for at fange overlap ind i vores lokale døgn)
 */
function sessionIntervalsForLocalDay(
    now: Date,
    sessionTz: string,
    sessionStartHH = 8,
    sessionEndHH = 17
): Interval[] {
    const { start: dayStart, end: dayEnd } = localDayWindow(now);
    const win = { start: dayStart.getTime(), end: dayEnd.getTime() };

    const zToday = getYMDInZone(now, sessionTz);
    const baseUTC = zonedTimeToUtc(zToday.y, zToday.m, zToday.d, 12, 0, sessionTz); // midday = stable date anchor

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const anchors = [
        new Date(baseUTC.getTime() - ONE_DAY), // yesterday in zone
        baseUTC,                               // today in zone
        new Date(baseUTC.getTime() + ONE_DAY), // tomorrow in zone
    ];

    const out: Interval[] = [];
    for (const anchor of anchors) {
        const z = getYMDInZone(anchor, sessionTz);
        const sUTC = zonedTimeToUtc(z.y, z.m, z.d, sessionStartHH, 0, sessionTz).getTime();
        const eUTC = zonedTimeToUtc(z.y, z.m, z.d, sessionEndHH, 0, sessionTz).getTime();
        const iv = intersect({ start: sUTC, end: eUTC }, win);
        if (iv) out.push(iv);
    }
    // dedup / merge if needed
    out.sort((a, b) => a.start - b.start);
    const merged: Interval[] = [];
    for (const iv of out) {
        const last = merged[merged.length - 1];
        if (last && iv.start <= last.end) last.end = Math.max(last.end, iv.end);
        else merged.push({ ...iv });
    }
    return merged;
}

export default function MarketSessionsWidget({ instanceId }: { instanceId: string }) {
    const [nowMs, setNowMs] = useState<number>(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNowMs(Date.now()), 60 * 1000); // 1 min
        return () => clearInterval(id);
    }, []);

    const now = new Date(nowMs);
    const { start: dayStart, end: dayEnd } = localDayWindow(now);
    const daySpan = dayEnd.getTime() - dayStart.getTime();

    // scale helpers
    const pctX = (t: number) => `${((t - dayStart.getTime()) / daySpan) * 100}%`;
    const nowPct = pctX(nowMs);

    const rows = useMemo(() => {
        return SESSIONS.map((s) => {
            const intervals = sessionIntervalsForLocalDay(now, s.tz);
            const active = intervals.some((iv) => nowMs >= iv.start && nowMs <= iv.end);
            const cityNow = fmtTimeLocal(now, s.tz);
            return { ...s, intervals, active, cityNow };
        });
    }, [nowMs]);

    // top scale ticks (hver 2. time)
    const ticks = Array.from({ length: 13 }).map((_, i) => i * 2);

    return (
        <div
            className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800"
            id={`${instanceId}-market-sessions`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium text-yellow-300">Sessions</div>
                    <HelpTip text="Viser de fire hoved-sessioner (08–17 lokal tid i byens tidszone) mappet til din lokale tidszone. Justerer automatisk for sommertid." />
                </div>
                <div className="text-xs text-neutral-400">Lokal tid: {fmtTimeLocal(now)}</div>
            </div>

            {/* Top scale */}
            <div className="relative mb-3">
                <div className="h-6 w-full border border-neutral-700 rounded-md overflow-hidden">
                    <div className="relative h-full">
                        {ticks.map((h) => (
                            <div
                                key={h}
                                className="absolute top-0 bottom-0 border-l border-neutral-700 text-[10px] text-neutral-400"
                                style={{ left: `${(h / 24) * 100}%` }}
                            >
                                <div className="absolute -top-4 -translate-x-1/2 select-none">
                                    {h.toString().padStart(2, "0")}
                                </div>
                            </div>
                        ))}
                        {/* now line */}
                        <div
                            className="absolute top-0 bottom-0 w-[2px] bg-emerald-400"
                            style={{ left: nowPct }}
                            aria-label="nu"
                        />
                    </div>
                </div>
            </div>

            {/* Rows */}
            <div className="space-y-3">
                {rows.map((r) => (
                    <div key={r.key} className="relative">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="text-sm font-medium w-24">
                                {r.name}
                            </div>
                            <div className="text-xs text-neutral-400">lokal: {r.cityNow}</div>
                        </div>

                        <div className="relative h-6 w-full border border-neutral-700 rounded-md bg-neutral-900">
                            {/* now line (faded) */}
                            <div
                                className="absolute top-0 bottom-0 w-px bg-emerald-500/50"
                                style={{ left: nowPct }}
                            />
                            {/* session blocks (kan være 1–2 pr række) */}
                            {r.intervals.map((iv, i) => {
                                const left = pctX(iv.start);
                                const width = `${((iv.end - iv.start) / daySpan) * 100}%`;
                                const active = nowMs >= iv.start && nowMs <= iv.end;
                                return (
                                    <div
                                        key={i}
                                        className="absolute top-1 bottom-1 rounded-md shadow"
                                        style={{
                                            left,
                                            width,
                                            background: active ? r.color : `${r.color}40`, // 40 = ~25% alpha
                                            border: `1px solid ${active ? "#10b981" : "#3b3b3b"}`,
                                        }}
                                        title={`${r.name}: ${fmtHM(iv.start)} – ${fmtHM(iv.end)} (din tid)`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* A11y */}
            <p className="sr-only">
                Aktuel tid {fmtTimeLocal(now)}. Sessioner vises på en 24-timers akse i din lokale tidszone.
            </p>
        </div>
    );
}
