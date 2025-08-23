"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AgeCheckPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [is18, setIs18] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [needsCheck, setNeedsCheck] = useState(false);

    useEffect(() => {
        (async () => {
            const { data } = await supabase.auth.getSession();
            const u = data.session?.user;
            if (!u) {
                router.replace("/signup");
                return;
            }
            const ok = (u.user_metadata as any)?.is18 === true;
            if (ok) {
                router.replace("/");
            } else {
                setNeedsCheck(true);
                setLoading(false);
            }
        })();
    }, [router]);

    async function submit() {
        setError(null);
        if (!is18) {
            setError("Du skal bekræfte, at du er 18+.");
            return;
        }
        const { error: updErr } = await supabase.auth.updateUser({
            data: { is18: true, age_attested_at: new Date().toISOString() },
        });
        if (updErr) {
            setError(updErr.message);
            return;
        }
        router.replace("/");
    }

    if (loading) {
        return (
            <main className="min-h-[60vh] bg-[#211d1d] text-[#D4AF37] flex items-center justify-center">
                <div>Henter…</div>
            </main>
        );
    }

    if (!needsCheck) return null;

    return (
        <main className="min-h-screen bg-[#211d1d] text-[#D4AF37] flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-[#1a1818] rounded-xl shadow-lg p-8 border border-[#3b3838]">
                <h1 className="text-2xl font-bold mb-2">Aldersbekræftelse</h1>
                <p className="text-gray-300 mb-6">
                    Bekræft, at du er mindst 18 år for at fortsætte.
                </p>

                <label className="flex items-start gap-2 text-sm text-gray-200 mb-4">
                    <input
                        type="checkbox"
                        className="mt-1"
                        checked={is18}
                        onChange={(e) => setIs18(e.target.checked)}
                        required
                    />
                    <span>Jeg bekræfter, at jeg er 18 år eller derover.</span>
                </label>

                <button
                    onClick={submit}
                    className="w-full p-3 rounded font-medium text-black"
                    style={{ backgroundColor: "#76ED77" }}
                >
                    Bekræft
                </button>

                {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
            </div>
        </main>
    );
}
