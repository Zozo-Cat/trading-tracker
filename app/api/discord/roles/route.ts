import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const supabase = createRouteHandlerClient({ cookies });

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
