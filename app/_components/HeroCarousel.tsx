"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Slide = {
    id: string;
    title: string;
    sub: string;
    ctaText: string;
    ctaHref: string;
    desktop: string;
    mobile: string;
    priority?: boolean;
    strongerScrim?: boolean;         // (fra før) – stærkere venstre gradient
    textPanel?: boolean;             // NYT: lille panel bag teksten
    desktopPosition?: string;        // NYT: fx "80% center" for at skubbe motivet
    mobilePosition?: string;         // NYT
};

const slides: Slide[] = [
    {
        id: "sync",
        title: "Synk dine handler automatisk – uden Excel.",
        sub: "MT4/MT5 og integrationer – ind på få minutter. Fuld historik, filtrering og dashboards.",
        ctaText: "Kom i gang",
        ctaHref: "/signup",
        desktop: "/hero/slide-sync-desktop.webp",
        mobile: "/hero/slide-sync-mobile.webp",
        priority: true,
    },
    {
        id: "community",
        title: "Byg dit community – med eller uden Discord.",
        sub: "Teams, kanaler og signaler. Brug det indbyggede community — og tilslut Discord, når du vil.",
        ctaText: "Se muligheder",
        ctaHref: "/partnere",
        desktop: "/hero/slide-community-desktop.webp",
        mobile: "/hero/slide-community-mobile.webp",
        strongerScrim: true, // kraftigere scrim her
    },
    {
        id: "plan",
        title: "Hold din plan — bliv bedre hver uge.",
        sub: "Tradingplan & scorecards, personlige mål og adfærdsbaserede anbefalinger.",
        ctaText: "Byg min plan",
        ctaHref: "/signup",
        desktop: "/hero/slide-plan-desktop.webp",
        mobile: "/hero/slide-plan-mobile.webp",
    },
    {
        id: "security",
        title: "Sikkerhed først.",
        sub: "Stærke adgangskoder, step-up (PIN/2FA) og fuld kontrol over dine nøgler.",
        ctaText: "Se hvordan",
        ctaHref: "/nyheder",
        desktop: "/hero/slide-security-desktop.webp",
        mobile: "/hero/slide-security-mobile.webp",
    },
    {
        id: "alerts",
        title: "Altid besked om det, der betyder noget.",
        sub: "Nye handler, TP/SL, ændringer — til web, e-mail eller Discord.",
        ctaText: "Aktivér alerts",
        ctaHref: "/nyheder",
        desktop: "/hero/slide-alerts-desktop.webp",
        mobile: "/hero/slide-alerts-mobile.webp",
        // ↓↓↓ NYT kun for alerts:
        desktopPosition: "85% center",  // skub motivet mod højre
        mobilePosition: "center",
        textPanel: true,                // diskret panel bag tekst
        // strongerScrim: false (default scrim = pænere overgang)
    },
];

export default function HeroCarousel() {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (paused) return;
        const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4000);
        return () => clearInterval(id);
    }, [paused]);

    const go = (dir: 1 | -1) => setIndex((i) => (i + dir + slides.length) % slides.length);

    const textShadow = "0 2px 12px rgba(0,0,0,.60), 0 1px 2px rgba(0,0,0,.45)";

    return (
        <section
            className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="relative h-[360px] sm:h-[420px] md:h-[480px] lg:h-[520px]">
                <div
                    className="absolute inset-0 flex transition-transform duration-500 ease-out"
                    style={{ width: `${slides.length * 100}%`, transform: `translateX(-${index * (100 / slides.length)}%)` }}
                >
                    {slides.map((s, i) => {
                        const desktopScrim = s.strongerScrim ? "left-0 w-1/2 from-black/85" : "left-0 w-2/5 from-black/70";
                        const mobileScrim  = s.strongerScrim ? "from-black/85 h-2/5" : "from-black/75 h-1/3";

                        return (
                            <article key={s.id} className="relative w-full" style={{ width: `${100 / slides.length}%` }}>
                                {/* Desktop billede */}
                                <div className="absolute inset-0 hidden sm:block">
                                    <Image
                                        src={s.desktop}
                                        alt={s.title}
                                        fill
                                        sizes="100vw"
                                        quality={90}
                                        priority={i === 0 && !!s.priority}
                                        className="object-cover"
                                        // ↓↓↓ NYT: flyt motivet for bedre venstreside til tekst
                                        style={{ objectPosition: s.desktopPosition ?? "center" }}
                                    />
                                    <div className={`pointer-events-none absolute inset-y-0 ${desktopScrim} bg-gradient-to-r to-transparent`} />
                                </div>

                                {/* Mobil billede */}
                                <div className="absolute inset-0 sm:hidden">
                                    <Image
                                        src={s.mobile}
                                        alt={s.title}
                                        fill
                                        sizes="100vw"
                                        quality={90}
                                        priority={i === 0 && !!s.priority}
                                        className="object-cover"
                                        style={{ objectPosition: s.mobilePosition ?? "center" }}
                                    />
                                    <div className={`pointer-events-none absolute top-0 inset-x-0 ${mobileScrim} bg-gradient-to-b to-transparent`} />
                                </div>

                                {/* Tekst / CTA */}
                                <div className="absolute inset-0">
                                    <div className="h-full mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 flex flex-col justify-center">
                                        {/* Panel kun når textPanel=true */}
                                        <div className={s.textPanel ? "max-w-xl bg-black/35 backdrop-blur-[2px] ring-1 ring-white/5 rounded-xl p-4 sm:p-6" : "max-w-xl"}>
                                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{ textShadow }}>
                                                {s.title}
                                            </h2>
                                            <p className="mt-2 text-sm sm:text-base text-gray-100" style={{ textShadow }}>
                                                {s.sub}
                                            </p>
                                            <div className="mt-3">
                                                <Link
                                                    href={s.ctaHref}
                                                    className="inline-block px-4 py-2 rounded-lg text-black font-medium"
                                                    style={{ backgroundColor: "#76ED77" }}
                                                >
                                                    {s.ctaText}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>

                {/* Prev / Next */}
                <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="Forrige slide"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 bg-black/30 hover:bg-black/40"
                >
                    ‹
                </button>
                <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="Næste slide"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 bg-black/30 hover:bg-black/40"
                >
                    ›
                </button>

                {/* Dots */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                    {slides.map((s, i) => (
                        <button
                            key={s.id}
                            onClick={() => setIndex(i)}
                            aria-label={`Gå til slide ${i + 1}`}
                            className={`h-2.5 w-2.5 rounded-full ${i === index ? "bg-[#D4AF37]" : "bg-gray-600/80"}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
