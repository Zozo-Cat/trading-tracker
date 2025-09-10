// app/api/discord/guilds/route.ts
import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
    const supabase = getServerClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user?.id;
    if (!userId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // TODO: fetch rigtige guilds fra Discord API
    return NextResponse.json({ guilds: [] });
}
