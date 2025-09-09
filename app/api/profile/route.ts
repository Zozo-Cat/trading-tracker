import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
    const supabase = createRouteHandlerClient({ cookies });
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
        return NextResponse.json({ error: error?.message || "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ user: data.user });
}
