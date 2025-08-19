// lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

// Server-only client (må KUN importeres i server code / API routes)
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,        // fx https://clkjhfhnqqsnnkougwyu.supabase.co
    process.env.SUPABASE_SERVICE_ROLE_KEY!,       // ligger i .env (server only)
    { auth: { persistSession: false, autoRefreshToken: false } }
);
