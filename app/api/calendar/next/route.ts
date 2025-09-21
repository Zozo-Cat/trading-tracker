// app/api/calendar/next/route.ts
import { NextRequest, NextResponse } from "next/server";

type TEItem = {
    CalendarId: string;
    Date: string;        // ISO
    Country: string;
    Category: string;
    Event: string;
    Importance?: number; // 1..3
    URL?: string;
};

const TE_BASE = "https://api.tradingeconomics.com/calendar";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);

        // query params (with loose, guest-friendly defaults)
        const limit = clampInt(url.searchParams.get("limit"), 5, 1, 50);
        const hours = clampInt(url.searchParams.get("hours"), 168, 1, 24 * 14); // next 7 days
        const minImpact = clampInt(url.searchParams.get("minImpact"), 1, 1, 3);
        const tz = (url.searchParams.get("tz") || "UTC").trim();
        const countriesRaw = (url.searchParams.get("countries") || "").trim(); // optional

        const countries = splitCsv(countriesRaw); // if empty = all countries

        const key = process.env.TRADING_ECONOMICS_API_KEY;
        if (!key) {
            return NextResponse.json(
                { ok: false, error: "Missing TRADING_ECONOMICS_API_KEY" },
                { status: 500 }
            );
        }

        // build TE URL
        const now = new Date();
        const end = new Date(now.getTime() + hours * 60 * 60 * 1000);

        const teUrl = new URL(TE_BASE);
        teUrl.searchParams.set("c", key);
        teUrl.searchParams.set("from", isoYMD(now));
        teUrl.searchParams.set("to", isoYMD(end));

        // only add country filter if caller supplied one
        if (countries.length > 0) {
            teUrl.searchParams.set("country", countries.map(encodeURIComponent).join(","));
        }

        const teRes = await fetch(teUrl.toString(), { cache: "no-store" });
        if (!teRes.ok) {
            const t = await teRes.text();
            return NextResponse.json(
                { ok: false, error: `TradingEconomics error ${teRes.status}: ${t}` },
                { status: 502 }
            );
        }

        const raw = await teRes.json();
        const items = (Array.isArray(raw) ? raw : [])
            .map(cleanTE)
            // filter by min impact; if guest returns 0/undefined we treat it as 0
            .filter((it) => (Number.isFinite(it.importance) ? it.importance! : 0) >= minImpact)
            // sort ascending by date
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // DEV fallback for guest:guest (so widgets aren’t empty while developing)
        const usingGuest = (key || "").toLowerCase() === "guest:guest";
        let final = items.slice(0, limit);
        if (final.length === 0 && usingGuest) {
            final = makeDevFallback(now).slice(0, limit);
        }

        // project to lightweight shape, with localized time string too
        const out = final.map((it) => ({
            id: it.id,
            country: it.country,
            event: it.event || it.category || "Event",
            category: it.category || "",
            importance: it.importance ?? 0,
            date: it.date,
            // local presentation string for convenience (uses requested tz)
            when: fmtDateTime(new Date(it.date), tz),
            url: it.url ? `https://tradingeconomics.com${it.url}` : "",
        }));

        return NextResponse.json({ ok: true, items: out });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e?.message || "Unknown error" },
            { status: 500 }
        );
    }
}

/* helpers */

function cleanTE(x: any) {
    const importance = toInt(x.Importance, 0);
    return {
        id: String(x.CalendarId ?? ""),
        date: String(x.Date ?? ""),
        country: String(x.Country ?? ""),
        category: String(x.Category ?? ""),
        event: String(x.Event ?? ""),
        importance: Number.isFinite(importance) ? importance : 0,
        url: x.URL ? String(x.URL) : "",
    } as {
        id: string;
        date: string;
        country: string;
        category: string;
        event: string;
        importance?: number;
        url?: string;
    };
}

function clampInt(vRaw: string | null, def: number, min: number, max: number) {
    const v = parseInt(vRaw ?? "", 10);
    if (Number.isFinite(v)) return Math.max(min, Math.min(max, v));
    return def;
}
function toInt(v: any, def: number) {
    const n = parseInt(String(v ?? ""), 10);
    return Number.isFinite(n) ? n : def;
}
function splitCsv(s: string) {
    return s.split(",").map((x) => x.trim()).filter(Boolean);
}
function isoYMD(d: Date) {
    return d.toISOString().slice(0, 10);
}
function fmtDateTime(d: Date, tz: string) {
    try {
        return new Intl.DateTimeFormat("da-DK", {
            timeZone: tz,
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(d);
    } catch {
        return new Intl.DateTimeFormat("da-DK", {
            timeZone: "UTC",
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(d);
    }
}
function makeDevFallback(now = new Date()) {
    const mk = (mins: number, country: string, event: string, imp = 3) => ({
        id: `dev-${mins}`,
        date: new Date(now.getTime() + mins * 60_000).toISOString(),
        country,
        category: "Preview",
        event,
        importance: imp,
        url: "",
    });
    return [
        mk(60, "United States", "CPI YoY"),
        mk(120, "Euro Area", "ECB Press Conference"),
        mk(180, "United Kingdom", "GDP QoQ"),
        mk(240, "Canada", "Employment Change"),
        mk(480, "Germany", "Rate Decision"),
    ];
}
