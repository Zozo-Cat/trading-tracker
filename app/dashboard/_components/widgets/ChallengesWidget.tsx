"use client";
import { useState } from "react";
import DashboardCard from "../DashboardCard";
const gold = "#D4AF37";

export default function ChallengesWidget() {
    const hasTeam = true;
    const challenges = [
        { id: "c1", name: "5% i 30 dage", progress: 0.42, day: 12, days: 30 },
        { id: "c2", name: "3 grønne uger", progress: 0.33, day: 1, days: 21 },
    ];
    const hasActive = challenges.length > 0;
    const [idx, setIdx] = useState(0);

    if (!hasTeam) {
        return (
            <DashboardCard title="Challenges">
                <CTA label="Udfordr dig selv – find challenges her" href="/challenges/browse" />
            </DashboardCard>
        );
    }
    if (!hasActive) {
        return (
            <DashboardCard title="Challenges">
                <CTA label="Join teamets challenge" href="/team/challenges" />
            </DashboardCard>
        );
    }

    const ch = challenges[idx];
    const pct = Math.round(ch.progress * 100);

    return (
        <DashboardCard
            title="Challenges"
            right={
                challenges.length > 1 && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIdx((idx - 1 + challenges.length) % challenges.length)} className="px-2 py-1 rounded border border-neutral-700 text-neutral-300 hover:bg-neutral-900">◀</button>
                        <button onClick={() => setIdx((idx + 1) % challenges.length)} className="px-2 py-1 rounded border border-neutral-700 text-neutral-300 hover:bg-neutral-900">▶</button>
                    </div>
                )
            }
        >
            <div className="text-white text-sm mb-1 truncate">{ch.name}</div>

            <div className="h-3 rounded bg-neutral-800 overflow-hidden">
                <div className="h-full" style={{ width: `${pct}%`, backgroundColor: gold }} />
            </div>
            <div className="mt-1 text-[11px] text-neutral-400 flex justify-between">
                <span>Dag {ch.day}/{ch.days}</span>
                <span>{pct}%</span>
            </div>

            <div className="mt-3 flex items-center gap-3">
                <Donut value={pct} label={`${pct}%`} size={64} />
                <div className="text-[12px] text-neutral-300">
                    Fremdrift mod målet. Hold streaken kørende!<br />
                    <a className="underline text-neutral-300 hover:text-white" href="/challenges/history">Se tidligere</a>
                </div>
            </div>
        </DashboardCard>
    );
}

function CTA({ label, href }: { label: string; href: string }) {
    return (
        <div className="h-full flex items-center justify-center text-center">
            <a href={href} className="px-3 py-1.5 rounded-md text-sm" style={{ backgroundColor: gold, color: "black" }}>
                {label}
            </a>
        </div>
    );
}
function Donut({ value, label, size = 96 }: { value: number; label: string; size?: number }) {
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${gold} ${(value) * 3.6}deg, #2b2b2b 0)` }} />
            <div className="absolute inset-2 rounded-full bg-neutral-950" />
            <div className="absolute inset-0 flex items-center justify-center text-white font-semibold text-sm">{label}</div>
        </div>
    );
}
