// app/auth/callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@/app/_components/Providers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AuthCallbackPage() {
    const router = useRouter();
    const supabase = useSupabaseClient();
    const [msg, setMsg] = useState("Completing sign-in…");

    useEffect(() => {
        (async () => {
            try {
                const href = typeof window !== "undefined" ? window.location.href : "";
                if (!href) return;

                const u = new URL(href);
                const next = u.searchParams.get("next") || "/dashboard";
                const code = u.searchParams.get("code");
                const err =
                    u.searchParams.get("error_description") || u.searchParams.get("error");

                // Hvis OAuth fejlede
                if (err) {
                    const text = decodeURIComponent(err);
                    setMsg(text);
                    router.replace(`/login?error=${encodeURIComponent(text)}`);
                    return;
                }

                // Byt kode til session (Supabase OAuth PKCE)
                if (code) {
                    const { error } = await supabase.auth.exchangeCodeForSession(href);
                    if (error) {
                        setMsg("Kunne ikke logge ind.");
                        router.replace(`/login?error=${encodeURIComponent(error.message)}`);
                        return;
                    }
                }

                // Har vi nu en session? Gå til next, ellers login
                const { data } = await supabase.auth.getSession();
                if (data.session) {
                    router.replace(next);
                } else {
                    router.replace("/login");
                }
            } catch {
                router.replace("/login");
            }
        })();
    }, [router, supabase]);

    return (
        <main
            className="min-h-screen flex items-center justify-center"
            style={{ background: "#211d1d", color: "#D4AF37" }}
        >
            <div
                className="rounded-2xl p-6 border"
                style={{ borderColor: "#D4AF37" }}
            >
                {msg}
            </div>
        </main>
    );
}
