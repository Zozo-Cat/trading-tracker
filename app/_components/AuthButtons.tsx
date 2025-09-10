"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";

export function AuthButtons() {
    const router = useRouter();
    const session = useSession(); // null hvis ikke logget ind

    const loginWithDiscord = async () => {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        await supabase.auth.signInWithOAuth({
            provider: "discord",
            options: {
                redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
                    "/dashboard"
                )}`,
            },
        });
    };

    const logout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    if (!session) {
        return (
            <button
                onClick={loginWithDiscord}
                className="px-3 py-2 rounded-lg text-black font-medium"
                style={{ backgroundColor: "#5dade2" }}
            >
                Forbind Discord
            </button>
        );
    }

    const user = session.user as any;
    const displayName = user?.user_metadata?.full_name || user?.email || "Bruger";

    return (
        <div className="flex items-center gap-3">
      <span className="text-sm" style={{ color: "#D4AF37" }}>
        Forbundet som {displayName}
      </span>
            <button
                onClick={logout}
                className="px-3 py-2 rounded-lg text-black font-medium"
                style={{ backgroundColor: "#f0e68c" }}
            >
                Log ud
            </button>
        </div>
    );
}
