import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function sb() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        const { id } = body;
        if (!id) throw new Error('id påkrævet');

        const client = sb();

        // må kun slette hvis team er tomt
        const { data: tstats, error: tsErr } = await client
            .from('teams_with_stats')
            .select('members_count')
            .eq('id', id)
            .single();
        if (tsErr) throw tsErr;
        if ((tstats as any)?.members_count > 0) {
            throw new Error('Kan ikke slette team med medlemmer. Fjern medlemmerne først.');
        }

        const { error: delErr } = await client.from('teams').delete().eq('id', id);
        if (delErr) throw delErr;

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
