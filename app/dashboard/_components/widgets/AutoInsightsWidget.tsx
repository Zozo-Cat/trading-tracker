// app/dashboard/_components/widgets/AutoInsightsWidget.tsx
"use client";

import { useMemo } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

type Props = { instanceId: string };

type Insight = { type: "pos" | "warn" | "info"; text: string };

export default function AutoInsightsWidget({ instanceId }: Props) {
    const insights = useMemo<Insight[]>(() => {
        const dayKey = new Date().toISOString().slice(0,10);
        const rng = seededRng(`${instanceId}::insights::${dayKey}`);

        // Demo-metrics (deterministisk)
        const avgR = +(0.2 + rng() * 0.8).toFixed(2); // 0.20..1.00
        const bestDay = ["Man", "Tirs", "Ons", "Tors", "Fre"][Math.floor(rng()*5)];
        const worstHour = ["08-09", "09-10", "10-11", "13-14", "15-16"][Math.floor(rng()*5)];
        const slTooTight = rng() > 0.6;
        const tpEarly = rng() > 0.55;

        const out: Insight[] = [
            { type: "pos",  text: `Din gennemsnitlige R ligger på ${avgR} de seneste 20 trades.` },
            { type: "info", text: `Bedste dag: ${bestDay}. Overvej at fokusere mere her.` },
            { type: "warn", text: `Svag session omkring ${worstHour}. Vær ekstra selektiv.` },
        ];
        if (slTooTight) out.push({ type: "warn", text: "Stop-loss er ofte for tæt. Prøv ATR-baseret SL." });
        if (tpEarly) out.push({ type: "info", text: "Du tager ofte profit for tidligt. Overvej del-exit + trailer." });

        return out.slice(0, 3 + Math.floor(rng()*2)); // 3–4 insights
    }, [instanceId]);

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Automatiske Insights</div>
                    <HelpTip text="Små datadrevne observationer. Demo er syntetisk; ægte indsigt kobles til dine trades senere." />
                </div>
                <a className="text-xs text-neutral-300 hover:underline" href="#">
                    Se detaljer
                </a>
            </div>

            <ul className="space-y-2">
                {insights.map((ins, i) => (
                    <li key={i} className="flex items-start gap-2">
                        <Dot tone={ins.type} />
                        <span className="text-neutral-100">{ins.text}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function Dot({ tone }: { tone: "pos" | "warn" | "info" }) {
    const cls =
        tone === "pos"  ? "bg-emerald-500" :
            tone === "warn" ? "bg-amber-500"  :
                "bg-sky-500";
    return <span className={`mt-1 inline-block w-2.5 h-2.5 rounded-full ${cls}`} />;
}
