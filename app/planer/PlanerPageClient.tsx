// app/planer/PlanerPageClient.tsx
"use client";
import React from "react";
import Link from "next/link";
import FadeInWhenVisible from "../_components/FadeInWhenVisible";

export default function PlanerPageClient() {
    const [yearly, setYearly] = React.useState(false);
    const [showTop, setShowTop] = React.useState(false);

    React.useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 300);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Prices
    const price = { basic: 0, premium: 5, pro: 10 };
    const yearlyPrice = { premium: price.premium * 10, pro: price.pro * 10 }; // 2 mdr. gratis

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

    // Theme
    const bg = "bg-[#211d1d]";
    const textGold = "text-[#D4AF37]";
    const green = "text-[#76ed77]";
    const greenBg = "bg-[#76ed77]";
    const cardBg = "bg-[#1a1717]";
    const cardBorder = "border-[#2a2626]";
    const subText = "text-[#cfcfcf]";
    const dimText = "text-[#a7a7a7]";

    // CTA hover glow
    const ctaGlow =
        "transition-all hover:-translate-y-0.5 hover:shadow-[0_0_0_3px_rgba(118,237,119,0.35)] hover:ring-2 hover:ring-[#76ed77]/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/60";

    // Scroll to top (respektér reduced motion)
    const scrollToTop = () => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    };

    return (
        <main className={`min-h-screen ${bg}`}>
            <section className="mx-auto max-w-6xl px-6 py-14">
                {/* Header */}
                <header className="text-center mb-10">
                    <h1 className={`text-4xl font-bold tracking-tight ${textGold}`}>Planer & priser</h1>
                    <p className={`mt-3 ${subText}`}>Få mest værdi med Premium og Pro — 2 måneder gratis på årsplan.</p>
                </header>

                {/* Billing toggle */}
                <div className="mb-10 flex items-center justify-center gap-3" role="group" aria-label="Vælg betalingsperiode">
                    <span className={`text-sm ${!yearly ? "font-semibold text-white" : dimText}`}>Måned</span>
                    <button
                        type="button"
                        onClick={() => setYearly((v) => !v)}
                        aria-pressed={yearly}
                        aria-live="polite"
                        className="relative inline-flex h-8 w-16 items-center rounded-full bg-[#3a3535] transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/70"
                    >
            <span
                className={`absolute left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    yearly ? "translate-x-8" : "translate-x-0"
                }`}
            />
                    </button>
                    <span className={`text-sm ${yearly ? "font-semibold text-white" : dimText}`}>
            År{" "}
                        <span className="ml-1 rounded-full bg-[#2a3a2a] px-2 py-0.5 text-xs text-[#76ed77]">2 mdr. gratis</span>
          </span>
                </div>

                {/* Cards */}
                <FadeInWhenVisible>
                    <div className="grid gap-6 sm:grid-cols-3 items-stretch">
                        {/* Basic */}
                        <article className={`rounded-2xl border ${cardBorder} ${cardBg} shadow-sm flex flex-col`}>
                            <div className="p-6 flex-1 flex flex-col">
                                <h2 className="text-xl font-semibold text-white">Basis</h2>
                                <div className="mt-4 flex items-end gap-1 opacity-80">
                                    <span className="text-4xl font-bold text-white">€{price.basic}</span>
                                    <span className={`${dimText} text-sm`}>/ måned</span>
                                </div>
                                <ul className={`mt-6 space-y-2 text-sm ${dimText} flex-1`}>
                                    <li>✅ Kernedata (læseadgang)</li>
                                    <li>✅ 1 portefølje</li>
                                    <li>✅ Community-support</li>
                                </ul>
                                <div className="mt-8">
                                    <a
                                        href="/signup?plan=basic"
                                        className={`inline-flex w-full items-center justify-center rounded-xl border border-[#3a3535] bg-transparent px-4 py-2.5 font-medium text-white hover:bg-[#2a2626] ${ctaGlow}`}
                                    >
                                        Start gratis
                                    </a>
                                </div>
                            </div>
                        </article>

                        {/* Premium */}
                        <article className={`relative rounded-2xl border ${cardBorder} ${cardBg} shadow-sm ring-1 ring-[#5a4c1e] flex flex-col`}>
                            <div className="absolute -top-3 right-4 rounded-full bg-[#2a3a2a] px-3 py-1 text-xs font-semibold text-[#76ed77]">
                                Mest valgt
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <h2 className={`text-xl font-semibold ${textGold}`}>Premium</h2>
                                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-bold text-white">
                    {yearly ? `€${yearlyPrice.premium}` : `€${price.premium}`}
                  </span>
                                    <span className={`${dimText} text-sm`}>{yearly ? "/ år" : "/ måned"}</span>
                                </div>
                                {yearly && <p className="mt-1 text-xs text-[#c9f7d1]">Svarende til €{price.premium}/md. (2 mdr. gratis)</p>}
                                <ul className={`mt-6 space-y-2 text-sm ${subText} flex-1`}>
                                    <li className="flex items-center gap-2"><Check className={green} /> Real-time signaler (flere kanaler)</li>
                                    <li className="flex items-center gap-2"><Check className={green} /> Eksport + avancerede rapporter</li>
                                    <li className="flex items-center gap-2"><Check className={green} /> Teams & communities (limit)</li>
                                    <li className="flex items-center gap-2"><Check className={green} /> Udvidet statistik & handelslog</li>
                                    <li className="flex items-center gap-2"><Check className={green} /> E-mail support (24t)</li>
                                </ul>
                                <div className="mt-8">
                                    <a
                                        href={`/signup?plan=premium&billing=${yearly ? "yearly" : "monthly"}`}
                                        className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 font-semibold text-[#1b1b1b] hover:opacity-90 ${greenBg} ${ctaGlow}`}
                                    >
                                        Vælg Premium
                                    </a>
                                </div>
                            </div>
                        </article>

                        {/* Pro */}
                        <article className={`relative rounded-2xl border ${cardBorder} ${cardBg} shadow-sm ring-1 ring-[#D4AF37] flex flex-col`}>
                            <div className="absolute -top-3 right-4 rounded-full bg-[#3b2f10] px-3 py-1 text-xs font-semibold text-[#D4AF37]">
                                Maks værdi
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <h2 className={`text-xl font-semibold ${textGold}`}>Pro</h2>
                                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-bold text-white">
                    {yearly ? `€${yearlyPrice.pro}` : `€${price.pro}`}
                  </span>
                                    <span className={`${dimText} text-sm`}>{yearly ? "/ år" : "/ måned"}</span>
                                </div>
                                {yearly && <p className="mt-1 text-xs text-[#c9f7d1]">Svarende til €{price.pro}/md. (2 mdr. gratis)</p>}
                                <ul className={`mt-6 space-y-2 text-sm ${subText} flex-1`}>
                                    <li className="flex items-center gap-2"><Check className={green} /> Alt i Premium, PLUS:</li>
                                    <li className="flex items-center gap-2"><Check className={green} /> Ubegrænsede porteføljer & kanaler</li>
                                    <li className="flex items-center gap-2"><Check className={green} /> Avancerede bot-regler</li>
                                    <li className="flex items-center gap-2"><Check className={green} /> Community-styring (uendelige teams)</li>
                                    <li className="flex items-center gap-2"><Check className={green} /> Prioriteret support + live chat</li>
                                    <li className="flex items-center gap-2"><Check className={green} /> Mentor-features & Pro-events</li>
                                </ul>
                                <div className="mt-8">
                                    <a
                                        href={`/signup?plan=pro&billing=${yearly ? "yearly" : "monthly"}`}
                                        className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 font-semibold text-[#1b1b1b] hover:opacity-90 ${greenBg} ${ctaGlow}`}
                                    >
                                        Vælg Pro
                                    </a>
                                </div>
                            </div>
                        </article>
                    </div>
                </FadeInWhenVisible>

                {/* Nøgleforskelle */}
                <FadeInWhenVisible delay={0.1}>
                    <div className="mt-10 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-[#2a2626] bg-[#1a1717] p-5">
                            <p className="text-sm text-white font-semibold mb-2">Premium låser op</p>
                            <ul className={`text-sm ${subText} space-y-1`}>
                                <li className="flex items-center gap-2"><Check className={green} /> Real‑time signaler (flere kanaler)</li>
                                <li className="flex items-center gap-2"><Check className={green} /> Eksport & avancerede rapporter</li>
                                <li className="flex items-center gap-2"><Check className={green} /> Teams & communities (limit)</li>
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-[#2a2626] bg-[#1a1717] p-5">
                            <p className="text-sm text-white font-semibold mb-2">Pro giver mest</p>
                            <ul className={`text-sm ${subText} space-y-1`}>
                                <li className="flex items-center gap-2"><Check className={green} /> Ubegrænsede porteføljer & kanaler</li>
                                <li className="flex items-center gap-2"><Check className={green} /> Avancerede bot‑regler & automation</li>
                                <li className="flex items-center gap-2"><Check className={green} /> Mentor‑features & Pro‑events</li>
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-[#2a2626] bg-[#1a1717] p-5">
                            <p className="text-sm text-white font-semibold mb-2">Årsplan = besparelse</p>
                            <ul className={`text-sm ${subText} space-y-1`}>
                                <li className="flex items-center gap-2"><Check className={green} /> 2 mdr. gratis / år</li>
                                <li className="flex items-center gap-2"><Check className={green} /> €{yearlyPrice.premium} Premium · €{yearlyPrice.pro} Pro</li>
                                <li className="flex items-center gap-2"><Check className={green} /> Skift plan når som helst</li>
                            </ul>
                        </div>
                    </div>
                </FadeInWhenVisible>

                {/* Forkortet matrix (sticky header + række-hover) */}
                <FadeInWhenVisible delay={0.2}>
                    <div className="mt-12 overflow-x-auto rounded-2xl border border-[#2a2626] bg-[#1a1717] shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-[#191616] sticky top-0 z-10">
                            <tr className="text-sm">
                                <th className="px-6 py-4 font-semibold text-white">Nøglefordele</th>
                                <th className="px-6 py-4 font-semibold text-white">Basis</th>
                                <th className="px-6 py-4 font-semibold text-[#D4AF37]">Premium</th>
                                <th className="px-6 py-4 font-semibold text-[#D4AF37]">Pro</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2a2626] text-sm">
                            {[
                                ["Real‑time signaler (kanaler)", "1", "Flere", "Uendelige"],
                                ["Rapporter & eksport (CSV/PDF)", "❌", "✅", "✅"],
                                ["Porteføljer", "1", "3", "Ubegrænset"],
                                ["Community & teams", "❌", "✅ (limit)", "✅ (uendelig)"],
                                ["Avancerede bot‑regler", "❌", "❌", "✅"],
                                ["Mentor & events", "❌", "✅", "✅ (Pro‑eksklusivt)"],
                                ["Support SLA", "48t+", "24t", "Prioritet + live chat"],
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-[#1f1b1b]/60 transition-colors">
                                    <td className="px-6 py-4 text-white">{row[0]}</td>
                                    <td className="px-6 py-4 text-[#a7a7a7]">{row[1]}</td>
                                    <td className="px-6 py-4 text-[#76ed77]">{row[2]}</td>
                                    <td className="px-6 py-4 text-[#76ed77]">{row[3]}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </FadeInWhenVisible>

                {/* Link til fuld matrix */}
                <FadeInWhenVisible delay={0.25}>
                    <div className="mt-12 text-center">
                        <p className={`text-sm ${subText} mb-4`}>
                            Vil du se <strong className={textGold}>alle forskellene</strong> mellem planerne?
                        </p>
                        <Link
                            href="/planer/fuld-matrix#bot"
                            className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[#3a3535] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2a2626] ${ctaGlow}`}
                        >
                            Se fuld funktionsoversigt
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </FadeInWhenVisible>

                <p className="mt-8 text-center text-xs text-[#b6b6b6]">
                    Priser i EUR. Moms kan tilkomme afhængigt af land. Årspriser inkluderer 2 måneder gratis.
                </p>
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
