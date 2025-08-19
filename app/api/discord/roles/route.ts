import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id;

    if (!userId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const guildId = searchParams.get("guildId");

    if (!guildId) {
        return NextResponse.json({ error: "Missing guildId" }, { status: 400 });
    }

    // TODO: fetch roles fra Discord API
    return NextResponse.json({ roles: [] });
}
