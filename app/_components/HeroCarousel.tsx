"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// Byttet rundt: slide-2 først, så slide-1
const slides = [
    {
        img: "/images/slide-1.png",
        heading: "Byg teams og nå mål sammen",
        sub: "Del fremskridt, se stats og løft niveauet.",
        ctaText: "Kom i gang gratis",
        ctaHref: "/signup",
    },
    {
        img: "/images/slide-2.png",
        heading: "Få overblik over din trading",
        sub: "Byg vaner, track dine trades og hold momentum.",
        ctaText: "Opret konto",
        ctaHref: "/signup",
    },
];

export default function HeroCarousel() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 10000); // 10 sek
        return () => clearInterval(id);
    }, []);

    return (
        <section className="relative w-full pt-10">
            <div className="relative w-full overflow-hidden">
                <div className="relative w-full" style={{ height: "clamp(400px, 80vh, 840px)" }}>
                    {slides.map((s, i) => (
                        <div
                            key={i}
                            className="absolute inset-0 transition-opacity duration-700"
                            style={{ opacity: i === index ? 1 : 0 }}
                        >
                            <Image
                                src={s.img}
                                alt={s.heading}
                                fill
                                priority={i === 0}
                                sizes="100vw"
                                style={{ objectFit: "cover" }}
                            />
                            {/* mørkt overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                            {/* tekstindhold - altid centreret */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                                <h1 className="text-white text-3xl md:text-5xl font-bold leading-tight">
                                    {s.heading}
                                </h1>
                                <p className="mt-3 text-white/90 md:text-lg max-w-2xl">
                                    {s.sub}
                                </p>
                                <div className="mt-6">
                                    <Link
                                        href={s.ctaHref}
                                        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-black font-medium shadow"
                                        style={{ backgroundColor: "#89ff00" }}
                                    >
                                        {s.ctaText}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* slide-indikatorer */}
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                aria-label={`Slide ${i + 1}`}
                                onClick={() => setIndex(i)}
                                className="h-2 w-7 rounded-full transition-all"
                                style={{
                                    backgroundColor: i === index ? "#76ed77" : "rgba(255,255,255,0.6)",
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
