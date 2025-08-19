// app/api/users-count/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Returnerer { count: number } med antal brugere.
 * Vi tæller fra "profiles"-tabellen, som typisk spejler auth.users.
 * (Virker med service role på serversiden.)
 */
export async function GET() {
    try {
        const { count, error } = await supabaseAdmin
            .from("profiles")
            .select("*", { count: "exact", head: true });

        if (error) {
            console.error("Supabase count error:", error);
            return NextResponse.json({ count: 0, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ count: count ?? 0 });
    } catch (e: any) {
        console.error("Unhandled error:", e);
        return NextResponse.json({ count: 0, error: "Server error" }, { status: 500 });
    }
}
