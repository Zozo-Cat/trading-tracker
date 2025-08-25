"use client";
import { useMemo } from "react";
import DashboardCard from "../DashboardCard";

export default function NewsWidget() {
    const items = useMemo(
        () => [
            { t: "08:30", title: "USA CPI (YoY) forventes at stige til 3.3%" },
            { t: "10:00", title: "Eurozone ZEW Index viser forbedring" },
            { t: "14:00", title: "Feds taler: fokus på inflationssti" },
            { t: "15:30", title: "Olielagre (DOE) offentliggøres" },
            { t: "17:00", title: "USA: ISM Services PMI" },
            { t: "20:00", title: "Fed Minutes offentliggøres" },
        ],
        []
    );

    return (
        <DashboardCard
            title="News"
            right={
                <a href="/config/(sections)/news-tracker" className="text-[12px] text-neutral-300 hover:text-white underline">
                    Konfigurér feed
                </a>
            }
        >
            <div className="space-y-1">
                {items.slice(0, 5).map((n, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-neutral-900/60 border border-neutral-800">
                        <span className="text-[11px] text-neutral-400 w-12">{n.t}</span>
                        <span className="text-white text-sm truncate">{n.title}</span>
                    </div>
                ))}
            </div>
            <div className="mt-2 text-right">
                <a href="/news" className="text-[12px] text-neutral-300 hover:text-white underline">Se mere</a>
            </div>
        </DashboardCard>
    );
}
