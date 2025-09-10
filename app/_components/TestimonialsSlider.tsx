// app/_components/TestimonialsSlider.tsx
"use client";

import "keen-slider/keen-slider.min.css";
import { useKeenSlider } from "keen-slider/react";
import { useEffect } from "react";

type Plan = "Gratis" | "Premium" | "Pro";

const ITEMS = [
    {
        name: "Mikkel H.",
        role: "Swing Trader",
        plan: "Pro" as Plan,
        text: "Trading Tracker har givet mig et klart overblik over mine trades – og hjulpet mig med at holde styr på min strategi.",
        avatar: "/images/default-avatar.png",
    },
    {
        name: "Sofie L.",
        role: "Day Trader",
        plan: "Premium" as Plan,
        text: "Det er så fedt at kunne dele mine resultater med mit team og lære af hinanden. Har forbedret min win-rate markant!",
        avatar: "/images/default-avatar.png",
    },
    {
        name: "Anders K.",
        role: "Investor",
        plan: "Gratis" as Plan,
        text: "Jeg elsker statistikkerne! Jeg kan hurtigt se, hvad der virker for mig – og hvad jeg skal justere.",
        avatar: "/images/default-avatar.png",
    },
    {
        name: "Nadia R.",
        role: "Futures Trader",
        plan: "Pro" as Plan,
        text: "Teams-funktionen gør en kæmpe forskel – accountability og sparring har løftet mit niveau.",
        avatar: "/images/default-avatar.png",
    },
    {
        name: "Jonas P.",
        role: "Options",
        plan: "Premium" as Plan,
        text: "Det tog mig 2 minutter at komme i gang. Nu har jeg endelig styr på min R:R og mine bedste setups.",
        avatar: "/images/default-avatar.png",
    },
];

function planStyles(plan: Plan) {
    switch (plan) {
        case "Pro":
            return { bg: "#22c55e", text: "#0b1b0f" }; // grøn badge
        case "Premium":
            return { bg: "#60a5fa", text: "#0b1220" }; // blå badge
        default:
            return { bg: "#a3a3a3", text: "#111" }; // grå badge for Gratis
    }
}

// Simpel autoplay
function useAutoplay(ref: any, enabled = true, interval = 4500) {
    useEffect(() => {
        if (!enabled || !ref.current) return;
        let t: any = setInterval(() => ref.current.next(), interval);
        const slider = ref.current;
        const stop = () => clearInterval(t);
        slider.on("pointerdown", stop);
        slider.on("dragStart", stop);
        slider.on("destroyed", stop);
        return () => clearInterval(t);
    }, [ref, enabled, interval]);
}

export default function TestimonialsSlider() {
    const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
        loop: true,
        renderMode: "performance",
        slides: { perView: 1, spacing: 12 },
        breakpoints: {
            "(min-width: 768px)": { slides: { perView: 2, spacing: 16 } },
            "(min-width: 1024px)": { slides: { perView: 3, spacing: 16 } },
        },
    });

    useAutoplay(instanceRef, true, 4500);

    // Faste marketingtal (dummy); tidligere kom tallet fra dummyAuth
    const usersCount = 500;

    return (
        <section className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="text-center text-2xl md:text-3xl font-bold mb-8" style={{ color: "#D4AF37" }}>
                Hvad brugerne siger
            </h2>

            {/* Slider (mobil: swipe; desktop: pil-knapper nedenfor) */}
            <div ref={sliderRef} className="keen-slider">
                {ITEMS.map((t, idx) => {
                    const s = planStyles(t.plan as Plan);
                    return (
                        <article
                            key={idx}
                            className="keen-slider__slide rounded-3xl border border-gray-700 bg-[#1a1818] p-8 shadow transition-shadow"
                        >
                            <div className="flex items-center gap-3">
                                {/* Avatar med “ring”-kant i plan-farve */}
                                <img src={t.avatar} alt={`${t.name} avatar`} width={48} height={48} className="rounded-full border-2" style={{ borderColor: s.bg }} />
                                <div className="flex-1">
                                    <div className="font-semibold" style={{ color: "#D4AF37" }}>
                                        {t.name}
                                    </div>
                                    <div className="text-xs text-gray-400">{t.role}</div>
                                </div>
                                {/* Plan badge */}
                                <span className="text-xs px-2 py-1 rounded-md font-semibold" style={{ backgroundColor: s.bg, color: s.text }}>
                  {t.plan}
                </span>
                            </div>

                            <p className="mt-4 text-gray-300 italic">“{t.text}”</p>
                        </article>
                    );
                })}
            </div>

            {/* Pile (skjult på mobil) */}
            <div className="mt-6 hidden md:flex justify-center gap-3">
                <button onClick={() => instanceRef.current?.prev()} className="px-3 py-2 rounded-md border border-gray-700 text-sm">
                    ◀︎
                </button>
                <button onClick={() => instanceRef.current?.next()} className="px-3 py-2 rounded-md border border-gray-700 text-sm">
                    ▶︎
                </button>
            </div>

            {/* Count line */}
            <p className="mt-8 text-center text-sm text-gray-300">
                Mere end <span className="font-semibold">{usersCount} brugere</span> har allerede brugt Trading Tracker til at tage deres
                trading til næste niveau — vil du være den næste?
            </p>
        </section>
    );
}
