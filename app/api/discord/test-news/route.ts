// app/api/discord/test-news/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://discord.com/api/v10";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const channelId = searchParams.get("channelId");
        const msg = searchParams.get("msg") || "🔔 News alert (test) — alt virker!";
        if (!channelId) {
            return NextResponse.json({ error: "Missing ?channelId=" }, { status: 400 });
        }
        const token = process.env.DISCORD_BOT_TOKEN;
        if (!token) {
            return NextResponse.json({ error: "Missing DISCORD_BOT_TOKEN in env" }, { status: 500 });
        }

        const r = await fetch(`${API_BASE}/channels/${channelId}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bot ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: msg,
                // Du kan teste embed-format senere:
                // embeds: [{ title: "High Impact News", description: "USD CPI om 10 min", color: 0xF1C40F }],
            }),
        });

        if (!r.ok) {
            const t = await r.text();
            return NextResponse.json({ error: "Discord API error", detail: t }, { status: 502 });
        }

        const json = await r.json();
        return NextResponse.json({ ok: true, messageId: json.id });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    // Alternativ: POST med JSON { channelId, msg }
    try {
        const { channelId, msg } = await req.json();
        if (!channelId) {
            return NextResponse.json({ error: "Missing channelId" }, { status: 400 });
        }
        const token = process.env.DISCORD_BOT_TOKEN;
        if (!token) {
            return NextResponse.json({ error: "Missing DISCORD_BOT_TOKEN in env" }, { status: 500 });
        }
        const r = await fetch(`${API_BASE}/channels/${channelId}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bot ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content: msg || "🔔 News alert (test) — alt virker!" }),
        });

        if (!r.ok) {
            const t = await r.text();
            return NextResponse.json({ error: "Discord API error", detail: t }, { status: 502 });
        }

        const json = await r.json();
        return NextResponse.json({ ok: true, messageId: json.id });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
    }
}
