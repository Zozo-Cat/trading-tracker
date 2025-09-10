// app/api/teams/join/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({} as any));
        const code = body?.code as string | undefined;
        const inputTeamId = body?.teamId as string | undefined;

        // 1) Auth: profil-id fra Supabase-session (fallback: body.profileId til DEV)
        const supabase = getServerClient();
        const {
            data: { session },
        } = await supabase.auth.getSession();

        const sessionProfileId = (session?.user?.id as string | undefined) ?? undefined;
        const profileId = sessionProfileId ?? (body?.profileId as string | undefined);

        if (!code) return NextResponse.json({ error: "code er påkrævet" }, { status: 400 });
        if (!inputTeamId) return NextResponse.json({ error: "teamId er påkrævet" }, { status: 400 });
        if (!profileId) return NextResponse.json({ error: "Ikke logget ind (mangler profileId)" }, { status: 401 });

        // 2) Slå koden op og tjek at den matcher teamId
        const { data: team, error: teamErr } = await supabaseAdmin
            .from("teams")
            .select("id")
            .eq("join_code", code)
            .maybeSingle();

        if (teamErr) return NextResponse.json({ error: teamErr.message }, { status: 500 });
        if (!team) return NextResponse.json({ error: "Ugyldig kode" }, { status: 404 });

        if (team.id !== inputTeamId) {
            return NextResponse.json(
                { error: "Koden passer ikke til det angivne team_id", expected_team_id: team.id },
                { status: 400 }
            );
        }

        // 3) Kald DB-funktion (idempotent join)
        const { data, error } = await supabaseAdmin.rpc("join_team_by_code", {
            p_join_code: code,
            p_profile_id: profileId,
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        const row = Array.isArray(data) ? data[0] : data;
        if (!row) return NextResponse.json({ error: "Ingen respons fra join_team_by_code" }, { status: 500 });

        if (row.message === "invalid_code") {
            return NextResponse.json({ error: "Ugyldig kode" }, { status: 404 });
        }
        if (row.message === "team_full") {
            return NextResponse.json({ error: "Teamet er fuldt", team_id: row.team_id }, { status: 409 });
        }

        return NextResponse.json({
            ok: true,
            team_id: row.team_id,
            added: !!row.added,
            message: row.message,
        });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? "Bad request" }, { status: 400 });
    }
}
