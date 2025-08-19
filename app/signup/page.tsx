// app/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
    const router = useRouter();

    // Login state
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginMsg, setLoginMsg] = useState<string | null>(null);

    // Signup state
    const [signupName, setSignupName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [signupLoading, setSignupLoading] = useState(false);
    const [signupMsg, setSignupMsg] = useState<string | null>(null);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoginLoading(true);
        setLoginMsg(null);

        const { error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: loginPassword,
        });

        if (error) {
            setLoginMsg(error.message);
        } else {
            setLoginMsg("Du er nu logget ind ✅");
            setTimeout(() => {
                router.push("/");
                router.refresh();
            }, 400);
        }
        setLoginLoading(false);
    }

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setSignupLoading(true);
        setSignupMsg(null);

        const { error } = await supabase.auth.signUp({
            email: signupEmail,
            password: signupPassword,
            options: { data: { name: signupName } },
        });

        if (error) {
            setSignupMsg(error.message);
        } else {
            setSignupMsg("Konto oprettet! Tjek venligst din email for at bekræfte kontoen.");
        }
        setSignupLoading(false);
    }

    async function handleDiscordLogin() {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "discord",
            options: {
                redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
            },
        });
        if (error) setLoginMsg(error.message);
    }

    return (
        <main className="min-h-screen bg-[#211d1d] text-[#D4AF37] flex items-center justify-center px-4">
            <div className="max-w-4xl w-full bg-[#1a1818] rounded-xl shadow-lg p-8 md:p-12 flex flex-col md:flex-row gap-8">
                {/* Venstre side - Login */}
                <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-6 text-center md:text-left">Log ind</h2>
                    <form className="space-y-4" onSubmit={handleLogin}>
                        <input
                            type="email"
                            placeholder="Email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="w-full p-3 rounded bg-gray-800 border border-gray-600 text-white"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Adgangskode"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full p-3 rounded bg-gray-800 border border-gray-600 text-white"
                            required
                        />
                        <button
                            type="submit"
                            disabled={loginLoading}
                            className="w-full p-3 rounded font-medium text-black disabled:opacity-70"
                            style={{ backgroundColor: "#76ed77" }}
                        >
                            {loginLoading ? "Logger ind..." : "Log ind"}
                        </button>
                    </form>

                    <div className="mt-6">
                        <button
                            onClick={handleDiscordLogin}
                            className="w-full p-3 rounded font-medium text-white bg-[#5865F2] hover:bg-[#4752c4]"
                        >
                            Log ind med Discord
                        </button>
                    </div>

                    {loginMsg && <p className="mt-4 text-sm text-white/90">{loginMsg}</p>}
                </div>

                {/* Vertikal streg (kun desktop) */}
                <div className="hidden md:block w-px bg-gray-700"></div>

                {/* Højre side - Opret konto */}
                <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-6 text-center md:text-left">
                        Opret en gratis konto og kom i gang
                    </h2>
                    <form className="space-y-4" onSubmit={handleSignup}>
                        <input
                            type="text"
                            placeholder="Navn"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            className="w-full p-3 rounded bg-gray-800 border border-gray-600 text-white"
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            className="w-full p-3 rounded bg-gray-800 border border-gray-600 text-white"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Adgangskode"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className="w-full p-3 rounded bg-gray-800 border border-gray-600 text-white"
                            required
                        />
                        <button
                            type="submit"
                            disabled={signupLoading}
                            className="w-full p-3 rounded font-medium text-black disabled:opacity-70"
                            style={{ backgroundColor: "#89ff00" }}
                        >
                            {signupLoading ? "Opretter konto..." : "Opret konto"}
                        </button>
                    </form>

                    {signupMsg && <p className="mt-4 text-sm text-white/90">{signupMsg}</p>}
                </div>
            </div>
        </main>
    );
}
