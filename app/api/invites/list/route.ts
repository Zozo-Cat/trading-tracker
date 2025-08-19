import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createSb() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const communityId = searchParams.get('communityId');
        if (!communityId) throw new Error('communityId påkrævet');

        const sb = createSb();
        const { data, error } = await sb.from('invites').select('*').eq('community_id', communityId).order('created_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
