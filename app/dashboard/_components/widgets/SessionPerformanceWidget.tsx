"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";

/**
 * SessionPerformanceWidget
 * - Viser performance pr. session (Asia / London / NY)
 * - Forklaringslinje: "Asia 00–08 • London 08–16 • NY 16–24 (lokal tid)"
 * - Hydration-safe: ingen Date.now() / randomness i demo-data
 */

type Props = { instanceId: string };

type Trade = { id: string; exit: string; pl: number; session: "ASIA" | "LONDON" | "NY" };

/* ===== Demo-data (deterministisk, ingen afhængighed af nuværende klokkeslæt) ===== */
function demoTradesUTC(): Trade[] {
    const BASE = Date.UTC(2024, 0, 1, 14, 0, 0, 0); // fast anker: 2024-01-01 14:00Z
    const mk = (hOffset: number, pl: number, s: Trade["session"]): Trade => ({
        id: `${s}-${hOffset}-${pl}`,
        exit: new Date(BASE + hOffset * 60 * 60 * 1000).toISOString(),
        pl,
        session: s,
    });
    return [
        mk(-2, 120, "ASIA"),
        mk(-4, -80, "ASIA"),
        mk(0, 50, "LONDON"),
        mk(2, 140, "LONDON"),
        mk(4, -60, "LONDON"),
        mk(6, 200, "NY"),
        mk(8, -40, "NY"),
    ];
}

export default function SessionPerformanceWidget({ instanceId }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");
    const trades = useMemo(() => demoTradesUTC(), [period]);

    const stats = useMemo(() => {
        const buckets = {
            ASIA: { sum: 0, n: 0 },
            LONDON: { sum: 0, n: 0 },
            NY: { sum: 0, n: 0 },
        };
        trades.forEach((t) => {
            buckets[t.session].sum += t.pl;
            buckets[t.session].n += 1;
        });
        return buckets;
    }, [trades]);

    const Header = (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="font-medium">Session performance</div>
                <HelpTip text="Performance fordelt på sessions. Bruges til at spotte hvilke tidsrum du performer bedst i." />
            </div>
            <PeriodToggle instanceId={instanceId} slug="sessionPerf" defaultValue="day" onChange={setPeriod} />
        </div>
    );

    const Card = ({ title, value }: { title: string; value: number }) => {
        const color = value >= 0 ? "#10b981" : "#ef4444";
        const bg = value >= 0 ? "#0b2e24" : "#2a0b0b";
        return (
            <div className="rounded-lg px-3 py-2 border" style={{ borderColor: `${color}66`, background: `${bg}66` }}>
                <div className="text-[11px] text-neutral-300">{title}</div>
                <div className="text-xl font-semibold" style={{ color }}>
                    {value.toFixed(0)}
                </div>
            </div>
        );
    };

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 border border-neutral-800" id={`${instanceId}-panel`}>
            {Header}

            <div className="grid grid-cols-3 gap-2">
                <Card title="Asia" value={stats.ASIA.sum} />
                <Card title="London" value={stats.LONDON.sum} />
                <Card title="NY" value={stats.NY.sum} />
            </div>

            {/* Ekstra forklaringslinje */}
            <div className="mt-2 text-[11px] text-neutral-400">
                Asia 00–08 • London 08–16 • NY 16–24 (lokal tid)
            </div>
        </div>
    );
}
