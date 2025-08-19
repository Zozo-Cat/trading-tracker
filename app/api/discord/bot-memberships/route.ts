import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id;

    if (!userId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const guildIds: string[] = body.guildIds || [];

    // TODO: check hvilke guilds botten er i
    return NextResponse.json({ present: guildIds });
}
