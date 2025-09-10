// app/dev/login/page.tsx
"use client";

import { useSession, useSupabaseClient } from "@/app/_components/Providers";

export default function DevLoginPage() {
    const session = useSession();
    const user = session?.user;
    const supabase = useSupabaseClient();

    return (
        <main
            style={{
                color: "#D4AF37",
                background: "#211d1d",
                minHeight: "100vh",
                padding: 24,
            }}
        >
            <h1>Dev / Login (Supabase)</h1>

            {user ? (
                <>
                    <p>
                        Logget ind som: <b>{user.email}</b>
                    </p>
                    <pre
                        className="mt-4 p-3 rounded"
                        style={{ background: "#1a1818", border: "1px solid #3b3838" }}
                    >
            {JSON.stringify(user, null, 2)}
          </pre>
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            location.reload();
                        }}
                        className="mt-4 px-3 py-2 rounded text-black"
                        style={{ background: "#f0e68c" }}
                    >
                        Log ud
                    </button>
                </>
            ) : (
                <>
                    <p>Ikke logget ind.</p>
                    <button
                        onClick={async () => {
                            const origin =
                                typeof window !== "undefined" ? window.location.origin : "";
                            await supabase.auth.signInWithOAuth({
                                provider: "discord",
                                options: {
                                    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
                                        "/dashboard"
                                    )}`,
                                },
                            });
                        }}
                        className="mt-3 px-3 py-2 rounded text-black"
                        style={{ background: "#5dade2" }}
                    >
                        Log ind med Discord
                    </button>
                </>
            )}
        </main>
    );
}
