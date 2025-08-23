"use client";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function OrgBotLayout({
                                         children,
                                     }: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<div className="p-6">Indlæser…</div>}>
            {children}
        </Suspense>
    );
}
