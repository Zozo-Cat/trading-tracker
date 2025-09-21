// app/api/news/_core.ts
export type Impact = "high" | "medium" | "low";

export type NewsEvent = {
    id: string;
    title: string;
    source: "TradingEconomics";
    timeISO: string;
    impact: Impact;
    url?: string;
    country?: string;
    category?: string;
};

type TEItem = {
    CalendarId: string;
    Date: string;       // ISO
    Country: string;
    Category: string;
    Event: string;
    URL?: string;
    Importance?: number; // 1..3
};

const TE_BASE = "https://api.tradingeconomics.com/calendar";

function toInt(v: any, def: number) {
    const n = parseInt(String(v ?? ""), 10);
    return Number.isFinite(n) ? n : def;
}
function isoYMD(d: Date) {
    return d.toISOString().slice(0, 10);
}
function importanceToImpact(n: number): Impact {
    if (n >= 3) return "high";
    if (n === 2) return "medium";
    return "low";
}
function cleanTE(x: any): TEItem {
    return {
        CalendarId: String(x.CalendarId ?? ""),
        Date: String(x.Date ?? ""),
        Country: String(x.Country ?? ""),
        Category: String(x.Category ?? ""),
        Event: String(x.Event ?? ""),
        URL: x.URL ? String(x.URL) : "",
        Importance: toInt(x.Importance, 0),
    };
}

/** Henter kommende events (nu → nu+hoursAhead), filtreret på minImp og (valgfrit) countries.  */
export async function fetchUpcoming(opts: {
    hoursAhead?: number; // default 48
    minImp?: number;     // default 1
    countries?: string[];// default []
}): Promise<NewsEvent[]> {
    const { hoursAhead = 48, minImp = 1, countries = [] } = opts;
    const now = new Date();
    const end = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const TE_KEY = process.env.TRADING_ECONOMICS_API_KEY;

    // Dev-fallback (så widgets virker lokalt uden nøgle)
    if (!TE_KEY && process.env.NODE_ENV !== "production") {
        const mk = (i: number, hrs: number, imp: Impact): NewsEvent => ({
            id: `dev-${i}`,
            title: ["CPI YoY", "GDP QoQ", "Unemployment", "Rate Decision", "PMI"][i % 5],
            source: "TradingEconomics",
            timeISO: new Date(now.getTime() + hrs * 60 * 60 * 1000).toISOString(),
            impact: imp,
            country: ["United States", "Euro Area", "United Kingdom", "Germany", "Canada"][i % 5],
        });
        return [
            mk(0, 2, "high"),
            mk(1, 6, "medium"),
            mk(2, 9, "low"),
            mk(3, 20, "high"),
            mk(4, 30, "high"),
            mk(5, 35, "medium"),
            mk(6, 44, "high"),
        ]
            .filter(ev => ({ high: 3, medium: 2, low: 1 }[ev.impact] >= minImp))
            .sort((a, b) => +new Date(a.timeISO) - +new Date(b.timeISO));
    }

    if (!TE_KEY) {
        throw new Error("Missing TRADING_ECONOMICS_API_KEY");
    }

    const teUrl = new URL(TE_BASE);
    teUrl.searchParams.set("c", TE_KEY);
    teUrl.searchParams.set("from", isoYMD(now));
    teUrl.searchParams.set("to", isoYMD(end));
    if (countries.length > 0) {
        teUrl.searchParams.set("country", countries.join(","));
    }

    const res = await fetch(teUrl.toString(), { cache: "no-store" });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`TradingEconomics error ${res.status}: ${txt}`);
    }
    const raw = await res.json();
    const list = (Array.isArray(raw) ? raw : []) as any[];

    const nowMs = now.getTime();
    const endMs = end.getTime();
    const setCountries = new Set(countries.map(c => c.trim()).filter(Boolean));

    const events: NewsEvent[] = list
        .map(cleanTE)
        .filter(it => {
            const t = new Date(it.Date).getTime();
            const imp = toInt(it.Importance, 0);
            const inWindow = t >= nowMs && t <= endMs;
            const impOk = imp >= minImp;
            const countryOk = setCountries.size === 0 || setCountries.has(it.Country);
            return inWindow && impOk && countryOk;
        })
        .map(it => ({
            id: it.CalendarId || `${it.Country}-${it.Event}-${it.Date}`,
            title: it.Event || it.Category || "Event",
            source: "TradingEconomics" as const,
            timeISO: new Date(it.Date).toISOString(),
            impact: importanceToImpact(toInt(it.Importance, 0)),
            url: it.URL ? `https://tradingeconomics.com${it.URL}` : undefined,
            country: it.Country || undefined,
            category: it.Category || undefined,
        }))
        .sort((a, b) => +new Date(a.timeISO) - +new Date(b.timeISO));

    return events;
}
