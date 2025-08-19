// app/api/news/dispatch/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Query params (alle er valgfrie – med fornuftige defaults):
 *
 * Required for Discord:
 * - channelId:   string (Discord channel snowflake)
 *
 * TradingEconomics:
 * - countries:   kommasepareret liste (fx "United States,Euro Area,New Zealand")
 * - hours:       antal timer frem (kun for mode=digest)  default: 8
 * - minImp:      minimum importance (1,2,3)             default: 2
 *
 * Modes:
 * - mode:        "digest" | "alerts"                    default: "digest"
 *
 * Alerts:
 * - lead:        minutter før event (fx 15)             default: 15
 * - warnWindow:  hvor langt frem at lede i min.         default: 90
 *
 * Tidszone og format:
 * - tz:          IANA timezone (fx "Europe/Copenhagen") default: "UTC"
 * - prefix:      tekst/emoji foran beskeder              default: ""
 * - mentionRole: "everyone" | "here" | <roleId>          default: ""
 * - alertText:   skabelon til alerts (brug {mins},{country},{event},{imp},{time},{category})
 *                default: "{mins} min: {country} • {imp}\n{event} — {time}\n{category}"
 * - title:       overskrift på digest                    default: "Økonomikalender"
 * - preview:     "true" => sender IKKE til Discord; returnerer kun tekster
 *
 * Eksempler:
 *  /api/news/dispatch?channelId=...&countries=United%20States,Euro%20Area&hours=8&minImp=2&mode=digest&tz=Europe/Copenhagen
 *  /api/news/dispatch?channelId=...&countries=United%20States&mode=alerts&lead=15&warnWindow=90&minImp=2&mentionRole=everyone&prefix=%F0%9F%9A%A8&tz=Europe/Copenhagen
 */

type TEItem = {
    CalendarId: string;
    Date: string; // ISO
    Country: string;
    Category: string;
    Event: string;
    Reference?: string;
    ReferenceDate?: string;
    Source?: string;
    SourceURL?: string;
    Actual?: string;
    Previous?: string;
    Forecast?: string;
    TEForecast?: string;
    URL?: string;
    Importance?: number; // 1..3
    LastUpdate?: string;
    Currency?: string;
    Unit?: string;
};

const TE_BASE = "https://api.tradingeconomics.com/calendar";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);

        // ---- Parse params
        const channelId = (url.searchParams.get("channelId") || "").trim();
        const countriesRaw = (url.searchParams.get("countries") || "").trim();
        const mode = (url.searchParams.get("mode") || "digest").toLowerCase() as
            | "digest"
            | "alerts";

        // trading window / filter
        const hours = clampInt(url.searchParams.get("hours"), 8, 1, 72);
        const minImp = clampInt(url.searchParams.get("minImp"), 2, 1, 3);

        // alerts window
        const lead = clampInt(url.searchParams.get("lead"), 15, 0, 180);
        const warnWindow = clampInt(url.searchParams.get("warnWindow"), 90, 5, 480);

        // formatting
        const tz = (url.searchParams.get("tz") || "UTC").trim();
        const prefix = decodePlus(url.searchParams.get("prefix") || "").trim(); // fx 🚨
        const mentionRole = (url.searchParams.get("mentionRole") || "").trim();
        const title = decodePlus(url.searchParams.get("title") || "Økonomikalender").trim();

        const preview = (url.searchParams.get("preview") || "false").toLowerCase() === "true";

        const alertTextTpl = decodePlus(
            url.searchParams.get("alertText") ||
            "{mins} min: {country} • {imp}\n{event} — {time}\n{category}"
        );

        if (!channelId && !preview) {
            return NextResponse.json(
                { ok: false, error: "channelId er påkrævet (eller brug preview=true for kun at se tekst)" },
                { status: 400 }
            );
        }

        // ---- TradingEconomics fetch
        const TE_KEY = process.env.TRADING_ECONOMICS_API_KEY;
        if (!TE_KEY) {
            return NextResponse.json(
                { ok: false, error: "Mangler TRADING_ECONOMICS_API_KEY i .env.local" },
                { status: 500 }
            );
        }

        const countries = splitCsv(countriesRaw);
        // TE API: vi kan filtrere på "country" vha. query ?country=United%20States,Euro%20Area
        // Hvis tom liste => hent alt (og filtrer lokalt)
        const teUrl = new URL(TE_BASE);
        teUrl.searchParams.set("c", TE_KEY);

        // Window for DIGEST: nu -> nu+hours
        // Window for ALERTS: nu -> nu+warnWindow (vi filtrerer lead i formatter)
        const now = new Date();
        const horizonMin = mode === "alerts" ? warnWindow : hours * 60;
        const end = new Date(now.getTime() + horizonMin * 60 * 1000);
        teUrl.searchParams.set("from", isoYMD(now));
        teUrl.searchParams.set("to", isoYMD(end));

        // Country filter (komma-sep, hvis nogen)
        if (countries.length > 0) {
            teUrl.searchParams.set("country", countries.map(encodeURIComponent).join(","));
        }

        const teRes = await fetch(teUrl.toString(), { cache: "no-store" });
        if (!teRes.ok) {
            const t = await teRes.text();
            return NextResponse.json(
                { ok: false, error: `TradingEconomics API error: ${teRes.status} ${t}` },
                { status: 502 }
            );
        }
        const raw: any = await teRes.json();
        const items = (Array.isArray(raw) ? raw : []).map(cleanTEItem);

        // Lokal filtrering (importance + countries fallback hvis TE ignorerer country param):
        const filtered = items.filter((it) => {
            const imp = coerceInt(it.Importance, 0);
            const impOk = imp >= minImp;
            const countryOk = countries.length === 0 || countries.includes(it.Country);
            return impOk && countryOk;
        });

        // ---- Byg beskeder
        let messages: string[] = [];
        if (mode === "digest") {
            messages = buildDigestMessages(filtered, {
                title,
                tz,
                hours,
                minImp,
                prefix,
            });
        } else {
            messages = buildAlertMessages(filtered, {
                lead,
                warnWindow,
                tz,
                minImp,
                prefix,
                alertTextTpl,
                now,
            });
        }

        if (preview) {
            return NextResponse.json({ ok: true, count: messages.length, messages });
        }

        // ---- Send til Discord (én besked pr. message)
        const sent: string[] = [];
        for (const content of messages) {
            // beskyt mod tomme beskeder
            if (!content || !content.trim()) continue;
            const ok = await sendDiscordMessage(channelId, content);
            if (ok) sent.push(content);
        }

        return NextResponse.json({ ok: true, dispatched: sent.length });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
    }
}

