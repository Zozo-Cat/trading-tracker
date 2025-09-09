"use client";

import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";

export function AuthButtons() {
    const session = useSession();
    const su = session?.user as any | null;

    if (!su) {
        const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
        return (
            <button
                onClick={async () => {
                    await supabase.auth.signInWithOAuth({
                        provider: "discord",
                        options: {
                            redirectTo:
                                typeof window !== "undefined"
                                    ? `${window.location.origin}/age-check`
                                    : undefined,
                        },
                    });
                }}
                className="px-3 py-2 rounded-lg text-black font-medium"
                style={{ backgroundColor: "#5dade2" }}
            >
                Forbind Discord
            </button>
        );
    }

    const name =
        (su.user_metadata?.full_name as string) ||
        (su.email as string) ||
        "Bruger";

    return (
        <div className="flex items-center gap-3">
      <span className="text-sm" style={{ color: "#D4AF37" }}>
        Forbundet som {name}
      </span>
            <button
                onClick={async () => {
                    await supabase.auth.signOut();
                    location.reload();
                }}
                className="px-3 py-2 rounded-lg text-black font-medium"
                style={{ backgroundColor: "#f0e68c" }}
            >
                Log ud
            </button>
        </div>
    );
}

/** (valgfri) Bot-invite knap – uændret styling */
export function BotInviteButton() {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const permissions = 1024 + 2048 + 16384 + 32768 + 65536; // 117760
    const url = clientId
        ? `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`
        : "#";

    return (
        <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-lg text-black font-medium inline-flex items-center justify-center"
            style={{ backgroundColor: "#5dade2" }}
            onClick={(e) => {
                if (!clientId) {
                    e.preventDefault();
                    alert("Sæt NEXT_PUBLIC_DISCORD_CLIENT_ID i .env.local");
                }
            }}
        >
            Inviter bot til server
        </a>
    );
}
