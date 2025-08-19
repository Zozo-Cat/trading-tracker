// app/planer/fuld-matrix/FullMatrixClient.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FadeInWhenVisible from "../../_components/FadeInWhenVisible";


// Tema-farver
const COLORS = {
    bg: "#211d1d",
    cardBg: "#1a1717",
    border: "#2a2626",
    gold: "#D4AF37",
    green: "#76ed77",
    dim: "#a7a7a7",
    sub: "#cfcfcf",
};

// CTA hover glow
const CTA_GLOW =
    "transition-all hover:-translate-y-0.5 hover:shadow-[0_0_0_3px_rgba(118,237,119,0.35)] hover:ring-2 hover:ring-[#76ed77]/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/60";

type Cell = string | boolean; // true => ✅, false => ❌, string => tekst
type Row = { feature: string; free: Cell; premium: Cell; pro: Cell; note?: string };
type Section = { id: string; title: string; rows: Row[] };

const Check = ({ className = "" }) => (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${className}`} aria-hidden>
        <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
);
const Cross = ({ className = "" }) => (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${className}`} aria-hidden>
        <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
);

function CellValue({ value }: { value: Cell }) {
    if (value === true) return <Check className="text-[#76ed77]" />;
    if (value === false) return <Cross className="text-[#7a6f6f]" />;
    return <span className="text-white/90">{value}</span>;
}

