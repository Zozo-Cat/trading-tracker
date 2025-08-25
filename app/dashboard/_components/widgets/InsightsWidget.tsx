"use client";
import DashboardCard from "../DashboardCard";

type Insight = { id: string; text: string; type: "up" | "down" | "info" };

export default function InsightsWidget() {
    const insights: Insight[] = [
        { id: "i1", text: "Din winrate er 14% højere i London end i NY session.", type: "up" },
        { id: "i2", text: "News‑trades giver lavere R/R end gennemsnittet.", type: "down" },
        { id: "i3", text: "Størst succes i EUR‑par – overvej fokus dér.", type: "info" },
    ];

    const chip = (t: Insight["type"]) =>
        t === "up" ? "bg-green-500/20 text-green-300 border-green-500/40" :
            t === "down" ? "bg-red-500/20 text-red-300 border-red-500/40" :
                "bg-neutral-700/30 text-neutral-200 border-neutral-600";

    return (
        <DashboardCard title="Automatiske Insights" subtitle={<span className="text-[11px] text-neutral-400">Demo‑indsigter</span>}>
            <ul className="space-y-2">
                {insights.map(i => (
                    <li key={i.id} className="rounded border px-3 py-2 bg-neutral-900/60 border-neutral-800">
            <span className={`inline-block text-[11px] px-2 py-0.5 rounded border mr-2 ${chip(i.type)}`}>
              {i.type === "up" ? "↑" : i.type === "down" ? "↓" : "•"}
            </span>
                        <span className="text-sm text-neutral-200">{i.text}</span>
                    </li>
                ))}
            </ul>
        </DashboardCard>
    );
}
