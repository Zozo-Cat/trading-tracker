"use client";
import DashboardCard from "../DashboardCard";

type Goal = { id: string; title: string; progress: number };

export default function GoalsWidget() {
    const goals: Goal[] = [
        { id: "g1", title: "5 grønne dage i træk", progress: 0.6 },
        { id: "g2", title: "Max risk 1% i 10 handler", progress: 0.3 },
    ];

    return (
        <DashboardCard title="Trading Goals" subtitle={<span className="text-[11px] text-neutral-400">Sæt mål og følg fremdrift</span>}>
            <div className="space-y-3">
                {goals.map(g => (
                    <div key={g.id}>
                        <div className="text-sm text-white mb-1">{g.title}</div>
                        <div className="h-3 rounded bg-neutral-800 overflow-hidden">
                            <div className="h-full" style={{ width: `${Math.round(g.progress*100)}%`, backgroundColor: "#D4AF37" }} />
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">{Math.round(g.progress*100)}%</div>
                    </div>
                ))}
            </div>
        </DashboardCard>
    );
}
