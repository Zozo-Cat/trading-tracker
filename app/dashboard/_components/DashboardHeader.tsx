"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3 } from "lucide-react";

type Props = {
    onCustomize?: () => void;
    customizeLabel?: string; // fx "Tilpas layout"
};

export default function DashboardHeader({
                                            onCustomize,
                                            customizeLabel = "Tilpas layout",
                                        }: Props) {
    // Skift besked hver 8 sek. + fade
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setTick((v) => v + 1), 8000);
        return () => clearInterval(t);
    }, []);

    const firstName = useMemo(() => {
        if (typeof window === "undefined") return "Trader";
        return localStorage.getItem("tt_firstName") || "Trader";
    }, []);

    const dailyReminder = useMemo(() => {
        if (typeof window === "undefined")
            return "Risiko først. Trim størrelsen hvis du er i tvivl.";
        return (
            localStorage.getItem("tt_daily_reminder") ||
            "Risiko først. Trim størrelsen hvis du er i tvivl."
        );
    }, []);

    const msgA = `Goddag, ${firstName} 👋 — små forbedringer hver dag slår store spring.`;
    const msgB = dailyReminder;

    const showA = tick % 2 === 0;

    const router = useRouter();
    const handleCustomize = () => {
        if (onCustomize) return onCustomize();
        router.push("/dashboard?edit=1");
    };

    return (
        <div className="mb-4 -mt-1">
            <div className="flex items-center justify-between gap-3">
                {/* Titel venstre */}
                <h1
                    className="text-2xl md:text-3xl font-semibold tracking-tight"
                    style={{ color: "var(--tt-accent)" }}
                >
                    Dashboard
                </h1>

                {/* Midterbanner (skjult på meget små skærme; vises nedenunder i mobil-blok) */}
                <div className="hidden md:flex flex-1 justify-center">
                    <Banner showA={showA} msgA={msgA} msgB={msgB} />
                </div>

                {/* Knap højre */}
                <div className="shrink-0">
                    <button
                        onClick={handleCustomize}
                        className="inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-600"
                    >
                        <Edit3 className="w-4 h-4" />
                        {customizeLabel}
                    </button>
                </div>
            </div>

            {/* Mobil: banner under titlen, fuld bredde */}
            <div className="md:hidden mt-3">
                <Banner showA={showA} msgA={msgA} msgB={msgB} />
            </div>
        </div>
    );
}

/** Midter-besked som cross-fader mellem to tekster */
function Banner({ showA, msgA, msgB }: { showA: boolean; msgA: string; msgB: string }) {
    return (
        <div className="relative w-full max-w-2xl">
            {/* Basis-krom: accent-venstrekant + gradient + shadow */}
            <div className="rounded-lg border border-neutral-800 bg-gradient-to-br from-neutral-900/80 to-neutral-800/60 shadow-[0_0_0_1px_rgba(0,0,0,0.2)]">
                <div className="flex">
                    <div
                        className="w-1.5 rounded-l-lg"
                        style={{ background: "var(--tt-accent)" }}
                        aria-hidden
                    />
                    <div className="relative flex-1 px-4 py-3">
                        {/* A */}
                        <p
                            className={`absolute inset-0 flex items-center justify-center text-center text-base md:text-lg font-semibold text-neutral-100 transition-opacity duration-500 ${
                                showA ? "opacity-100" : "opacity-0"
                            }`}
                            aria-live="polite"
                        >
                            {msgA}
                        </p>
                        {/* B */}
                        <p
                            className={`absolute inset-0 flex items-center justify-center text-center text-base md:text-lg font-semibold text-neutral-100 transition-opacity duration-500 ${
                                showA ? "opacity-0" : "opacity-100"
                            }`}
                            aria-live="polite"
                        >
                            {msgB}
                        </p>

                        {/* Spacer for højde så teksten ikke “hopper” */}
                        <span className="invisible text-base md:text-lg font-semibold">
              {msgA.length > msgB.length ? msgA : msgB}
            </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
