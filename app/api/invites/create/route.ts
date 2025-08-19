import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createSb() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { communityId, days, maxUses } = body;
        const code = 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

        const sb = createSb();
        const { data, error } = await sb.from('invites').insert({
            code,
            community_id: communityId,
            expires_at: expiresAt,
            max_uses: maxUses,
            uses: 0,
        }).select().single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
