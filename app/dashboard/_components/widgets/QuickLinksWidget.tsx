"use client";
import DashboardCard from "../DashboardCard";

const LINKS = [
    { label: "Trades", href: "/trades" },
    { label: "News Tracker", href: "/config/(sections)/news-tracker" },
    { label: "Min plan", href: "/plans" },
    { label: "Discord", href: "https://discord.com/" },
    { label: "Statistik", href: "/stats" },
];

export default function QuickLinksWidget() {
    return (
        <DashboardCard title="Hurtige links" right={<span className="text-[11px] text-neutral-400">Favoritter</span>}>
            <div className="grid grid-cols-2 gap-2">
                {LINKS.map((l) => (
                    <a
                        key={l.label}
                        href={l.href}
                        className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
                    >
                        {l.label} →
                    </a>
                ))}
            </div>
        </DashboardCard>
    );
}
