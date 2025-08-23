// app/config/(sections)/org-bot/create/page.tsx
import { Suspense } from "react";
import ClientInner from "./ClientInner";

export const dynamic = "force-dynamic"; // undgår SSG-prerender issues på Vercel

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading…</div>}>
            <ClientInner />
        </Suspense>
    );
}
