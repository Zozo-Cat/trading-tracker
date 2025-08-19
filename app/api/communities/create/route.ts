import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function sb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, description, joinCode, userId } = body;

        if (!name || !userId) throw new Error('Navn og userId påkrævet');

        const { data, error } = await sb()
            .from('communities')
            .insert([{ name, description, join_code: joinCode || null, created_by: userId }])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ ok: true, community: data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
