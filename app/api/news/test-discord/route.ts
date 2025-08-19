import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // Her kunne vi validere communityId, channelId, roleIds osv.
        // For nu returnerer vi bare succes for at teste end-to-end.
        return NextResponse.json({ ok: true, echo: body });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 400 });
    }
}
