// lib/sbAuth.ts
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Status = "loading" | "authenticated" | "unauthenticated";

export function useSession() {
    const [session, setSession] = useState<null | any>(null);
    const [status, setStatus] = useState<Status>("loading");

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session ?? null);
            setStatus(data.session ? "authenticated" : "unauthenticated");
        });
        const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => {
            setSession(s ?? null);
            setStatus(s ? "authenticated" : "unauthenticated");
        });
        return () => sub.subscription.unsubscribe();
    }, []);

    // ensartet shape mht. tidligere brug:
    return {
        data: session ? { user: { ...session.user, ...session.user?.user_metadata } } : null,
        status,
    };
}

export async function signIn(provider?: "discord") {
    if (provider === "discord") {
        const origin = typeof window !== "undefined" ? window.location.origin : undefined;
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "discord",
            options: { redirectTo: origin ? `${origin}/age-check` : undefined },
        });
        if (error) throw error;
    }
}

export async function signOut() {
    await supabase.auth.signOut();
}
