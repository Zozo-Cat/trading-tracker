"use client";

import { useEffect, useMemo, useState } from "react";
import LocalTime from "../LocalTime";

type Session = { name: string; start: number; end: number; tz: string };

const CITY_TZ: Record<string, string> = {
    Sydney: "Australia/Sydney",
    Tokyo: "Asia/Tokyo",
    London: "Europe/London",
    "New York": "America/New_York",
};

function clamp01(x: number) {
    return Math.max(0, Math.min(1, x));
}

function fmtTimeIn(tz: string, d = new Date()) {
    try {
        return new Intl.DateTimeFormat("da-DK", {
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).format(d);
    } catch {
        return "";
    }
}

function hourInTz(d: Date, tz: string) {
    try {
        const parts = new Intl.DateTimeFormat("en-GB", {
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).formatToParts(d);
        const hh = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10) || 0;
        const mm = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10) || 0;
        return hh + mm / 60;
    } catch {
        return 0;
    }
}

export default function MarketSessionsWidget({ instanceId }: { instanceId: string }) {
    const [now, setNow] = useState<Date>(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60 * 1000);
        return () => clearInterval(t);
    }, []);

    const sessions: Session[] = useMemo(
        () => [
            { name: "Sydney", start: 8, end: 16, tz: CITY_TZ["Sydney"] },
            { name: "Tokyo", start: 9, end: 17, tz: CITY_TZ["Tokyo"] },
            { name: "London", start: 8, end: 16, tz: CITY_TZ["London"] },
            { name: "New York", start: 8, end: 17, tz: CITY_TZ["New York"] },
        ],
        []
    );

    return (
        <div className="h-full flex flex-col" id={`${instanceId}-sessions`}>
            {/* Header */}
            <div className="mb-2 flex items-start justify-between">
                <div>
                    <div className="text-sm font-semibold opacity-90">Handelssessioner (lokale tider)</div>
                </div>
                {/* Kun brugerens lokale tid + zone (ingen ekstra dato/tid-linje) */}
                <LocalTime showZoneLabel className="text-right text-xs text-yellow-200/80" />
            </div>

            <div className="flex-1 space-y-3">
                {sessions.map((s) => {
                    const cityHour = hourInTz(now, s.tz); // 0..24
                    const isWrapped = s.end < s.start; // går over midnat
                    const active = !isWrapped
                        ? cityHour >= s.start && cityHour <= s.end
                        : cityHour >= s.start || cityHour <= s.end;

                    const markerPct = clamp01(cityHour / 24) * 100;

                    // Segmenter (split over midnat hvis nødvendigt)
                    const segments: Array<{ leftPct: number; widthPct: number }> = [];
                    if (!isWrapped) {
                        const leftPct = (s.start / 24) * 100;
                        const widthPct = ((s.end - s.start) / 24) * 100;
                        segments.push({ leftPct, widthPct });
                    } else {
                        // [start -> 24] + [0 -> end]
                        segments.push({ leftPct: (s.start / 24) * 100, widthPct: ((24 - s.start) / 24) * 100 });
                        segments.push({ leftPct: 0, widthPct: (s.end / 24) * 100 });
                    }

                    return (
                        <div key={s.name}>
                            <div className="mb-1 flex items-center justify-between text-xs opacity-70">
                                <span>{s.name}</span>
                                <span>lokal: {fmtTimeIn(s.tz, now)}</span>
                            </div>

                            {/* BAR */}
                            <div className="relative h-6 w-full overflow-hidden rounded-md border border-neutral-800 bg-neutral-900/30">
                                {segments.map((seg, i) => (
                                    <div
                                        key={i}
                                        className={`absolute inset-y-0 rounded-md ${
                                            active ? "bg-emerald-600/60" : "bg-neutral-700/50"
                                        }`}
                                        style={{ left: `${seg.leftPct}%`, width: `${seg.widthPct}%` }}
                                    />
                                ))}

                                {/* Markør for nuværende time i byens tidszone */}
                                <div
                                    className="absolute inset-y-0 w-px bg-emerald-400/80"
                                    style={{ left: `${markerPct}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
