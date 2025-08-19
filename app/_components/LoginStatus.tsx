"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function LoginStatus() {
    const { data: session, status } = useSession();
    if (status === "loading") return null;

    return (
        <div
            className="fixed top-4 right-4 z-50 rounded-xl border px-3 py-2 shadow"
            style={{ backgroundColor: "#1a1717", borderColor: "rgba(212,175,55,0.35)" }}
        >
            {session ? (
                <div className="flex items-center gap-3">
          <span style={{ color: "#D4AF37" }} className="text-sm">
            Forbundet som {session.user?.name ?? "Discord‑bruger"}
          </span>
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#76ed77" }} />
                    <button
                        onClick={() => signOut()}
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
                        onClick={() => signIn("discord")}
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
