import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function sb() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, name, join_code } = body;
        if (!id) throw new Error('id påkrævet');

        const { data, error } = await sb()
            .from('teams')
            .update({ name, join_code })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;

        return NextResponse.json({ ok: true, team: data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
