import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function sb() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { teamId, requestedBy } = body;
        if (!teamId || !requestedBy) throw new Error('teamId, requestedBy påkrævet');

        const { data, error } = await sb()
            .from('team_unlink_requests')
            .insert([{ team_id: teamId, requested_by: requestedBy }])
            .select()
            .single();
        if (error) throw error;

        return NextResponse.json({ ok: true, request: data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
