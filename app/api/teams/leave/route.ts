import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
    try {
        const { teamId, profileId } = await req.json();

        if (!teamId || !profileId) {
            return NextResponse.json({ error: 'teamId og profileId er påkrævet' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('profile_id', profileId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true, team_id: teamId, profile_id: profileId });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
    }
}
