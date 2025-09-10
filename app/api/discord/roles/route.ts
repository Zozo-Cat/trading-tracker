// app/api/discord/roles/route.ts
import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const supabase = getServerClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user?.id;
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
