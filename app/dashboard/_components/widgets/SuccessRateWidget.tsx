"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";

type Props = {
    instanceId: string; // kommer fra WidgetChrome / testside
};

/**
 * SuccessRateWidget v1.3
 * - Tykkere donut (stroke 14)
 * - Farvelogik: grøn (>=60), brand-guld (40-59), rød (<40)
 * - Ryddet UI, HelpTip ved titel, mørk baggrund
 */
export default function SuccessRateWidget({ instanceId }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");

    // Dummy dataset — byt ud med rigtig datakilde senere
    const stats = useMemo(() => {
        if (period === "day") return { wins: 7, losses: 3 };
        if (period === "week") return { wins: 29, losses: 16 };
        return { wins: 118, losses: 82 }; // month
    }, [period]);

    const total = stats.wins + stats.losses;
    const rate = total > 0 ? (stats.wins / total) * 100 : 0;

    // Donut params
    const size = 120;
    const stroke = 14; // thicker ring
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const progress = (rate / 100) * c;

    // Farvevalg
    let ringColor = "#ef4444"; // Tailwind rose-500
    if (rate >= 60) ringColor = "#10b981"; // Tailwind emerald-500
    else if (rate >= 40) ringColor = "#D4AF37"; // Brand guld

    return (
        <div
            className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800"
            id={`${instanceId}-panel`}
        >
            {/* Header: Titel + help + toggle */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Succesrate</div>
                    <HelpTip text="Andel af vundne handler" />
                </div>
                <PeriodToggle
                    instanceId={instanceId}
                    slug="successRate"
                    defaultValue="day"
                    onChange={setPeriod}
                />
            </div>

            {/* Donut + sideinfo */}
            <div className="flex items-center gap-4">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
                    {/* baggrundsring */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        stroke="currentColor"
                        className="text-neutral-300/30 dark:text-neutral-700"
                        strokeWidth={stroke}
                        fill="none"
                    />
                    {/* progress */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        stroke={ringColor}
                        strokeWidth={stroke}
                        fill="none"
                        strokeDasharray={`${progress} ${c - progress}`}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    />
                    {/* center label */}
                    <text
                        x="50%"
                        y="50%"
                        dominantBaseline="middle"
                        textAnchor="middle"
                        className="fill-neutral-100"
                        style={{ fontWeight: 700, fontSize: 18 }}
                    >
                        {rate.toFixed(0)}%
                    </text>
                </svg>

                {/* Side-info */}
                <div className="flex flex-col gap-1">
                    <div className="text-sm">
                        Wins: <span className="font-medium text-emerald-400">{stats.wins}</span>
                    </div>
                    <div className="text-sm">
                        Losses: <span className="font-medium text-rose-400">{stats.losses}</span>
                    </div>
                </div>
            </div>

            {/* A11y fallback-tekst til skærmlæsere */}
            <p className="sr-only">
                Succesrate {rate.toFixed(0)} procent for valgt periode ({label(period)}).
            </p>
        </div>
    );
}

function label(p: PeriodValue) {
    if (p === "day") return "I dag";
    if (p === "week") return "Uge";
    return "Måned";
}
