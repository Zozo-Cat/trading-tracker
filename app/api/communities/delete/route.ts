import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function sb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        const { id } = body as { id?: string };
        if (!id) throw new Error('id påkrævet');

        const client = sb();

        // 1) Tjek samlet stats for community (teams + medlemmer)
        const { data: stats, error: statsErr } = await client
            .from('community_stats')
            .select('teams_count,members_count')
            .eq('community_id', id)
            .maybeSingle();

        if (statsErr) throw statsErr;

        const teamsCount = stats?.teams_count ?? 0;
        const membersCount = stats?.members_count ?? 0;

        if (teamsCount > 0 || membersCount > 0) {
            // Mere præcis fejlbesked
            if (teamsCount > 0 && membersCount > 0) {
                return NextResponse.json(
                    { error: 'Kan ikke slette: der findes både teams og medlemmer. Fjern/Unlink alt først.' },
                    { status: 400 }
                );
            }
            if (teamsCount > 0) {
                return NextResponse.json(
                    { error: 'Kan ikke slette: der findes teams. Slet eller unlink teams først.' },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                { error: 'Kan ikke slette: der findes medlemmer. Fjern dem først.' },
                { status: 400 }
            );
        }

        // 2) Ryd invites for renhed (valgfrit men pænt)
        const { error: invErr } = await client
            .from('invites')
            .delete()
            .eq('community_id', id);
        if (invErr) throw invErr;

        // 3) Slet community
        const { error: delErr } = await client
            .from('communities')
            .delete()
            .eq('id', id);
        if (delErr) throw delErr;

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'Uventet fejl' }, { status: 400 });
    }
}
