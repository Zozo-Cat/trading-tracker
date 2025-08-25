"use client";
import { useMemo, useState } from "react";
import DashboardCard from "../DashboardCard";

type PlanPoint = { id: string; label: string; doneToday: boolean; importance?: number; recentBreaks?: number };
type Plan = { id: string; name: string; points: PlanPoint[] };

const gold = "#D4AF37";

export default function TradingPlanWidget() {
    const plans: Plan[] = useMemo(
        () => [
            {
                id: "p1",
                name: "Standard",
                points: [
                    { id: "a", label: "Ingen news‑trades", doneToday: true, importance: 5, recentBreaks: 1 },
                    { id: "b", label: "Risk ≤ 1%", doneToday: true, importance: 5, recentBreaks: 1 },
                    { id: "c", label: "Tag profit ved TP1", doneToday: false, importance: 4, recentBreaks: 2 },
                    { id: "d", label: "Max 2 samtidige handler", doneToday: true, importance: 3, recentBreaks: 0 },
                    { id: "e", label: "Ingen revenge trading", doneToday: true, importance: 5, recentBreaks: 0 },
                    { id: "f", label: "Journal efter luk", doneToday: false, importance: 3, recentBreaks: 1 },
                ],
            },
            {
                id: "p2",
                name: "London fokus",
                points: [
                    { id: "g", label: "Kun London 08‑11", doneToday: false, importance: 5, recentBreaks: 1 },
                    { id: "h", label: "BE ved +1R", doneToday: true, importance: 3, recentBreaks: 0 },
                    { id: "i", label: "Journal efter luk", doneToday: false, importance: 4, recentBreaks: 2 },
                ],
            },
        ],
        []
    );

    const [idx, setIdx] = useState(0);
    const [period, setPeriod] = useState<"daily" | "weekly">("daily");
    const plan = plans[idx];

    const top5 = useMemo(() => {
        if (!plan) return [];
        const sorted = [...plan.points].sort((a, b) => (b.recentBreaks ?? 0) - (a.recentBreaks ?? 0) || (b.importance ?? 0) - (a.importance ?? 0));
        return sorted.slice(0, 5);
    }, [plan]);

    const scorePct = useMemo(() => {
        const done = top5.filter(p => p.doneToday).length;
        const total = top5.length || 1;
        return Math.round((done / total) * 100);
    }, [top5]);

    if (!plan) {
        return (
            <DashboardCard title="Tradingplan & Scorecard" subtitle={<AutoText />}>
                <EmptyState
                    title="Ingen plan endnu"
                    subtitle="Opret din tradingplan – vi viser automatisk de vigtigste punkter her."
                    ctaLabel="Opret plan"
                    onClick={() => (window.location.href = "/plans")}
                />
            </DashboardCard>
        );
    }

    return (
        <DashboardCard
            title="Tradingplan & Scorecard"
            subtitle={<AutoText />}
            right={
                <div className="flex items-center gap-2">
                    <PeriodTabs period={period} onChange={setPeriod} lockedWeekly />
                    {plans.length > 1 && (
                        <PlanArrows
                            name={plan.name}
                            onPrev={() => setIdx((idx - 1 + plans.length) % plans.length)}
                            onNext={() => setIdx((idx + 1) % plans.length)}
                        />
                    )}
                </div>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Venstre: top-5 liste (synlig i h=4) */}
                <div className="rounded-lg bg-neutral-900/60 border border-neutral-800 p-3">
                    <ul className="space-y-2">
                        {top5.map(p => (
                            <li key={p.id} className="flex items-start gap-2">
                                <span className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-sm border ${p.doneToday ? "bg-green-500/80 border-green-400" : "bg-neutral-900 border-neutral-700"}`}>{p.doneToday ? "✓" : ""}</span>
                                <div className="flex-1">
                                    <div className="text-sm text-white">{p.label}</div>
                                    <div className="text-[11px] text-neutral-400 italic">
                                        {p.recentBreaks ? <>Ofte brudt ({p.recentBreaks}× nyligt)</> : "Stabilt overholdt"}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Højre: donut + mini-historik */}
                <div className="rounded-lg bg-neutral-900/60 border border-neutral-800 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Donut value={scorePct} label={`${scorePct}%`} size={100} />
                        <div>
                            <div className="text-white text-sm font-medium">Mål opfyldt</div>
                            <div className="text-[12px] text-neutral-400">Top 5 punkter i {period === "daily" ? "dag" : "denne uge"}</div>
                        </div>
                    </div>
                    <MiniHistory items={[true, true, false, true, true, false, true]} />
                </div>
            </div>
        </DashboardCard>
    );
}

/* helpers */
function PeriodTabs({ period, onChange, lockedWeekly }: { period: "daily" | "weekly"; onChange: (p: "daily" | "weekly") => void; lockedWeekly?: boolean; }) {
    return (
        <div className="flex gap-1">
            {(["daily", "weekly"] as const).map((p) => {
                const active = p === period;
                const locked = p === "weekly" && lockedWeekly;
                return (
                    <button
                        key={p}
                        onClick={() => !locked && onChange(p)}
                        className={`px-2 py-1 rounded text-[11px] border ${active ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "bg-neutral-900 border-neutral-700 text-neutral-300"} ${locked ? "opacity-70" : ""}`}
                        title={locked ? "Kræver Premium" : ""}
                    >
                        {p === "daily" ? "I DAG" : "UGE"} {locked ? "🔒" : ""}
                    </button>
                );
            })}
        </div>
    );
}
function PlanArrows({ name, onPrev, onNext }: { name: string; onPrev: () => void; onNext: () => void }) {
    return (
        <div className="flex items-center gap-2">
            <button onClick={onPrev} className="px-2 py-1 rounded border border-neutral-700 text-neutral-300 hover:bg-neutral-900">◀</button>
            <span className="text-neutral-200 text-sm">{name}</span>
            <button onClick={onNext} className="px-2 py-1 rounded border border-neutral-700 text-neutral-300 hover:bg-neutral-900">▶</button>
        </div>
    );
}
function Donut({ value, label, size = 96 }: { value: number; label: string; size?: number }) {
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${gold} ${value * 3.6}deg, #2b2b2b 0)` }} />
            <div className="absolute inset-2 rounded-full bg-neutral-950" />
            <div className="absolute inset-0 flex items-center justify-center text-white font-semibold">{label}</div>
        </div>
    );
}
function MiniHistory({ items }: { items: boolean[] }) {
    return <div className="flex items-center gap-1">{items.map((ok, i) => <span key={i} className={`h-2.5 w-2.5 rounded-sm ${ok ? "bg-green-500/80" : "bg-red-500/70"}`} />)}</div>;
}
function EmptyState({ title, subtitle, ctaLabel, onClick }: { title: string; subtitle?: string; ctaLabel: string; onClick: () => void; }) {
    return (
        <div className="h-full flex items-center justify-center text-center py-6">
            <div>
                <div className="text-white font-medium">{title}</div>
                {subtitle && <div className="text-[12px] text-neutral-400 mt-1">{subtitle}</div>}
                <button onClick={onClick} className="mt-3 px-3 py-1.5 rounded-md text-sm" style={{ backgroundColor: gold, color: "black" }}>
                    {ctaLabel}
                </button>
            </div>
        </div>
    );
}
function AutoText() {
    return <span className="italic text-[11px] text-neutral-400">Vi udvælger automatisk de mest kritiske punkter baseret på dine nylige brud/overholdelser.</span>;
}
