import { NextResponse } from "next/server";

export async function GET() {
    const apiKey = process.env.NEXT_PUBLIC_TE_API_KEY!;
    const today = new Date();
    const end = new Date();
    end.setDate(today.getDate() + 7);
    const d1 = today.toISOString().split("T")[0];
    const d2 = end.toISOString().split("T")[0];

    const url = new URL("https://api.tradingeconomics.com/calendar");
    // ⬇️ try minimal params first
    url.searchParams.set("format", "json");
    url.searchParams.set("d1", d1);
    url.searchParams.set("d2", d2);
    url.searchParams.set("c", apiKey); // your key as given in “Keys”

    try {
        const res = await fetch(url.toString(), { cache: "no-store" });
        const text = await res.text();
        if (!res.ok) {
            return NextResponse.json({ ok: false, status: res.status, body: text, url: url.toString() });
        }
        let data: any = [];
        try { data = JSON.parse(text); } catch {}
        return NextResponse.json({ ok: true, count: Array.isArray(data) ? data.length : 0, sample: (data || []).slice?.(0,5) });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message });
    }
}
