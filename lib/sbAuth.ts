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

    // Bevar samme shape som tidligere kode forventer
    return {
        data: session
            ? { user: { ...session.user, ...session.user?.user_metadata } }
            : null,
        status,
    };
}

/**
 * Sign in with Discord via Supabase OAuth.
 * @param provider  Kun "discord" pt.
 * @param next      Hvor brugeren skal lande efter login (default: "/dashboard")
 */
export async function signIn(provider?: "discord", next: string = "/dashboard") {
    if (provider !== "discord") return;

    const origin =
        typeof window !== "undefined" ? window.location.origin : undefined;

    const redirectTo = origin
        ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
        : undefined;

    const { error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: { redirectTo },
    });

    if (error) throw error;
}

export async function signOut() {
    await supabase.auth.signOut();
}
