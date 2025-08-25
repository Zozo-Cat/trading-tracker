"use client";
import { useEffect, useState } from "react";
import DashboardCard from "../DashboardCard";

const QUOTES = [
    "Amateurs think about how much they can win. Professionals think about how much they could lose.",
    "Trade less, but better.",
    "Process beats outcome.",
    "Be patient in entries, ruthless in risk.",
];

export default function QuoteWidget() {
    const [i, setI] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setI((p) => (p + 1) % QUOTES.length), 8000);
        return () => clearInterval(t);
    }, []);
    return (
        <DashboardCard title="Dagens citat">
            <p className="text-neutral-200 text-sm italic">{QUOTES[i]}</p>
        </DashboardCard>
    );
}
