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

        // ✅ Understøt både "nyt" og "gammelt" payload
        // Nyt (fra /config/org-bot?view=create): { name, description?, community_id?, owner_user_id, join_code? }
        // Gammelt (din nuv. side): { communityId, name, ownerUserId, joinCode? }
        const name =
            body.name ??
            body?.name; // (samme)
        const description =
            (body.description ?? null) as string | null;
        const community_id =
            (body.community_id ?? body.communityId ?? null) as string | null;
        const owner_user_id =
            (body.owner_user_id ?? body.ownerUserId) as string | undefined;
        const join_code =
            (body.join_code ?? body.joinCode ?? null) as string | null;

        if (!name || !owner_user_id) {
            throw new Error('name og owner_user_id er påkrævet');
        }
        // community_id er valgfri (kan være null)

        const client = sb();

        const { data, error } = await client
            .from('teams')
            .insert({
                name,
                description,
                community_id,
                owner_user_id,
                join_code,
            })
            .select('id,name,description,community_id,owner_user_id,join_code,created_at')
            .single();

        if (error) throw error;

        // Ensartet svarform
        return NextResponse.json({ ok: true, team: data });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? 'Uventet fejl' }, { status: 400 });
    }
}
