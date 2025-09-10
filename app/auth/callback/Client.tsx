// app/auth/callback/Client.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@/app/_components/Providers";

export default function CallbackClient() {
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
                const err =
                    u.searchParams.get("error_description") || u.searchParams.get("error");
                const code = u.searchParams.get("code");

                if (err) {
                    const text = decodeURIComponent(err);
                    setMsg(text);
                    router.replace(`/login?error=${encodeURIComponent(text)}`);
                    return;
                }

                if (code) {
                    const { error } = await supabase.auth.exchangeCodeForSession(href);
                    if (error) {
                        setMsg("Kunne ikke logge ind.");
                        router.replace(`/login?error=${encodeURIComponent(error.message)}`);
                        return;
                    }
                }

                const { data } = await supabase.auth.getSession();
                router.replace(data.session ? next : "/login");
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
            <div className="rounded-2xl p-6 border" style={{ borderColor: "#D4AF37" }}>
                {msg}
            </div>
        </main>
    );
}
