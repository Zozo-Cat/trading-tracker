// app/_components/CookieConsent.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "tt_cookie_consent_v1";

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        try {
            const v = localStorage.getItem(KEY);
            if (!v) setVisible(true);
        } catch {}
    }, []);

    function acceptAll() {
        try { localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), choice: "all" })); } catch {}
        setVisible(false);
    }

    function acceptEssential() {
        try { localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), choice: "essential" })); } catch {}
        setVisible(false);
    }

    if (!visible) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-50">
            <div className="mx-auto max-w-7xl px-4 py-4">
                <div className="rounded-xl border border-[#3b3838] bg-[#1a1818]/95 backdrop-blur p-4 text-sm text-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div className="leading-relaxed">
                        Vi bruger cookies til at få siden til at virke og forbedre oplevelsen. Læs mere i{" "}
                        <Link href="/cookies" className="underline text-[#76ED77]">Cookiepolitik</Link>{" "}
                        og <Link href="/privatliv" className="underline text-[#76ED77]">Privatliv</Link>.
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={acceptEssential}
                            className="px-3 py-2 rounded-lg border"
                            style={{ borderColor: "#D4AF37", color: "#D4AF37" }}
                        >
                            Kun nødvendige
                        </button>
                        <button
                            onClick={acceptAll}
                            className="px-3 py-2 rounded-lg text-black font-medium"
                            style={{ backgroundColor: "#76ED77" }}
                        >
                            Accepter alle
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
