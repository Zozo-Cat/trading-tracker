// app/api/teams/route.ts
import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// Kort join-kode (8 tegn uden forvekslingsbogstaver)
function makeJoinCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
    return code;
}

export async function GET() {
    const { data, error } = await supabaseAdmin
        .from("teams")
        .select("id,name,description,parent_team_id,join_code,created_at")
        .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(req: Request) {
    try {
        // Supabase session i stedet for NextAuth
        const supabase = getServerClient();
        const {
            data: { session },
        } = await supabase.auth.getSession();

        const userId = session?.user?.id;
        if (!userId) {
            return NextResponse.json({ error: "Ikke logget ind" }, { status: 401 });
        }

        const body = (await req.json()) as {
            name?: string;
            description?: string | null;
            parent_team_id?: string | null;
        };
        const { name, description = null, parent_team_id = null } = body ?? {};
        if (!name) {
            return NextResponse.json({ error: "name er påkrævet" }, { status: 400 });
        }

        // Generér (næsten sikkert) unik join-kode
        let join_code = makeJoinCode();
        for (let i = 0; i < 5; i++) {
            const { data: exists } = await supabaseAdmin
                .from("teams")
                .select("id")
                .eq("join_code", join_code)
                .maybeSingle();
            if (!exists) break;
            join_code = makeJoinCode();
        }

        // Opret team — created_by = den loggede bruger
        const { data: team, error } = await supabaseAdmin
            .from("teams")
            .insert([{ name, description, parent_team_id, created_by: userId, join_code }])
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Gør skaberen til owner automatisk
        await supabaseAdmin
            .from("team_members")
            .upsert([{ team_id: team.id, user_id: userId, role: "owner", added_by: userId }], {
                onConflict: "team_id,user_id",
            });

        return NextResponse.json(team, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? "Bad JSON" }, { status: 400 });
    }
}