function TableSection({ section }: { section: Section }) {
    return (
        <div
            id={section.id}
            className="rounded-2xl border shadow-sm overflow-x-auto scroll-mt-24"
            style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}
        >
            <div className="px-6 py-4 border-b" style={{ borderColor: COLORS.border }}>
                <h2 className="text-lg font-semibold" style={{ color: COLORS.gold }}>
                    {section.title}
                </h2>
            </div>
            <table className="w-full text-left">
                {/* Sticky header + række-hover */}
                <thead className="sticky top-0 z-10" style={{ backgroundColor: "#191616" }}>
                <tr className="text-sm">
                    <th className="px-6 py-3 font-semibold text-white">Funktion</th>
                    <th className="px-6 py-3 font-semibold text-white">Basis</th>
                    <th className="px-6 py-3 font-semibold" style={{ color: COLORS.gold }}>Premium</th>
                    <th className="px-6 py-3 font-semibold" style={{ color: COLORS.gold }}>Pro</th>
                    <th className="px-6 py-3 font-semibold text-white/80">Note</th>
                </tr>
                </thead>
                <tbody className="text-sm divide-y" style={{ borderColor: COLORS.border }}>
                {section.rows.map((r, i) => (
                    <tr key={i} className="align-top hover:bg-[#1f1b1b]/60 transition-colors">
                        <td className="px-6 py-3 text-white">{r.feature}</td>
                        <td className="px-6 py-3"><CellValue value={r.free} /></td>
                        <td className="px-6 py-3"><CellValue value={r.premium} /></td>
                        <td className="px-6 py-3"><CellValue value={r.pro} /></td>
                        <td className="px-6 py-3 text-[13px]" style={{ color: COLORS.sub }}>{r.note || ""}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

// ——— DATA ———
const SECTIONS: Section[] = [
    {
        id: "bruger",
        title: "[Bruger] Konto & Profil",
        rows: [
            { feature: "Opret/rediger profil", free: true, premium: true, pro: true },
            { feature: "Skift adgangskode", free: true, premium: true, pro: true },
            { feature: "Login med Discord + link/aflink", free: true, premium: true, pro: true },
            { feature: "Se plan & rolle", free: true, premium: true, pro: true },
            { feature: "Deltag/søg teams (kode/ID)", free: true, premium: true, pro: true },
            { feature: "Deltag/søg communities (kode/ID)", free: true, premium: true, pro: true },
            { feature: "Se teamliste i community", free: false, premium: true, pro: true },
            { feature: "Egen statistik", free: "Basis", premium: "Udvidet", pro: "Fuld" },
            { feature: "Egen handelslog", free: "Basis", premium: "Udvidet", pro: "Fuld" },
            { feature: "Eksport af egne data", free: false, premium: true, pro: true },
            { feature: "Affiliate panel", free: false, premium: true, pro: true },
        ],
    },
    {
        id: "teamleder",
        title: "[Teamleder] Teams & administration",
        rows: [
            { feature: "Opret team", free: "1 team", premium: "Flere", pro: "Flere", note: "Flere teams kan trigge community-oprettelse" },
            { feature: "Generer/ændre joinkode", free: true, premium: true, pro: true },
            { feature: "Tilføj/fjern medlemmer", free: true, premium: true, pro: true },
            { feature: "Se teamoversigt", free: "Basis", premium: "Udvidet", pro: "Fuld" },
            { feature: "Teamlogo & beskrivelse", free: true, premium: true, pro: true },
            { feature: "Aktivér/deaktivér bot (team)", free: "Basis", premium: "Flere features", pro: "Alle features" },
            { feature: "Konfigurer bot-indstillinger", free: "Basis", premium: "Flere kanaler", pro: "Uendelige kanaler" },
            { feature: "Opret team-challenges", free: "Basis", premium: "Flere typer", pro: "Alle typer" },
            { feature: "Se teamets performance", free: "Basis", premium: "Udvidet", pro: "Med medlemsscore" },
        ],
    },
    {
        id: "community",
        title: "[Communityleder] Communities",
        rows: [
            { feature: "Opret community", free: false, premium: true, pro: true },
            { feature: "Tilføj/fjern teams", free: false, premium: "Limit", pro: "Uendelig" },
            { feature: "Udpeg teamledere", free: false, premium: true, pro: true, note: "Skal være medlem af community" },
            { feature: "Tilføj/fjern medlemmer globalt", free: false, premium: true, pro: true },
            { feature: "Aktivér/deaktivér bot (community)", free: false, premium: "Flere features", pro: "Alle features" },
            { feature: "Globale bot-indstillinger", free: false, premium: "Flere kanaler", pro: "Uendelige kanaler" },
            { feature: "Opret globale challenges", free: false, premium: "Limit", pro: "Uendelig" },
            { feature: "Opret challenges på teamniveau", free: false, premium: true, pro: true },
            { feature: "Sæt teams som “uafhængige”", free: false, premium: false, pro: true },
            { feature: "Administrer planlimits", free: false, premium: "Plan-baseret", pro: "Maks" },
        ],
    },
    {
        id: "bot",
        title: "[Bot] Signaler & automatik",
        rows: [
            { feature: "Trading-signaler", free: "1 kanal", premium: "Flere kanaler", pro: "Uendelige kanaler" },
            { feature: "Manuel signalafsendelse", free: true, premium: true, pro: true },
            { feature: "Automatisk signalafsendelse", free: false, premium: true, pro: true },
            { feature: "P/L opsummering", free: "Måned", premium: "Uge/Måned", pro: "Dag/Uge/Måned" },
            { feature: "Automatisk recap", free: false, premium: true, pro: true },
            { feature: "Challenges-notifikationer", free: true, premium: true, pro: true },
            { feature: "Statistik-opdateringer", free: "Basis", premium: "Udvidet", pro: "Fuld" },
            { feature: "Differentier output pr. kanal", free: false, premium: true, pro: true },
            { feature: "Aktivér/deaktivér subfeatures", free: false, premium: true, pro: true },
            { feature: "Avancerede bot-regler (Pro+)", free: false, premium: false, pro: true, note: "Filtrering, automatisering" },
        ],
    },
    {
        id: "challenges",
        title: "[Challenges] Deltagelse & resultater",
        rows: [
            { feature: "Oversigt", free: true, premium: true, pro: true },
            { feature: "Tilmeld/frameld", free: true, premium: true, pro: true },
            { feature: "Fremdrift & resultater", free: "Basis", premium: "Udvidet", pro: "Fuld" },
            { feature: "Reminder-notifikationer", free: false, premium: true, pro: true },
        ],
    },
    {
        id: "mentor",
        title: "[Mentor/Coaching]",
        rows: [
            { feature: "Se mentorfeedback", free: false, premium: true, pro: true },
            { feature: "Mentorudfordringer", free: false, premium: true, pro: true },
            { feature: "Mentorgruppe-leaderboard", free: false, premium: true, pro: true },
            { feature: "Privat chat med mentor (valgfri)", free: false, premium: false, pro: true, note: "Kan slås til/fra af communityleder" },
            { feature: "Flere samtidige mentorforløb", free: false, premium: false, pro: true },
            { feature: "Eksklusive Pro-mentorer & events", free: false, premium: false, pro: true, note: "Interaktiv deltagelse" },
        ],
    },
    {
        id: "maal-gamification",
        title: "[Mål & Gamification]",
        rows: [
            { feature: "Opret personlige mål", free: "1 mål", premium: "Flere", pro: "Ubegrænset" },
            { feature: "Point/streaks/badges", free: false, premium: true, pro: true },
            { feature: "Leaderboard (team/community)", free: false, premium: true, pro: true },
        ],
    },
    {
        id: "support",
        title: "[Support]",
        rows: [
            { feature: "Kontaktformular", free: true, premium: true, pro: true },
            { feature: "Email-svar", free: "48t+", premium: "24t", pro: "Prioritet" },
            { feature: "Live chat support", free: false, premium: true, pro: true },
        ],
    },
    {
        id: "mobilapp",
        title: "[Mobilapp]",
        rows: [
            { feature: "Push-notifikationer", free: "Begrænset", premium: "Flere typer", pro: "Alle typer" },
            { feature: "“Jeg tog signalet” fra push", free: true, premium: true, pro: true },
            { feature: "App-dashboard (basis)", free: true, premium: true, pro: true },
            { feature: "App-dashboard (avanceret)", free: false, premium: true, pro: true },
            { feature: "Team/community-funktioner i app", free: "Basis", premium: "Flere", pro: "Alle" },
        ],
    },
    {
        id: "fremtidige",
        title: "[Fremtidige funktioner]",
        rows: [
            { feature: "Notifikationscenter", free: false, premium: true, pro: true },
            { feature: "Trading Goals", free: "1 mål", premium: "Flere", pro: "Ubegrænset" },
            { feature: "Weekly Digest", free: false, premium: "Basis", pro: "Fuld" },
            { feature: "Ressourcebibliotek", free: false, premium: true, pro: true },
            { feature: "Feature Preview / Early Access", free: false, premium: true, pro: true },
            { feature: "Trade Replay", free: false, premium: false, pro: true },
            { feature: "Community Leaderboard", free: false, premium: true, pro: true },
            { feature: "Interaktive Mentor Sessions", free: false, premium: false, pro: true },
        ],
    },
];

// TOC labels
const TOC = [
    { id: "bruger", label: "Bruger" },
    { id: "teamleder", label: "Teamleder" },
    { id: "community", label: "Community" },
    { id: "bot", label: "Bot" },
    { id: "challenges", label: "Challenges" },
    { id: "mentor", label: "Mentor" },
    { id: "maal-gamification", label: "Mål & Gamification" },
    { id: "support", label: "Support" },
    { id: "mobilapp", label: "Mobilapp" },
    { id: "fremtidige", label: "Fremtidige" },
];

export default function FullMatrixClient() {
    // Smooth scroll til hash + reduced motion
    useEffect(() => {
        const scrollToHash = () => {
            const hash = typeof window !== "undefined" ? window.location.hash : "";
            if (hash) {
                const el = document.querySelector(hash);
                if (el) {
                    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                    (el as HTMLElement).scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
                }
            }
        };
        scrollToHash();
        window.addEventListener("hashchange", scrollToHash);
        return () => window.removeEventListener("hashchange", scrollToHash);
    }, []);

    // Scrollspy til TOC
    const [active, setActive] = useState<string>("bruger");
    useEffect(() => {
        const opts = { root: null, rootMargin: "0px 0px -70% 0px", threshold: 0 };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting && (e.target as HTMLElement).id) setActive((e.target as HTMLElement).id);
            });
        }, opts);
        SECTIONS.forEach((s) => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    // Til-toppen knap
    const [showTop, setShowTop] = useState(false);
    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 300);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    const scrollToTop = () => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    };

    // Mobil kompaktvisning (kort i stedet for tabel)
    const [compact, setCompact] = useState(false);
    useEffect(() => {
        if (window.innerWidth < 640) setCompact(true);
    }, []);

    function CellBadge({ label, value, color }: { label: string; value: Cell; color: string }) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
                  style={{ borderColor: COLORS.border, color }}>
        {label}: <CellValue value={value} />
      </span>
        );
    }

    function CompactSection({ section }: { section: Section }) {
        return (
            <div id={section.id} className="scroll-mt-24">
                <div className="rounded-2xl border shadow-sm" style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}>
                    <div className="px-6 py-4 border-b" style={{ borderColor: COLORS.border }}>
                        <h2 className="text-lg font-semibold" style={{ color: COLORS.gold }}>{section.title}</h2>
                    </div>
                    <div className="p-4 grid gap-3">
                        {section.rows.map((r, i) => (
                            <div key={i} className="rounded-xl border p-4 hover:bg-[#1f1b1b]/60 transition-colors"
                                 style={{ borderColor: COLORS.border }}>
                                <div className="text-white font-medium">{r.feature}</div>
                                {r.note && <div className="text-xs mt-1" style={{ color: COLORS.sub }}>{r.note}</div>}
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <CellBadge label="Basis" value={r.free} color="#a7a7a7" />
                                    <CellBadge label="Premium" value={r.premium} color={COLORS.gold} />
                                    <CellBadge label="Pro" value={r.pro} color={COLORS.gold} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const tocItems = useMemo(() => TOC, []);

    return (
        <main className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
            <section className="mx-auto max-w-6xl px-6 py-12">
                {/* Header + mobil TOC toggle + kompakt-toggle */}
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold" style={{ color: COLORS.gold }}>
                            Fuld funktionsoversigt
                        </h1>
                        <Link
                            href="/planer"
                            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium text-white hover:bg-[#2a2626] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/70"
                            style={{ borderColor: COLORS.border }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Tilbage
                        </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Mobil TOC */}
                        <details className="sm:hidden">
                            <summary className="cursor-pointer rounded-xl border px-3 py-2 text-sm text-white hover:bg-[#2a2626]" style={{ borderColor: COLORS.border }}>
                                Sektioner
                            </summary>
                            <div className="mt-2 rounded-xl border p-2" style={{ borderColor: COLORS.border, backgroundColor: "#1b1818" }}>
                                <nav aria-label="Sektioner (mobil)" className="grid gap-1">
                                    {tocItems.map((t) => (
                                        <a
                                            key={t.id}
                                            href={`#${t.id}`}
                                            className={`rounded-md px-2 py-2 text-sm ${active === t.id ? "bg-[#2a2626] text-white" : "text-[#cfcfcf] hover:bg-[#2a2626]"}`}
                                        >
                                            {t.label}
                                        </a>
                                    ))}
                                </nav>
                            </div>
                        </details>

                        {/* Kompakt-toggle */}
                        <button
                            type="button"
                            onClick={() => setCompact((v) => !v)}
                            aria-pressed={compact}
                            className="rounded-xl border px-3 py-2 text-sm text-white hover:bg-[#2a2626] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/70"
                            style={{ borderColor: COLORS.border }}
                        >
                            {compact ? "Skift til tabelvisning" : "Skift til kompakt visning"}
                        </button>
                    </div>
                </div>

                <p className="mb-8 text-sm" style={{ color: COLORS.sub }}>
                    Detaljeret sammenligning af Basis, Premium og Pro — grupperet for overblik.
                </p>

                {/* Desktop TOC */}
                <aside className="hidden lg:block fixed right-[max(12px,calc((100vw-1152px)/2-220px))] top-28 w-48">
                    <nav aria-label="Sektioner (desktop)" className="rounded-xl border p-3" style={{ borderColor: COLORS.border, backgroundColor: "#1b1818" }}>
                        <div className="text-xs mb-2" style={{ color: COLORS.dim }}>Sektioner</div>
                        <ul className="space-y-1">
                            {tocItems.map((t) => (
                                <li key={t.id}>
                                    <a
                                        href={`#${t.id}`}
                                        className={`block rounded-md px-2 py-2 text-sm transition-colors ${
                                            active === t.id ? "bg-[#2a2626] text-white" : "text-[#cfcfcf] hover:bg-[#2a2626]"
                                        }`}
                                    >
                                        {t.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                {/* Sektioner (fade-in + sticky headers eller kompakt kortvisning) */}
                <div className="space-y-8">
                    {SECTIONS.map((s, i) => (
                        <FadeInWhenVisible key={s.id} delay={i * 0.05}>
                            {compact ? <CompactSection section={s} /> : <TableSection section={s} />}
                        </FadeInWhenVisible>
                    ))}
                </div>

                {/* Fast CTA i bunden med glow */}
                <div className="sticky bottom-4 mt-10">
                    <div
                        className="mx-auto max-w-6xl rounded-2xl border p-4 backdrop-blur supports-[backdrop-filter]:bg-white/5"
                        style={{ borderColor: COLORS.border, backgroundColor: "rgba(26,23,23,0.6)" }}
                    >
                        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                            <p className="text-sm" style={{ color: COLORS.sub }}>
                                Klar til at komme i gang? Få <span style={{ color: COLORS.gold }}>2 mdr. gratis</span> med årsplan.
                            </p>
                            <div className="flex gap-3">
                                <a
                                    href="/signup?plan=premium&billing=yearly"
                                    className={`rounded-xl px-4 py-2.5 font-semibold text-[#1b1b1b] hover:opacity-90 ${CTA_GLOW}`}
                                    style={{ backgroundColor: COLORS.green }}
                                >
                                    Vælg Premium
                                </a>
                                <a
                                    href="/signup?plan=pro&billing=yearly"
                                    className={`rounded-xl px-4 py-2.5 font-semibold text-[#1b1b1b] hover:opacity-90 ${CTA_GLOW}`}
                                    style={{ backgroundColor: COLORS.green }}
                                >
                                    Vælg Pro
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bund-link tilbage */}
                <div className="mt-8 text-center">
                    <Link
                        href="/planer"
                        className="inline-flex items-center gap-2 justify-center rounded-xl border px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2a2626] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/70"
                        style={{ borderColor: COLORS.border }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Tilbage til Planer & priser
                    </Link>
                </div>
            </section>

            {/* Til-toppen knap */}
            {showTop && (
                <button
                    onClick={scrollToTop}
                    aria-label="Til toppen"
                    className="fixed bottom-5 right-5 rounded-full bg-[#2a2626] p-3 text-white shadow-lg ring-1 ring-[#3a3535] hover:bg-[#332e2e] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/70 transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                </button>
            )}
        </main>
    );
}
