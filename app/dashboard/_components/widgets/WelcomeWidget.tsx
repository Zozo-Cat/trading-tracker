// app/dashboard/_components/widgets/WelcomeWidget.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

type Props = { instanceId: string };

export default function WelcomeWidget({ instanceId }: Props) {
    const [name, setName] = useState<string>("Trader");
    const [greeting, setGreeting] = useState<string>("Hej");

    // Hydration-safe: læs localStorage efter mount
    useEffect(() => {
        try {
            const n = localStorage.getItem("tt.firstName");
            if (n && n.trim()) setName(n.trim());
        } catch {}
        const now = new Date();
        const h = now.getHours();
        setGreeting(h < 10 ? "Godmorgen" : h < 17 ? "Goddag" : "Godaften");
    }, []);

    const quote = useMemo(() => {
        const rng = seededRng(`${instanceId}::welcome::quote::${new Date().toISOString().slice(0,10)}`);
        const quotes = [
            "Små forbedringer hver dag slår store spring en gang imellem.",
            "Vent på din A-setup—disciplin er din edge.",
            "Processen først. Resultatet følger.",
            "Høj kvalitet > høj frekvens. Lad tålmodigheden betale dig.",
            "Planlæg traden. Trad planen. Log læringen.",
        ];
        return quotes[Math.floor(rng() * quotes.length)];
    }, [instanceId]);

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Velkomsthilsen</div>
                    <HelpTip text="Personlig hilsen og en lille påmindelse til dagen." />
                </div>
            </div>

            <div className="space-y-2">
                <div className="text-xl font-semibold">{greeting}, {name} 👋</div>
                <div className="text-neutral-300">{quote}</div>
            </div>

            <div className="mt-3 text-xs text-neutral-400">
                Tip: Skift dit navn under “Min side”, eller gem midlertidigt som <code>tt.firstName</code> i localStorage.
            </div>
        </div>
    );
}
