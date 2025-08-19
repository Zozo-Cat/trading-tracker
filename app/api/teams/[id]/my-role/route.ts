import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type Params = { params: { id: string } };

export async function GET(req: Request, { params }: Params) {
    const teamId = params.id;
    const url = new URL(req.url);

    const session = await getServerSession(authOptions).catch(() => null as any);
    const sessionProfileId = (session as any)?.user?.id as string | undefined;
    const inputProfileId = url.searchParams.get('profileId') || undefined;
    const profileId = sessionProfileId ?? inputProfileId;

    if (!teamId)     return NextResponse.json({ error: 'team id mangler' }, { status: 400 });
    if (!profileId)  return NextResponse.json({ error: 'profileId mangler' }, { status: 400 });

    // 1) Hent team for community_id
    const { data: team, error: teamErr } = await supabaseAdmin
        .from('teams')
        .select('id, community_id')
        .eq('id', teamId)
        .maybeSingle();
    if (teamErr) return NextResponse.json({ error: teamErr.message }, { status: 500 });
    if (!team)   return NextResponse.json({ error: 'team ikke fundet' }, { status: 404 });

    // 2) Team-rolle
    const { data: tm, error: tmErr } = await supabaseAdmin
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('profile_id', profileId)
        .maybeSingle();
    if (tmErr) return NextResponse.json({ error: tmErr.message }, { status: 500 });
    const team_role = tm?.role ?? null;

    // 3) Community-rolle (hvis relevant)
    let community_role: string | null = null;
    if (team.community_id) {
        const { data: cm, error: cmErr } = await supabaseAdmin
            .from('community_members')
            .select('role')
            .eq('community_id', team.community_id)
            .eq('profile_id', profileId)
            .maybeSingle();
        if (cmErr) return NextResponse.json({ error: cmErr.message }, { status: 500 });
        community_role = cm?.role ?? null;
    }

    const is_manager = team_role === 'team_lead' || community_role === 'community_lead';
    return NextResponse.json({ team_role, community_role, is_manager });
}
