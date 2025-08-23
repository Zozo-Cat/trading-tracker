"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Props = {
    pageTitle?: string;
    defaultSide?: "login" | "signup";
};

export default function AuthCombined({ pageTitle = "", defaultSide = "signup" }: Props) {
    const router = useRouter();

    // UI: aktiv side
    const [active, setActive] = useState<"login" | "signup">(defaultSide);

    // Login state
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginMsg, setLoginMsg] = useState<string | null>(null);

    // Signup state
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [signupAccept, setSignupAccept] = useState(false);
    const [signupIs18, setSignupIs18] = useState(false);
    const [signupLoading, setSignupLoading] = useState(false);
    const [signupMsg, setSignupMsg] = useState<string | null>(null);
    const [signupError, setSignupError] = useState<string | null>(null);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoginLoading(true);
        setLoginMsg(null);

        const { error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: loginPassword,
        });

        if (error) {
            setLoginMsg("Kunne ikke logge ind: " + error.message);
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
        setSignupError(null);

        if (!signupIs18) {
            setSignupError("Du skal bekræfte, at du er 18+.");
            setSignupLoading(false);
            return;
        }
        if (!signupAccept) {
            setSignupError("Du skal acceptere vilkår, privatliv og cookies.");
            setSignupLoading(false);
            return;
        }

        const { error } = await supabase.auth.signUp({
            email: signupEmail,
            password: signupPassword,
            options: {
                // gem attestation (ikke fødselsdato)
                data: { is18: true, age_attested_at: new Date().toISOString() },
            },
        });

        if (error) {
            setSignupMsg("Kunne ikke oprette konto: " + error.message);
        } else {
            setSignupMsg("Konto oprettet! Tjek venligst din email for at bekræfte kontoen.");
        }
        setSignupLoading(false);
    }

    async function handleDiscordLogin() {
        const origin = typeof window !== "undefined" ? window.location.origin : undefined;
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "discord",
            options: {
                // Første gang efter OAuth: send til 18+ attestation
                redirectTo: origin ? `${origin}/age-check` : undefined,
            },
        });
        if (error) setLoginMsg(error.message);
    }

    return (
        <main className="min-h-screen bg-[#211d1d] text-[#D4AF37] flex justify-center items-start pt-6 pb-2 px-4">
            <div className="w-full max-w-5xl">
                {pageTitle ? (
                    <div className="mb-4 text-center">
                        <h1 className="text-lg sm:text-xl text-[#D4AF37]">{pageTitle}</h1>
                    </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-stretch">
                    {/* Login */}
                    <div className="bg-[#1a1818] rounded-xl border border-[#3b3838] p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Log ind</h2>
                            <button
                                className={`text-xs px-2 py-1 rounded border ${active === "login" ? "opacity-100" : "opacity-60"}`}
                                style={{ borderColor: "#D4AF37", color: "#D4AF37" }}
                                onClick={() => setActive("login")}
                            >
                                Vælg
                            </button>
                        </div>

                        <form className="space-y-4 flex-1" onSubmit={handleLogin}>
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

                        <div className="mt-4">
                            <button
                                onClick={handleDiscordLogin}
                                className="w-full p-3 rounded font-medium text-white bg-[#5865F2] hover:bg-[#4752c4]"
                            >
                                Log ind med Discord
                            </button>
                        </div>

                        {loginMsg && <p className="mt-3 text-sm text-white/90">{loginMsg}</p>}
                    </div>

                    {/* Streg */}
                    <div className="hidden md:block w-px bg-gray-700" />

                    {/* Signup */}
                    <div className="bg-[#1a1818] rounded-xl border border-[#3b3838] p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Opret konto</h2>
                            <button
                                className={`text-xs px-2 py-1 rounded border ${active === "signup" ? "opacity-100" : "opacity-60"}`}
                                style={{ borderColor: "#D4AF37", color: "#D4AF37" }}
                                onClick={() => setActive("signup")}
                            >
                                Vælg
                            </button>
                        </div>

                        <form className="space-y-4 flex-1" onSubmit={handleSignup}>
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

                            {/* 18+ attestation */}
                            <label className="flex items-start gap-2 text-sm text-gray-200">
                                <input
                                    type="checkbox"
                                    className="mt-1"
                                    checked={signupIs18}
                                    onChange={(e) => setSignupIs18(e.target.checked)}
                                    required
                                />
                                <span>Jeg bekræfter, at jeg er 18 år eller derover.</span>
                            </label>

                            {/* Vilkår/privatliv/cookies */}
                            <label className="flex items-start gap-2 text-sm text-gray-200">
                                <input
                                    type="checkbox"
                                    className="mt-1"
                                    checked={signupAccept}
                                    onChange={(e) => setSignupAccept(e.target.checked)}
                                    required
                                />
                                <span>
                  Jeg accepterer{" "}
                                    <Link href="/vilkar" className="underline text-[#76ED77]">vilkår</Link>,{" "}
                                    <Link href="/privatliv" className="underline text-[#76ED77]">privatliv</Link>{" "}
                                    og <Link href="/cookies" className="underline text-[#76ED77]">cookies</Link>.
                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={signupLoading}
                                className="w-full p-3 rounded font-medium text-black disabled:opacity-70"
                                style={{ backgroundColor: "#89ff00" }}
                            >
                                {signupLoading ? "Opretter konto..." : "Opret konto"}
                            </button>

                            {signupError && <p className="text-sm text-red-400">{signupError}</p>}
                        </form>

                        <div className="mt-4">
                            <button
                                onClick={handleDiscordLogin}
                                className="w-full p-3 rounded font-medium text-white bg-[#5865F2] hover:bg-[#4752c4]"
                            >
                                Opret med Discord
                            </button>
                        </div>

                        {signupMsg && <p className="mt-3 text-sm text-white/90">{signupMsg}</p>}
                    </div>
                </div>
            </div>
        </main>
    );
}
