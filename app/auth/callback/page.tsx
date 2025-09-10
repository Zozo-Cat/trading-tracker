"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/app/_components/Providers";

export default function AuthCallbackPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const session = useSession();
    const next = sp.get("next") || "/dashboard";

    useEffect(() => {
        // Når session er tilgængelig i client, hopper vi videre.
        if (session !== null) {
            router.replace(next);
        }
    }, [session, router, next]);

    return (
        <div style={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
            <div>
                <p style={{ color: "#D4AF37" }}>Behandler login…</p>
            </div>
        </div>
    );
}
