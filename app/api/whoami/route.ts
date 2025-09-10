// app/api/whoami/route.ts
import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
    const supabase = getServerClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Returnér Supabase-session (null hvis ikke logget ind)
    return NextResponse.json({ session });
}
