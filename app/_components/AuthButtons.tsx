// components/AuthButtons.tsx
"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function AuthButtons() {
    const { data: session, status } = useSession();
    if (status === "loading") return null;
    if (!session) {
        return (
            <button
                onClick={() => signIn("discord")}
                className="px-3 py-2 rounded-lg text-black font-medium"
                style={{ backgroundColor: "#5dade2" }}
            >
                Forbind Discord
            </button>
        );
    }
    return (
        <div className="flex items-center gap-3">
      <span className="text-sm" style={{ color: "#D4AF37" }}>
        Forbundet som {session.user?.name}
      </span>
            <button
                onClick={() => signOut()}
                className="px-3 py-2 rounded-lg text-black font-medium"
                style={{ backgroundColor: "#f0e68c" }}
            >
                Log ud
            </button>
        </div>
    );
}

// components/BotInviteButton.tsx
"use client";

export function BotInviteButton() {
    // Læs clientId fra public env (til client-bundle)
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    // Vælg permissions (du kan tilpasse tallet senere):
    // View Channels (1024) + Send Messages (2048) + Embed Links (16384) + Attach Files (32768) + Read Message History (65536)
    const permissions = 1024 + 2048 + 16384 + 32768 + 65536; // = 117760
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
            onClick={(e) => { if (!clientId) { e.preventDefault(); alert("Sæt NEXT_PUBLIC_DISCORD_CLIENT_ID i .env.local"); } }}
        >
            Inviter bot til server
        </a>
    );
}
