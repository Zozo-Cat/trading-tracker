// app/_components/MentorOverview.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDummySession } from "@/lib/dummyAuth";

export type Mentee = {
    id: string | number;
    name: string;
    winRate?: number;
    tradingPlan?: string[];
};

const gold = "#D4AF37";
const cardBg = "#2a2727";
const border = "#3b3838";

/* ---------- STARRED (fælles med /mentees) ---------- */
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

/* ---------- HJÆLPERE ---------- */
function padAtLeast<T>(arr: T[], minLen: number): T[] {
    if (!Array.isArray(arr) || arr.length === 0) return [];
    if (arr.length >= minLen) return arr;
    const out: T[] = [];
    for (let i = 0; i < minLen; i++) out.push(arr[i % arr.length]);
    return out;
}

/* ---------- Mini ring (STØRRE: 88x88) ---------- */
function MiniRing({ value }: { value: number }) {
    const r = 30; // vi bevarer geometri og skalerer via width/height
    const c = 2 * Math.PI * r;
    const v = Math.max(0, Math.min(100, value));
    const dash = (v / 100) * c;
    return (
        <svg width="88" height="88" viewBox="0 0 72 72" aria-label={`${v}%`}>
            <circle cx="36" cy="36" r={r} stroke="#3b3838" strokeWidth="6" fill="none" />
            <circle
                cx="36" cy="36" r={r}
                stroke={gold} strokeWidth="6" fill="none"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeLinecap="round"
                transform="rotate(-90 36 36)"
            />
            <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill={gold}>
                {Math.round(v)}%
            </text>
        </svg>
    );
}

/* ---------- CARD VISUAL (LAVERE HØJDE) ---------- */
function CardVisual({ m, isStar }: { m: Required<Mentee>; isStar: (id: string | number) => boolean }) {
    const star = isStar(m.id);
    return (
        <div
            className="rounded-xl border p-4 flex flex-col h-full"
            style={{ background: cardBg, borderColor: border, minHeight: 180 }} // 220 -> 180
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <div className="font-semibold text-white truncate text-[1.05rem]">{m.name}</div>
                        {star && (
                            <span
                                className="text-[10px] leading-none px-2 py-0.5 rounded border shrink-0"
                                style={{ borderColor: gold, color: gold }}
                                title="Stjernemarkeret mentee"
                            >
                ⭐
              </span>
                        )}
                    </div>
                    {m.tradingPlan.length ? (
                        <ul className="mt-2 text-sm text-gray-300 list-disc list-inside space-y-1">
                            {m.tradingPlan.slice(0, 3).map((r, idx) => (
                                <li key={idx} className="truncate">
                                    {r}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="mt-2 text-sm text-gray-400">Ingen tradingplan angivet.</div>
                    )}
                </div>
                <MiniRing value={m.winRate} />
            </div>
            <div className="mt-auto pt-4 flex items-center justify-end">
                <a
                    href={`/mentees?focus=${encodeURIComponent(String(m.id))}`}
                    className="text-xs hover:underline"
                    style={{ color: gold }}
                >
                    Se noter →
                </a>
            </div>
        </div>
    );
}

/* ---------- ENKELT KORT SOM RULLER FRA HØJRE (flip‑buffer) ---------- */
function CardRoller({
                        list,
                        startIndex = 0,
                        autoRotateMs,
                        isStar,
                        slideMs = 650,
                    }: {
    list: Required<Mentee>[];
    startIndex?: number;
    autoRotateMs: number;
    isStar: (id: string | number) => boolean;
    slideMs?: number;
}) {
    const L = list.length;
    const [idx, setIdx] = useState(startIndex % (L || 1));
    const [anim, setAnim] = useState(false);
    const [frontIsA, setFrontIsA] = useState(true); // true: A er synlig; false: B er synlig

    const loopTimerRef = useRef<number | null>(null);
    const commitTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!autoRotateMs || autoRotateMs < 300 || L <= 1) return;

        const runCycle = () => {
            setAnim(true); // start glide (front -> -100%, back -> 0)
            commitTimerRef.current = window.setTimeout(() => {
                // efter glidet: byt roller og gå til næste index UDEN transition
                setAnim(false);
                setIdx((i) => (i + 1) % L);
                setFrontIsA((v) => !v);

                const rest = Math.max(0, autoRotateMs - slideMs);
                loopTimerRef.current = window.setTimeout(runCycle, rest);
            }, slideMs);
        };

        // første start efter præcis autoRotateMs
        loopTimerRef.current = window.setTimeout(runCycle, autoRotateMs);

        return () => {
            if (loopTimerRef.current) window.clearTimeout(loopTimerRef.current);
            if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
            loopTimerRef.current = null;
            commitTimerRef.current = null;
        };
    }, [autoRotateMs, L, slideMs]);

    if (!L) {
        return (
            <div className="rounded-xl border p-4" style={{ background: cardBg, borderColor: border, minHeight: 180 }}>
                <div className="text-sm text-gray-400">Ingen at vise endnu.</div>
            </div>
        );
    }

    const curr = list[idx];
    const next = list[(idx + 1) % L];

    const contentA = frontIsA ? curr : next;
    const contentB = frontIsA ? next : curr;

    // Transform-regler:
    // - Når anim=false: front står på 0%, back står på +100% (klar udenfor).
    // - Når anim=true: front glider til -100%, back glider ind til 0%.
    const transformA = anim ? (frontIsA ? "translate3d(-100%,0,0)" : "translate3d(0,0,0)")
        : (frontIsA ? "translate3d(0,0,0)"      : "translate3d(100%,0,0)");
    const transformB = anim ? (frontIsA ? "translate3d(0,0,0)"      : "translate3d(-100%,0,0)")
        : (frontIsA ? "translate3d(100%,0,0)"   : "translate3d(0,0,0)");

    const transition = anim ? `transform ${slideMs}ms cubic-bezier(.22,.61,.36,1)` : "none";

    return (
        <div className="relative overflow-hidden rounded-xl" style={{ minHeight: 180 }}> {/* 220 -> 180 */}
            {/* LAG A */}
            <div className="absolute inset-0" style={{ transform: transformA, transition }}>
                <CardVisual m={contentA} isStar={isStar} />
            </div>
            {/* LAG B */}
            <div className="absolute inset-0" style={{ transform: transformB, transition }}>
                <CardVisual m={contentB} isStar={isStar} />
            </div>
        </div>
    );
}

