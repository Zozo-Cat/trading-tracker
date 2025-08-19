// app/mentees/page.tsx
import { Suspense } from "react";

// Server-komponent (må IKKE kalde useSearchParams)
// Wrapper Client-delen i <Suspense> for at undgå CSR-bailout fejlen ved build.
export default function MenteesPage() {
    return (
        <Suspense fallback={<div className="p-6">Loader mentees…</div>}>
            <MenteesClient />
        </Suspense>
    );
}

/* ---------------------- Client-del nedenfor ---------------------- */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Mentee } from "@/app/_components/MentorOverview";
import { useSession } from "next-auth/react";

const gold = "#D4AF37";
const border = "#3b3838";
const cardBg = "#2a2727";

function keyFor(uid?: string) {
    return `tt_starred_mentees_${uid || "anon"}`;
}
function loadStars(uid?: string): string[] {
    try {
        const raw = localStorage.getItem(keyFor(uid));
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr.map(String) : [];
    } catch {
        return [];
    }
}
function saveStars(ids: string[], uid?: string) {
    try {
        localStorage.setItem(keyFor(uid), JSON.stringify([...new Set(ids)]));
    } catch {}
}

export function MenteesClient() {
    const { data: session } = useSession();
    const user = session?.user;
    const searchParams = useSearchParams();

    // Dummy data – i produktion hentes fra Supabase
    const mentees: Mentee[] = [
        { id: "m1", name: "Amalie N.", winRate: 86, tradingPlan: ["Tag profit ved TP1", "Ingen news-trades"] },
        { id: "m2", name: "Jonas P.", winRate: 43, tradingPlan: ["Max 2 samtidige trades"] },
        { id: "m3", name: "Lars Ø.", winRate: 72, tradingPlan: ["Kun London session", "BE efter 1R"] },
        { id: "m4", name: "Signe K.", winRate: 91, tradingPlan: ["Kun A-setup", "Risk 0.5%"] },
        { id: "m5", name: "Noah B.", winRate: 49, tradingPlan: ["Ingen revenge trades"] },
        { id: "m6", name: "Oliver S.", winRate: 64, tradingPlan: ["Breakout kun på H1"] },
        { id: "m7", name: "Eva D.", winRate: 82, tradingPlan: ["Nyheder = sidelinjen"] },
    ];

    const [view, setView] = useState<"all" | "top" | "support" | "starred">("all");
    const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
    const [q, setQ] = useState("");
    const [starred, setStarred] = useState<string[]>([]);

    useEffect(() => {
        setStarred(loadStars(user?.id as string));
    }, [user?.id]);

    const toggleStar = (id: string | number) => {
        const s = String(id);
        setStarred((prev) => {
            const next = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s];
            saveStars(next, user?.id as string);
            return next;
        });
    };

    const filtered = useMemo(() => {
        let arr = mentees.slice();
        if (view === "top") arr = arr.filter((m) => m.winRate >= 80);
        if (view === "support") arr = arr.filter((m) => m.winRate <= 50);
        if (view === "starred") arr = arr.filter((m) => starred.includes(String(m.id)));
        if (q.trim()) {
            const qq = q.trim().toLowerCase();
            arr = arr.filter((m) => m.name.toLowerCase().includes(qq));
        }
        arr.sort((a, b) => (sortDir === "desc" ? b.winRate - a.winRate : a.winRate - b.winRate));
        return arr;
    }, [mentees, view, sortDir, q, starred]);

    // highlight på ?focus=id
    useEffect(() => {
        const focus = searchParams.get("focus");
        if (!focus) return;
        requestAnimationFrame(() => {
            const el = document.querySelector(`[data-mentee-id="${CSS.escape(focus)}"]`);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                (el as HTMLElement).style.outline = `2px solid ${gold}`;
                setTimeout(() => ((el as HTMLElement).style.outline = ""), 1500);
            }
        });
    }, [searchParams]);

    return (
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
            <header className="flex items-center justify-between">
                <h1 className="text-2xl font-bold" style={{ color: gold }}>
                    Mentees
                </h1>
                <a href="/dashboard" className="text-sm hover:underline" style={{ color: gold }}>
                    ← Tilbage til dashboard
                </a>
            </header>

            {/* Controls */}
            {/* … (behold resten af din rendering uændret) … */}
        </div>
    );
}
