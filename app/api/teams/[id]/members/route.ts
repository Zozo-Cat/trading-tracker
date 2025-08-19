// app/api/teams/[id]/members/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type Params = { params: { id: string } };

// GET /api/teams/:id/members
export async function GET(_req: Request, { params }: Params) {
    try {
        const teamId = params.id;
        if (!teamId) {
            return NextResponse.json({ error: 'team id mangler' }, { status: 400 });
        }

        // Hent medlemmer + profilinfo via FK-embed
        const { data, error } = await supabaseAdmin
            .from('team_members')
            .select(`
        team_id,
        profile_id,
        role,
        joined_at,
        profiles (
          name,
          avatar_url,
          plan
        )
      `)
            .eq('team_id', teamId)
            .order('joined_at', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Normaliser svar
        const members = (data ?? []).map((row: any) => ({
            team_id: row.team_id,
            profile_id: row.profile_id,
            role: row.role,
            joined_at: row.joined_at,
            name: row.profiles?.name ?? null,
            avatar_url: row.profiles?.avatar_url ?? null,
            plan: row.profiles?.plan ?? null,
        }));

        return NextResponse.json({ members });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'unexpected error' }, { status: 500 });
    }
}
