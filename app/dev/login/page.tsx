// app/dev/login/page.tsx
"use client";

import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function DevLoginPage() {
    const { data, status } = useSession();
    const user = data?.user as any;
    const gold = "#D4AF37";

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-xl font-semibold" style={{ color: gold }}>
                Dev / Login test
            </h1>

            {status === "loading" && (
                <div className="text-sm" style={{ color: gold }}>
                    Loader session…
                </div>
            )}

            {status !== "loading" && !user && (
                <div className="space-x-2">
                    <button
                        onClick={() => signIn("discord")}
                        className="rounded-lg border px-3 py-2"
                        style={{ borderColor: gold, color: gold }}
                    >
                        Log ind med Discord
                    </button>
                </div>
            )}

            {status !== "loading" && user && (
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <img
                            src={user.image ?? "/images/default-avatar.png"}
                            alt="Profil"
                            width={42}
                            height={42}
                            className="rounded-full border border-gray-600"
                        />
                        <div>
                            <div className="font-medium text-white">{user.name ?? user.email ?? "Bruger"}</div>
                            <div className="text-xs text-gray-400">{user.email ?? "-"}</div>
                        </div>
                    </div>

                    <pre className="bg-neutral-900 rounded-lg p-3 text-xs overflow-auto">
{JSON.stringify(data, null, 2)}
          </pre>

                    <button
                        onClick={() => signOut()}
                        className="rounded-lg border px-3 py-2"
                        style={{ borderColor: gold, color: gold }}
                    >
                        Log ud
                    </button>
                </div>
            )}
        </div>
    );
}
