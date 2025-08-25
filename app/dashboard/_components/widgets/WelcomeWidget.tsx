"use client";
import { useEffect, useMemo, useState } from "react";
import DashboardCard from "../DashboardCard";

const gold = "#D4AF37";

/** Dev‑safe Welcome: ingen next-auth */
export default function WelcomeWidget() {
    // Vil du bruge navn senere: løft det ind via props eller context.
    const name = "Trader";

    const messages = useMemo(
        () => [
            `Hej ${name}! 💛 Velkommen tilbage.`,
            `${name}, husk: process > resultater. Du gør det godt!`,
            `Nice grind, ${name}! Har du opdateret din journal i dag?`,
            `${name}, fokus: vent på A‑setup – du vinder i længden.`,
            `Du kan mere end du tror, ${name}. Keep going.`,
        ],
        [name]
    );

    const [i, setI] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setI((p) => (p + 1) % messages.length), 6000);
        return () => clearInterval(t);
    }, [messages.length]);

    return (
        <DashboardCard
            title="Velkommen"
            right={<span className="text-[11px] text-neutral-400">Personlig hilsen</span>}
            subtitle={<span className="text-[11px] text-neutral-400">Små beskeder der motiverer.</span>}
        >
            <div className="h-full flex items-center gap-3">
                <div
                    className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ background: gold, color: "#111", fontWeight: 700 }}
                >
                    ✨
                </div>
                <div className="text-white text-sm" style={{ animation: "fade .2s ease" }}>
                    {messages[i]}
                </div>
                <style>{`@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
            </div>
        </DashboardCard>
    );
}
