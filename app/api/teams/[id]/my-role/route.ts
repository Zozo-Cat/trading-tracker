// app/api/teams/[id]/my-role/route.ts
import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
    const teamId = params.id;
    if (!teamId) return NextResponse.json({ error: "team id mangler" }, { status: 400 });

    const supabase = getServerClient();
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
        return NextResponse.json({ error: "Ikke logget ind" }, { status: 401 });
    }
    const profileId = auth.user.id;

    // 1) Find team for community_id
    const { data: team, error: teamErr } = await supabaseAdmin
        .from("teams")
        .select("id, community_id")
        .eq("id", teamId)
        .maybeSingle();
    if (teamErr) return NextResponse.json({ error: teamErr.message }, { status: 500 });
    if (!team) return NextResponse.json({ error: "team ikke fundet" }, { status: 404 });

    // 2) Team-rolle
    const { data: tm, error: tmErr } = await supabaseAdmin
        .from("team_members")
        .select("role")
        .eq("team_id", teamId)
        .eq("profile_id", profileId)
        .maybeSingle();
    if (tmErr) return NextResponse.json({ error: tmErr.message }, { status: 500 });
    const team_role = tm?.role ?? null;

    // 3) Community-rolle
    let community_role: string | null = null;
    if (team.community_id) {
        const { data: cm, error: cmErr } = await supabaseAdmin
            .from("community_members")
            .select("role")
            .eq("community_id", team.community_id)
            .eq("profile_id", profileId)
            .maybeSingle();
        if (cmErr) return NextResponse.json({ error: cmErr.message }, { status: 500 });
        community_role = cm?.role ?? null;
    }

    const is_manager = team_role === "team_lead" || community_role === "community_lead";
    return NextResponse.json({ team_role, community_role, is_manager });
}
