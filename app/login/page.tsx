"use client";

import AuthCombined from "@/app/_components/AuthCombined";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/app/_components/Providers";

export default function LoginPage() {
    const session = useSession();
    const router = useRouter();
    const sp = useSearchParams();
    const cb = sp.get("callbackUrl");

    useEffect(() => {
        if (session) {
            // Hvis login-siden besøges med aktiv session, send til callback eller dashboard
            try {
                router.replace(cb ? decodeURIComponent(cb) : "/dashboard");
            } catch {
                router.replace(cb || "/dashboard");
            }
        }
    }, [session, router, cb]);

    return <AuthCombined pageTitle="Log ind / Opret konto" defaultSide="login" />;
}
