import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id;

    if (!userId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // TODO: fetch rigtige guilds fra Discord API
    return NextResponse.json({ guilds: [] });
}
