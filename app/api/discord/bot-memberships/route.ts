import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const supabase = createRouteHandlerClient({ cookies });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user?.id;

    if (!userId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const guildIds: string[] = body.guildIds || [];

    // TODO: check hvilke guilds botten er i
    return NextResponse.json({ present: guildIds });
}
