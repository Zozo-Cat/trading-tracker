// app/api/discord/bot-memberships/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

function createSupabaseForRoute() {
    const cookieStore = cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name: string, options: any) {
                    cookieStore.set({ name, value: "", ...options });
                },
            },
        }
    );
}

export async function POST(req: NextRequest) {
    const supabase = createSupabaseForRoute();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user?.id;
    if (!userId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let body: any = {};
    try {
        body = await req.json();
    } catch {
        body = {};
    }
    const guildIds: string[] = Array.isArray(body.guildIds) ? body.guildIds : [];

    // TODO: check hvilke guilds botten er i
    return NextResponse.json({ present: guildIds });
}
