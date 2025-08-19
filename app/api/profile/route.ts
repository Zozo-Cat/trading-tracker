import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Midlertidig auth:
 *  - Henter profil-id fra header 'x-profile-id' (valgfrit for lokale tests)
 *  - ellers fra ENV DEV_PROFILE_ID
 *  - (Senere: erstat med getServerSession → profiles.id)
 */
function resolveProfileId(request: Request): string | null {
    const hdr = request.headers.get("x-profile-id");
    if (hdr && hdr.trim().length > 0) return hdr.trim();

    const dev = process.env.DEV_PROFILE_ID;
    return dev && dev.trim().length > 0 ? dev.trim() : null;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    // Smid klar fejl, men uden at lække keys
    console.warn("[/api/profile] Missing Supabase env vars");
}

/**
 * Server-side admin client (service role).
 * OBS: Bruges kun på server – denne fil kører kun server-side.
 */
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

export async function GET(request: Request) {
    const profileId = resolveProfileId(request);
    if (!profileId) {
        return NextResponse.json(
            { error: "No profile id. Set DEV_PROFILE_ID or send x-profile-id header." },
            { status: 401 }
        );
    }

    const { data, error } = await supabase
        .from("profiles")
        .select(
            [
                "id",
                "username",
                "display_name",
                "avatar_url",
                "bio",
                "timezone",
                "locale",
                "plan",
                "role",
                "links",
                "marketing_opt_in",
                "public_profile",
            ].join(",")
        )
        .eq("id", profileId)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile: data }, { status: 200 });
}
