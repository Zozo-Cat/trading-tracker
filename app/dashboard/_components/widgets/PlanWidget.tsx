"use client";
import { useMemo, useState } from "react";

type DayScore = { date: string; compliant: boolean; violations: string[] };

function useMockPlanToday(): DayScore {
    // 🔧 senere: fetch fra /api/plan/scorecard?date=today
    return {
        date: new Date().toISOString().slice(0,10),
        compliant: Math.random() > 0.3,
        violations: Math.random() > 0.5 ? [] : ["Risiko > 2%", "Handel udenfor session"],
    };
}
function useMockPlanWeek(): DayScore[] {
    // 🔧 senere: fetch fra /api/plan/scorecard?range=this-week
    const today = new Date();
    const out: DayScore[] = [];
    for (let i=6;i>=0;i--) {
        const d = new Date(today); d.setDate(today.getDate()-i);
        const ok = Math.random() > 0.4;
        out.push({
            date: d.toISOString().slice(0,10),
            compliant: ok,
            violations: ok ? [] : ["Fx: Handel udenfor session"],
        });
    }
    return out;
}

export default function PlanWidget() {
    const [tab, setTab] = useState<"today"|"week">("today");
    const today = useMockPlanToday();
    const week = useMockPlanWeek();
    const weekPct = useMemo(() => {
        const ok = week.filter(d=>d.compliant).length;
        return Math.round((ok / week.length) * 100);
    }, [week]);

    return (
        <div className="bg-neutral-900 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-semibold">Tradingplan & Scorecard</h2>
                <div className="inline-flex bg-neutral-800 rounded-lg p-1">
                    {(["today","week"] as const).map(t => (
                        <button key={t}
                                onClick={()=>setTab(t)}
                                className={`px-3 py-1 rounded-md text-sm ${tab===t ? "bg-neutral-200 text-black" : "text-neutral-300 hover:text-white"}`}>
                            {t==="today" ? "I dag" : "Uge"}
                        </button>
                    ))}
                </div>
            </div>

            {tab==="today" ? (
                <div className="space-y-3">
                    <div className={`rounded-lg p-3 border ${today.compliant ? "border-green-600 bg-green-950/40" : "border-red-600 bg-red-950/40"}`}>
                        <div className="text-sm text-neutral-300">{today.date}</div>
                        <div className="text-xl font-semibold text-white mt-1">
                            {today.compliant ? "Plan overholdt" : "Plan brudt"}
                        </div>
                    </div>
                    {!today.compliant && today.violations.length > 0 && (
                        <div className="rounded-lg p-3 bg-neutral-950 border border-neutral-800">
                            <div className="text-neutral-300 text-sm mb-1">Afvigelser</div>
                            <ul className="list-disc list-inside text-neutral-200 text-sm">
                                {today.violations.map((v,i)=> <li key={i}>{v}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="rounded-lg p-3 bg-neutral-950 border border-neutral-800">
                        <div className="text-neutral-300 text-sm mb-1">Ugens overholdelse</div>
                        <div className="text-white text-2xl font-semibold">{weekPct}%</div>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {week.map(d => (
                            <div key={d.date}
                                 className={`h-14 rounded-md border flex items-center justify-center text-xs
                  ${d.compliant ? "border-green-700 bg-green-950/40 text-green-200" : "border-red-700 bg-red-950/40 text-red-200"}`}>
                                {d.date.slice(5)}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
