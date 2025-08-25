"use client";
import DashboardCard from "../DashboardCard";

export default function GamificationWidget() {
    const streakDays = 4;
    const badges = [
        { id: "b1", name: "Plan Follower", got: true  },
        { id: "b2", name: "Risk Control",  got: true  },
        { id: "b3", name: "News Aware",    got: false },
    ];

    return (
        <DashboardCard title="Gamification" subtitle={<span className="text-[11px] text-neutral-400">Streaks & badges (demo)</span>}>
            <div className="space-y-3">
                <div className="rounded border border-neutral-800 bg-neutral-900/60 px-3 py-2">
                    <div className="text-sm text-white">Streak</div>
                    <div className="text-[12px] text-neutral-300">Sammenhængende grønne dage</div>
                    <div className="mt-1 flex items-center gap-1">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <span key={i} className={`h-3 w-3 rounded-sm ${i < streakDays ? "bg-green-500/80" : "bg-neutral-700"}`} />
                        ))}
                    </div>
                </div>

                <div>
                    <div className="text-sm text-white mb-1">Badges</div>
                    <div className="flex flex-wrap gap-2">
                        {badges.map(b => (
                            <span key={b.id}
                                  className={`px-2 py-1 rounded text-[12px] border ${b.got ? "border-[#D4AF37] text-[#D4AF37]" : "border-neutral-700 text-neutral-500"}`}>
                {b.name}
              </span>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardCard>
    );
}
