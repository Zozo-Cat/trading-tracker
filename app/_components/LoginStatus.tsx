"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginStatus() {
    const router = useRouter();
    const session = useSession(); // Supabase: Session | null

    // Bevar "loading"-adfærd (Supabase har ikke status-flag)
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    const loginWithDiscord = async () => {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        await supabase.auth.signInWithOAuth({
            provider: "discord",
            options: { redirectTo: `${origin}/dashboard` },
        });
    };

    const logout = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    const user = session?.user as any | null;
    const displayName =
        user?.user_metadata?.full_name || user?.email || "Discord-bruger";

    return (
        <div
            className="fixed top-4 right-4 z-50 rounded-xl border px-3 py-2 shadow"
            style={{ backgroundColor: "#1a1717", borderColor: "rgba(212,175,55,0.35)" }}
        >
            {session ? (
                <div className="flex items-center gap-3">
          <span style={{ color: "#D4AF37" }} className="text-sm">
            Forbundet som {displayName}
          </span>
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#76ed77" }} />
                    <button
                        onClick={logout}
                        className="px-2 py-1 rounded-md text-black text-sm font-medium"
                        style={{ backgroundColor: "#f0e68c" }}
                    >
                        Log ud
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <span style={{ color: "#D4AF37" }} className="text-sm">Ikke forbundet</span>
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#e67e22" }} />
                    <button
                        onClick={loginWithDiscord}
                        className="px-2 py-1 rounded-md text-black text-sm font-medium"
                        style={{ backgroundColor: "#5dade2" }}
                    >
                        Forbind Discord
                    </button>
                </div>
            )}
        </div>
    );
}
