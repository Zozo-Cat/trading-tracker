import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createSb() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        const { id } = body;
        if (!id) throw new Error('id påkrævet');

        const sb = createSb();
        const { error } = await sb.from('invites').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
