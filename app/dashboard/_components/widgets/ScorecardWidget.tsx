"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";

type Item = { id: string; text: string; ok: boolean; hard?: boolean };
type Props = { instanceId: string };

export default function ScorecardWidget({ instanceId }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");

    const items = useMemo<Item[]>(
        () => [
            { id: "i1", text: "Flyt SL til BE først efter 1R", ok: true },
            { id: "i2", text: "Ingen trades ±30 min før røde nyheder", ok: true },
            { id: "i3", text: "Følg tidsvinduer (fx 08–11, 14–16)", ok: false },
            { id: "i4", text: "Screenshot før entry", ok: true },
            { id: "i5", text: "Min. R/R ≥ 1:2 ved entry", ok: false, hard: true },
        ],
        []
    );
    const okCount = items.filter((i) => i.ok).length;

    return (
        <div className="h-full flex flex-col gap-3">
            {/* Kun periodetoggle i højre side – titel kommer fra WidgetChrome */}
            <div className="flex justify-end">
                <PeriodToggle instanceId={instanceId} slug="scorecard" defaultValue="day" onChange={setPeriod} size="sm" />
            </div>

            <div className="grid grid-cols-3 gap-2">
                <Kpi label="Total score" value={`${okCount * 10}/100`} />
                <Kpi label="Regler fulgt" value={`${okCount}/10`} />
                <Kpi label="Afvigelser" value={String(10 - okCount)} bad />
            </div>

            <div className="space-y-2 overflow-auto">
                {items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2">
                        <div className="flex items-center gap-2">
                            {it.hard ? (
                                <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-red-900/40 border border-red-800 text-red-200">
                  HARD
                </span>
                            ) : (
                                <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-yellow-900/30 border border-yellow-700 text-yellow-200">
                  SOFT
                </span>
                            )}
                            <span className="text-sm">{it.text}</span>
                        </div>
                        <div
                            className={`w-5 h-5 rounded-sm border ${
                                it.ok ? "bg-emerald-600/80 border-emerald-500" : "bg-neutral-800 border-neutral-700"
                            }`}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

function Kpi({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
    return (
        <div className="rounded-md border border-neutral-800 px-3 py-2">
            <div className="text-xs text-neutral-400">{label}</div>
            <div className={`text-lg font-semibold ${bad ? "text-red-400" : ""}`}>{value}</div>
        </div>
    );
}
