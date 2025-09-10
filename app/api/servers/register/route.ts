// app/api/servers/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";
import { prisma } from "../../../../lib/db";

function randomServerId() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

function randomJoinCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
    const supabase = getServerClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Supabase session.user indeholder standard felter som id, email, provider
    // Hvis du gemmer Discord ID i user_metadata, kan det hentes sådan her:
    const ownerDiscordId =
        (session.user as any)?.user_metadata?.provider_id ||
        (session.user as any)?.discordId ||
        null;

    if (!ownerDiscordId) {
        return NextResponse.json({ error: "Unauthorized (no discordId)" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as
        | { guildId?: string; name?: string }
        | null;

    if (!body?.guildId || !body?.name) {
        return NextResponse.json({ error: "Missing guildId or name" }, { status: 400 });
    }
    body.guildId = body.guildId.trim();

    const existing = await prisma.server.findFirst({ where: { discordGuildId: body.guildId } });
    if (existing) {
        return NextResponse.json({
            ok: true,
            alreadyExists: true,
            serverId: existing.serverId,
            joinCode: existing.joinCode,
            name: existing.name,
        });
    }

    let serverId = randomServerId();
    for (let i = 0; i < 5; i++) {
        const clash = await prisma.server.findUnique({ where: { serverId } });
        if (!clash) break;
        serverId = randomServerId();
    }

    const joinCode = randomJoinCode();

    const created = await prisma.server.create({
        data: {
            serverId,
            name: body.name,
            joinCode,
            discordGuildId: body.guildId,
            ownerDiscordId,
            memberships: {
                create: { userDiscordId: ownerDiscordId, role: "SERVER_ADMIN" },
            },
        },
    });

    return NextResponse.json({
        ok: true,
        serverId: created.serverId,
        joinCode: created.joinCode,
        name: created.name,
    });
}

// Valgfri GET til hurtig rute-test
export async function GET() {
    return NextResponse.json({ ok: true, route: "/api/servers/register" });
}
