"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Mentee } from "@/app/_components/MentorOverview";
import { useSession } from "next-auth/react";

const gold = "#D4AF37";
const border = "#3b3838";
const cardBg = "#2a2727";

/* ---------- localStorage helpers for ⭐ ---------- */
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

/** Outer page wrapped in Suspense (required for useSearchParams in Next.js app dir) */
export default function MenteesPage() {
    return (
        <Suspense fallback={<div className="p-6">Loading…</div>}>
            <MenteesInner />
        </Suspense>
    );
}

/** Actual client logic lives here */
function MenteesInner() {
    const { data: session } = useSession();
    const user = session?.user;
    const searchParams = useSearchParams();

    // Dummy data — replace with Supabase when /api/mentees is ready
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
    }, [view, sortDir, q, starred]);

    // highlight på ?focus=<id>
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

            {/* Controls — keep your existing controls / filters / search UI here */}

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((m) => (
                    <article
                        key={m.id}
                        data-mentee-id={m.id}
                        className="rounded-2xl p-4"
                        style={{ border: `1px solid ${border}`, background: cardBg, color: "#eee" }}
                    >
                        <div className="flex items-start justify-between">
                            <h3 className="font-semibold">{m.name}</h3>
                            <button
                                onClick={() => toggleStar(m.id)}
                                aria-label="toggle star"
                                className="ml-2 text-xl leading-none"
                                style={{ color: starred.includes(String(m.id)) ? gold : "#777" }}
                            >
                                ★
                            </button>
                        </div>
                        <div className="mt-1 text-sm" style={{ color: "#bbb" }}>
                            Winrate: <b style={{ color: gold }}>{m.winRate}%</b>
                        </div>
                        {m.tradingPlan?.length ? (
                            <ul className="mt-2 list-disc pl-5 text-sm" style={{ color: "#ccc" }}>
                                {m.tradingPlan.map((t, i) => (
                                    <li key={i}>{t}</li>
                                ))}
                            </ul>
                        ) : null}
                    </article>
                ))}
            </section>
        </div>
    );
}