/* -------------------------------- helpers -------------------------------- */

function clampInt(vRaw: string | null, def: number, min: number, max: number) {
    const v = parseInt(vRaw ?? "", 10);
    if (Number.isFinite(v)) return Math.max(min, Math.min(max, v));
    return def;
}
function coerceInt(v: any, def: number) {
    const n = parseInt(String(v ?? ""), 10);
    return Number.isFinite(n) ? n : def;
}
function decodePlus(s: string) {
    try {
        return decodeURIComponent(s.replace(/\+/g, " "));
    } catch {
        return s;
    }
}
function splitCsv(s: string) {
    return s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
}
function isoYMD(d: Date) {
    // TE accepterer YYYY-MM-DD eller fuld iso; vi napper Y-M-D
    return d.toISOString().slice(0, 10);
}
function fmtTime(d: Date, tz: string) {
    try {
        return new Intl.DateTimeFormat("da-DK", {
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
        }).format(d);
    } catch {
        // fallback til UTC hvis tz er ukendt
        return new Intl.DateTimeFormat("da-DK", {
            timeZone: "UTC",
            hour: "2-digit",
            minute: "2-digit",
        }).format(d);
    }
}
function fmtDateTime(d: Date, tz: string) {
    try {
        return new Intl.DateTimeFormat("da-DK", {
            timeZone: tz,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: undefined,
        }).format(d);
    } catch {
        return new Intl.DateTimeFormat("da-DK", {
            timeZone: "UTC",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(d);
    }
}
function importanceIcon(n: number) {
    if (n >= 3) return "🔴 Høj";
    if (n === 2) return "🟠 Medium";
    return "🟢 Lav";
}
function importanceShort(n: number) {
    if (n >= 3) return "RØD (Høj)";
    if (n === 2) return "ORANGE (Medium)";
    return "GRØN (Lav)";
}

function cleanTEItem(x: any): TEItem {
    // Gør felter mere forudsigelige
    return {
        CalendarId: String(x.CalendarId ?? ""),
        Date: String(x.Date ?? ""),
        Country: String(x.Country ?? ""),
        Category: String(x.Category ?? ""),
        Event: String(x.Event ?? ""),
        Reference: x.Reference ? String(x.Reference) : "",
        ReferenceDate: x.ReferenceDate ? String(x.ReferenceDate) : "",
        Source: x.Source ? String(x.Source) : "",
        SourceURL: x.SourceURL ? String(x.SourceURL) : "",
        Actual: x.Actual ? String(x.Actual) : "",
        Previous: x.Previous ? String(x.Previous) : "",
        Forecast: x.Forecast ? String(x.Forecast) : "",
        TEForecast: x.TEForecast ? String(x.TEForecast) : "",
        URL: x.URL ? String(x.URL) : "",
        Importance: coerceInt(x.Importance, 0),
        LastUpdate: x.LastUpdate ? String(x.LastUpdate) : "",
        Currency: x.Currency ? String(x.Currency) : "",
        Unit: x.Unit ? String(x.Unit) : "",
    };
}

/* ------------------------------- builders -------------------------------- */

function buildDigestMessages(
    items: TEItem[],
    opts: {
        title: string;
        tz: string;
        hours: number;
        minImp: number;
        prefix: string;
    }
): string[] {
    const { title, tz, hours, minImp, prefix } = opts;

    if (items.length === 0) {
        return [
            [
                prefix ? `${prefix} ` : "",
                `${title} – næste ${hours} timer`,
                "",
                "_Ingen planlagte begivenheder der matcher dine filtre._",
            ].join(""),
        ];
    }

    // Sorter efter tid
    const sorted = items
        .slice()
        .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

    // Byg liste
    const lines: string[] = [];
    lines.push(`${prefix ? `${prefix} ` : ""}${title} – næste ${hours} timer (importance ≥ ${minImp})\n`);

    for (const it of sorted) {
        const t = new Date(it.Date);
        const when = fmtDateTime(t, tz);
        const imp = importanceIcon(coerceInt(it.Importance, 0));
        const name = it.Event || it.Category || "Event";
        const url = it.URL ? `https://tradingeconomics.com${it.URL}` : "";

        // Forecast/Previous (kun hvis udfyldt)
        const fp: string[] = [];
        if (it.Forecast) fp.push(`Forecast: ${it.Forecast}`);
        if (it.Previous) fp.push(`Previous: ${it.Previous}`);

        const meta = fp.length ? `\n${fp.join(" • ")}` : "";

        lines.push(
            [
                `**${it.Country} — ${name}**`,
                ` ${imp} • ${when}`,
                it.Category && it.Category !== name ? `\n${it.Category}` : "",
                meta,
                url ? `\n(More: ${url})` : "",
                "\n",
            ].join("")
        );
    }

    // Discord har 2000-char limit per message; chunk hvis nødvendigt
    return chunkDiscord(lines.join("\n"), 1900);
}

function buildAlertMessages(
    items: TEItem[],
    opts: {
        lead: number; // minutter før
        warnWindow: number; // minutter frem
        tz: string;
        minImp: number;
        prefix: string;
        alertTextTpl: string;
        now: Date;
    }
): string[] {
    const { lead, warnWindow, tz, prefix, alertTextTpl, now } = opts;

    const nowMs = now.getTime();
    const endMs = nowMs + warnWindow * 60 * 1000;

    // Filter: fra nu til warnWindow – MEN vi formatterer kun dem med T - now <= lead
    const windowed = items
        .filter((it) => {
            const t = new Date(it.Date).getTime();
            return t >= nowMs && t <= endMs;
        })
        .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

    const out: string[] = [];

    for (const it of windowed) {
        const t = new Date(it.Date);
        const minsTo = Math.max(0, Math.round((t.getTime() - nowMs) / 60000));
        if (minsTo > lead) {
            // Ligger indenfor warnWindow men ikke inde for lead – skipper nu (et scheduler cron vil fange den senere)
            continue;
        }

        const timeStr = fmtTime(t, tz);
        const impShort = importanceShort(coerceInt(it.Importance, 0));
        const name = it.Event || it.Category || "Event";
        const body = alertTextTpl
            .replace(/\{mins\}/g, String(minsTo))
            .replace(/\{country\}/g, it.Country || "")
            .replace(/\{event\}/g, name)
            .replace(/\{imp\}/g, impShort)
            .replace(/\{time\}/g, timeStr)
            .replace(/\{category\}/g, it.Category || "");

        out.push(`${prefix ? `${prefix} ` : ""}${body}`);
    }

    // chunking ikke strengt nødvendigt (alerts er korte), men vi beskytter alligevel
    return out.flatMap((m) => chunkDiscord(m, 1800));
}

/* ------------------------------- discord --------------------------------- */

async function sendDiscordMessage(channelId: string, content: string): Promise<boolean> {
    try {
        const token = process.env.DISCORD_BOT_TOKEN;
        if (!token) throw new Error("Mangler DISCORD_BOT_TOKEN i .env.local");

        // mentionRole håndteres i contentByMention
        const finalContent = withMention(content);

        const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bot ${token}`,
            },
            body: JSON.stringify({ content: finalContent }),
        });
        if (!res.ok) {
            const t = await res.text();
            console.error("Discord send error", res.status, t);
            return false;
        }
        return true;
    } catch (e) {
        console.error("Discord send exception", e);
        return false;
    }
}

// mentionRole kommer fra querystring – men vi har ikke adgang til den her.
// Vi lægger det i globalThis på request-scope via en lille “hack”:
// 1) Før vi sender beskeder, sæt globalThis.__mentionRole = param-værdi
// 2) Her bruger vi det til at tilføje korrekt mention
function withMention(content: string) {
    const role = (globalThis as any).__mentionRole as string | undefined;
    if (!role) return content;

    if (role === "everyone") return `@everyone\n${content}`;
    if (role === "here") return `@here\n${content}`;
    // rolle-ID
    return `<@&${role}>\n${content}`;
}

/* ------------------------------ chunk helper ----------------------------- */

function chunkDiscord(text: string, size = 1900): string[] {
    const lines = text.split("\n");
    const out: string[] = [];
    let buf = "";
    for (const ln of lines) {
        if ((buf + ln + "\n").length > size) {
            out.push(buf);
            buf = "";
        }
        buf += ln + "\n";
    }
    if (buf.trim().length) out.push(buf);
    return out;
}
