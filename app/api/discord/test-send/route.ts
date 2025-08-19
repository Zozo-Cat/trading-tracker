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
    const message = body.message || "Hello from test-send";

    // TODO: send rigtigt til Discord kanal via bot-token
    console.log("Test send:", message);

    return NextResponse.json({ ok: true, sent: message });
}