/* ---------- HOVEDKOMPONENT ---------- */
export default function MentorOverview({
                                           mentees,
                                           perPage = 2,
                                           topThreshold = 80,
                                           supportThreshold = 50,
                                           titleTop = "Topperformere",
                                           titleSupport = "Brug for støtte",
                                           autoRotateMs = 5000, // stadig 5 sekunder
                                       }: {
    mentees: Mentee[];
    perPage?: number;
    topThreshold?: number;
    supportThreshold?: number;
    titleTop?: string;
    titleSupport?: string;
    autoRotateMs?: number;
}) {
    const { user } = useDummySession();

    /* --- STARRED --- */
    const [starred, setStarred] = useState<string[]>([]);
    useEffect(() => {
        setStarred(loadStars(user?.id));
        const onStorage = (e: StorageEvent) => {
            if (e.key === keyFor(user?.id)) setStarred(loadStars(user?.id));
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [user?.id]);
    const isStar = (id: string | number) => starred.includes(String(id));

    /* --- NORMALISÉR --- */
    const normalized = useMemo(() => {
        const list = Array.isArray(mentees) ? mentees : [];
        return list.map((m) => ({
            id: m.id,
            name: m.name,
            winRate: Math.max(0, Math.min(100, Number(m.winRate ?? 0))),
            tradingPlan: Array.isArray(m.tradingPlan) ? m.tradingPlan : [],
        }));
    }, [mentees]);

    /* --- FILTRÉR + FALLBACK --- */
    let top = normalized.filter((m) => m.winRate >= topThreshold);
    let support = normalized.filter((m) => m.winRate <= supportThreshold);

    const usingStarTopFlag = top.length === 0 && normalized.some((m) => isStar(m.id));
    const usingStarSupFlag = support.length === 0 && normalized.some((m) => isStar(m.id));

    if (usingStarTopFlag) top = normalized.filter((m) => isStar(m.id)).sort((a, b) => b.winRate - a.winRate);
    else top = top.sort((a, b) => b.winRate - a.winRate);

    if (usingStarSupFlag) support = normalized.filter((m) => isStar(m.id)).sort((a, b) => a.winRate - b.winRate);
    else support = support.sort((a, b) => a.winRate - b.winRate);

    if (top.length === 0 && normalized.length) top = [...normalized].sort((a, b) => b.winRate - a.winRate);
    if (support.length === 0 && normalized.length) support = [...normalized].sort((a, b) => a.winRate - b.winRate);

    // mindst 2 kandidater pr. sektion så vi kan rulle
    top = padAtLeast(top, 2);
    support = padAtLeast(support, 2);

    /* --- VIEW: to kolonner med to rullere i hver --- */
    const Section = ({ title, usingStars, list }: { title: string; usingStars: boolean; list: Required<Mentee>[] }) => {
        const multi = list.length > 1;
        return (
            <section className="rounded-2xl p-5 border" style={{ borderColor: border, background: "#211f1f" }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{title}</h3>
                        {usingStars && (
                            <span className="text-[11px] px-2 py-0.5 rounded border" style={{ borderColor: gold, color: gold }}
                                  title="Ingen opfyldte grænser – viser stjernemarkerede i stedet">⭐ Favoritter</span>
                        )}
                    </div>
                    {multi && <div className="text-xs text-gray-400">Auto‑rul aktiv</div>}
                </div>

                {list.length === 0 ? (
                    <div className="text-sm text-gray-400">Ingen at vise endnu.</div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <CardRoller list={list} startIndex={0} autoRotateMs={autoRotateMs} isStar={isStar} />
                        <CardRoller list={list} startIndex={1} autoRotateMs={autoRotateMs} isStar={isStar} />
                    </div>
                )}

                <div className="mt-4 flex items-center justify-between text-xs">
                    <a href="/mentees" className="hover:underline" style={{ color: gold }}>
                        Se alle mentees & noter
                    </a>
                </div>
            </section>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            <Section title={titleTop} usingStars={usingStarTopFlag} list={top as Required<Mentee>[]} />
            <Section title={titleSupport} usingStars={usingStarSupFlag} list={support as Required<Mentee>[]} />
        </div>
    );
}
