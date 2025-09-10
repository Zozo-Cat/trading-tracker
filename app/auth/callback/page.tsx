// app/auth/callback/page.tsx
"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, useSupabaseClient } from "@/app/_components/Providers";

export const dynamic = "force-dynamic"; // undgå prerender på callback-siden

function CallbackInner() {
    const router = useRouter();
    const search = useSearchParams();
    const session = useSession();
    const supabase = useSupabaseClient();

    // valgfri: hvis du bruger Supabase OAuth (PKCE), byt code->session (no-op hvis ikke nødvendigt)
    useEffect(() => {
        (async () => {
            try {
                // findes i supabase-js v2; safe med optional chaining
                // @ts-expect-error - metode er ikke typet i alle setups
                await supabase.auth.exchangeCodeForSession?.(window.location.href);
            } catch {}
        })();
    }, [supabase]);

    const next = search.get("next") || "/dashboard";

    useEffect(() => {
        // Når session er klar, send videre
        if (session !== null) {
            router.replace(next);
        }
    }, [session, router, next]);

    return (
        <main
            style={{
                color: "#D4AF37",
                background: "#211d1d",
                minHeight: "100vh",
                display: "grid",
                placeItems: "center",
                padding: 24,
            }}
        >
            <div style={{ textAlign: "center" }}>
                <h1>Logger ind…</h1>
                <p>Vent et øjeblik, du bliver sendt videre.</p>
            </div>
        </main>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <main
                    style={{
                        color: "#D4AF37",
                        background: "#211d1d",
                        minHeight: "100vh",
                        display: "grid",
                        placeItems: "center",
                        padding: 24,
                    }}
                >
                    <div style={{ textAlign: "center" }}>
                        <h1>Logger ind…</h1>
                    </div>
                </main>
            }
        >
            <CallbackInner />
        </Suspense>
    );
}
