"use client";
import { useMemo } from "react";
import DashboardCard from "../DashboardCard";

export default function UpcomingNewsWidget() {
    const items = useMemo(
        () => [
            { at: "08:30", market: "USD", title: "CPI (YoY)", imp: 3 },
            { at: "09:00", market: "EUR", title: "ECB Lagarde taler", imp: 2 },
            { at: "10:30", market: "GBP", title: "Unemployment Rate", imp: 2 },
            { at: "11:00", market: "EUR", title: "ZEW Sentiment", imp: 2 },
            { at: "13:30", market: "CAD", title: "CPI (MoM)", imp: 3 },
            { at: "15:00", market: "USD", title: "Fed Minutes", imp: 3 },
            { at: "16:00", market: "NZD", title: "RBNZ Rate Statement", imp: 3 },
        ],
        []
    );

    const dot = (imp: number) =>
        imp >= 3 ? "bg-red-500" : imp === 2 ? "bg-orange-400" : "bg-yellow-300";

    return (
        <DashboardCard
            title="High‑Impact News"
            right={
                <a href="/config/(sections)/news-tracker" className="text-[12px] text-neutral-300 hover:text-white underline">
                    Konfigurér feed
                </a>
            }
        >
            <div className="space-y-1">
                {items.map((n, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-neutral-900/60 border border-neutral-800">
                        <span className={`h-2 w-2 rounded-full ${dot(n.imp)}`} />
                        <span className="text-[11px] text-neutral-400 w-12">{n.at}</span>
                        <span className="text-[11px] text-neutral-400 w-10">{n.market}</span>
                        <span className="text-white text-sm truncate">{n.title}</span>
                    </div>
                ))}
            </div>
        </DashboardCard>
    );
}
