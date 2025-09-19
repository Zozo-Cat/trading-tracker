// app/api/news/upcoming/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchUpcoming } from "../_core";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function clampInt(vRaw: string | null, def: number, min: number, max: number) {
    const v = parseInt(vRaw ?? "", 10);
    if (Number.isFinite(v)) return Math.max(min, Math.min(max, v));
    return def;
}

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const limit = clampInt(url.searchParams.get("limit"), 5, 1, 50);
        const minImp = clampInt(url.searchParams.get("minImp"), 1, 1, 3);
        const hoursAhead = clampInt(url.searchParams.get("hoursAhead"), 48, 1, 168);
        const countries = (url.searchParams.get("countries") || "")
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);

        let items = await fetchUpcoming({ hoursAhead, minImp, countries });
        if (limit) items = items.slice(0, limit);

        return NextResponse.json(items, { headers: { "Cache-Control": "no-store" } });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
    }
}
