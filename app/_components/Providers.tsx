"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

type SupabaseCtx = {
    supabase: SupabaseClient;
    session: Session | null;
};

const SupabaseContext = createContext<SupabaseCtx | null>(null);

// Hooks som erstatning for @supabase/auth-helpers-react
export function useSupabaseClient() {
    const ctx = useContext(SupabaseContext);
    if (!ctx) throw new Error("useSupabaseClient must be used within <Providers>");
    return ctx.supabase;
}

export function useSession() {
    const ctx = useContext(SupabaseContext);
    if (!ctx) throw new Error("useSession must be used within <Providers>");
    return ctx.session;
}

export default function Providers({ children }: { children: React.ReactNode }) {
    const [supabase] = useState(() =>
        createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    );
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        let mounted = true;

        supabase.auth.getSession().then(({ data }) => {
            if (mounted) setSession(data.session ?? null);
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
            setSession(sess ?? null);
        });

        return () => {
            mounted = false;
            sub.subscription.unsubscribe();
        };
    }, [supabase]);

    return (
        <SupabaseContext.Provider value={{ supabase, session }}>
            {children}
        </SupabaseContext.Provider>
    );
}
