// app/login/page.tsx
"use client";

import React, { Suspense, useEffect } from "react";
import AuthCombined from "@/app/_components/AuthCombined";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/app/_components/Providers";

export const dynamic = "force-dynamic"; // undgå prerender-issues på siden

function LoginInner() {
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

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginInner />
        </Suspense>
    );
}
