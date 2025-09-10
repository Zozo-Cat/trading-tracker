// app/api/profile/route.ts
import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";

export async function GET() {
    const supabase = getServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
        return NextResponse.json(
            { error: error?.message || "Not authenticated" },
            { status: 401 }
        );
    }
    return NextResponse.json({ user: data.user });
}
