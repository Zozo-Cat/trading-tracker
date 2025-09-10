// app/auth/callback/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseClient } from "@/app/_components/Providers";

export default function AuthCallbackPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const supabase = useSupabaseClient();

    const next = useMemo(() => sp.get("next") || "/dashboard", [sp]);
    const [msg, setMsg] = useState("Færdiggør login…");

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                // 1) Hvis vi er i "code exchange"-flow (PKCE)
                const url = typeof window !== "undefined" ? window.location.href : "";
                const hasCode = typeof window !== "undefined" && new URL(url).searchParams.get("code");
                if (hasCode) {
                    const { error } = await supabase.auth.exchangeCodeForSession(url);
                    if (error) throw error;
                }

                // 2) Ellers (implicit/hash) – supabase-js sætter session ved page load.
                //    Vi tjekker og venter kort hvis nødvendigt:
                for (let i = 0; i < 10; i++) {
                    const { data } = await supabase.auth.getSession();
                    if (data.session) break;
                    await new Promise((r) => setTimeout(r, 100));
                }
            } catch (e: any) {
                console.error(e);
                if (alive) setMsg("Kunne ikke færdiggøre login. Prøv igen.");
            } finally {
                if (alive) router.replace(next);
            }
        })();

        return () => {
            alive = false;
        };
    }, [next, router, supabase]);

    return (
        <main className="min-h-screen flex items-center justify-center" style={{ background:"#211d1d", color:"#D4AF37" }}>
            <div className="rounded-xl border px-4 py-3" style={{ borderColor:"#3b3838" }}>
                {msg}
            </div>
        </main>
    );
}
