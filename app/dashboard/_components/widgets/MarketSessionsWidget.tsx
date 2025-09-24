"use client";
import { useEffect, useMemo, useState } from "react";

/** En session defineret i BYENS lokale timer (0..24) */
type Session = { name: string; start: number; end: number; tz: string };

function clamp01(x: number) {
    return Math.max(0, Math.min(1, x));
}

/* Tidszoner pr. by */
const CITY_TZ: Record<string, string> = {
    Sydney: "Australia/Sydney",
    Tokyo: "Asia/Tokyo",
    London: "Europe/London",
    "New York": "America/New_York",
};

/** HH:mm i given tidszone */
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

/** Decimal-timer (fx 20.75) i given tidszone */
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
        return d.getUTCHours() + d.getUTCMinutes() / 60; // fallback
    }
}

export default function MarketSessionsWidget({ instanceId }: { instanceId: string }) {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(t);
    }, []);

    // Sessions med faste lokale åbne-/lukketider i hver BYs egen TZ
    const sessions: Session[] = useMemo(
        () => [
            { name: "Sydney",   start: 8,  end: 16, tz: CITY_TZ["Sydney"] },
            { name: "Tokyo",    start: 9,  end: 17, tz: CITY_TZ["Tokyo"] },
            { name: "London",   start: 8,  end: 16, tz: CITY_TZ["London"] },
            { name: "New York", start: 8,  end: 17, tz: CITY_TZ["New York"] },
        ],
        []
    );


    return (
        <div className="h-full flex flex-col" id={`${instanceId}-sessions`}>
            <div className="mb-2 text-sm font-semibold opacity-90">Sessions</div>

            {/* Ingen intern scroll er nødvendig for 4 rækker */}
            <div className="flex-1 space-y-3">
                {sessions.map((s) => {
                    const cityHour = hourInTz(now, s.tz);
                    const active =
                        s.start <= s.end
                            ? cityHour >= s.start && cityHour <= s.end
                            : cityHour >= s.start || cityHour <= s.end; // tilfælde over midnat

                    const widthPct = ((s.end - s.start + (s.end < s.start ? 24 : 0)) / 24) * 100;
                    const leftPct = (s.start / 24) * 100;
                    const markerLeft = clamp01(cityHour / 24) * 100;

                    return (
                        <div key={s.name}>
                            <div className="mb-1 flex items-center justify-between text-xs opacity-70">
                                <span>{s.name}</span>
                                <span>lokal: {fmtTimeIn(s.tz, now)}</span>
                            </div>

                            <div className="relative h-6 w-full rounded-md border border-neutral-800 bg-neutral-900/30">
                                {/* Aktivt tidsvindue */}
                                <div
                                    className={`absolute inset-y-0 rounded-md ${
                                        active ? "bg-emerald-600/60" : "bg-neutral-700/50"
                                    }`}
                                    style={{
                                        left: `${leftPct}%`,
                                        width: `${widthPct}%`,
                                    }}
                                />

                                {/* Nuværende tid i BYENS TZ */}
                                <div
                                    className="absolute inset-y-0 w-px bg-emerald-400/80"
                                    style={{ left: `${markerLeft}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
