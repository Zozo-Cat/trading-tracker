"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";

/**
 * StreaksWidget
 * UI: 2 linjer med hver 2 bokse (win øverst, loss nederst)
 *  - Linie 1: Current Win • Best Win
 *  - Linie 2: Current Loss • Best Loss
 * Bevarer samme kontrakt: <StreaksWidget instanceId="..." />
 */

type Props = { instanceId: string };

type Trade = { id: string; exit: string; pl: number }; // lukkede trades med P/L

// Demo-data (deterministisk, UTC-ankret — undgår hydration-mismatch)
function demoTradesUTC(): Trade[] {
    const BASE = Date.UTC(2024, 0, 1, 12, 0, 0, 0); // 2024-01-01 12:00Z (fast anker)
    const seq = [200, -100, 300, 150, -50, 80, 120, 60, -30, -20, 70, 40]; // P/L-sekvens
    return seq.map((pl, i) => ({
        id: `t${i}`,
        exit: new Date(BASE + i * 2 * 60 * 60 * 1000).toISOString(), // hvert 2. time
        pl,
    }));
}

function computeStreaks(trades: Trade[]) {
    if (!trades.length) {
        return { curWin: 0, curLoss: 0, bestWin: 0, bestLoss: 0, n: 0 };
    }

    // sorter ældst → nyest
    const sorted = [...trades].sort((a, b) => +new Date(a.exit) - +new Date(b.exit));

    let curWin = 0;
    let curLoss = 0;
    let bestWin = 0;
    let bestLoss = 0;

    // current streak: kig baglæns fra sidste
    for (let i = sorted.length - 1; i >= 0; i--) {
        const p = sorted[i].pl;
        if (p > 0) {
            if (curLoss > 0) break;
            curWin++;
        } else if (p < 0) {
            if (curWin > 0) break;
            curLoss++;
        } else {
            // BE nulstiller begge
            break;
        }
    }

    // best streaks
    let runWin = 0;
    let runLoss = 0;
    for (const t of sorted) {
        if (t.pl > 0) {
            runWin++;
            runLoss = 0;
            bestWin = Math.max(bestWin, runWin);
        } else if (t.pl < 0) {
            runLoss++;
            runWin = 0;
            bestLoss = Math.max(bestLoss, runLoss);
        } else {
            runWin = 0;
            runLoss = 0;
        }
    }

    return { curWin, curLoss, bestWin, bestLoss, n: trades.length };
}

export default function StreaksWidget({ instanceId }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");
    const trades = useMemo(() => demoTradesUTC(), [period]);
    const s = useMemo(() => computeStreaks(trades), [trades]);

    const Header = (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="font-medium">Streaks</div>
                <HelpTip text="Win/Loss streaks for dine seneste handler. Current = pågående serie; Best = længste serie i perioden." />
            </div>
            <PeriodToggle instanceId={instanceId} slug="streaks" defaultValue="day" onChange={setPeriod} />
        </div>
    );

    const Box = ({
                     label,
                     value,
                     tone,
                 }: {
        label: string;
        value: number;
        tone: "win" | "loss";
    }) => {
        const color = tone === "win" ? "#10b981" : "#ef4444";
        const bg = tone === "win" ? "#0b2e24" : "#2a0b0b";
        return (
            <div
                className="rounded-lg px-3 py-2 border"
                style={{ borderColor: `${color}66`, background: `${bg}66` }}
            >
                <div className="text-[11px] text-neutral-300">{label}</div>
                <div className="text-xl font-semibold" style={{ color }}>
                    {value}
                </div>
            </div>
        );
    };

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 border border-neutral-800" id={`${instanceId}-panel`}>
            {Header}

            {s.n === 0 ? (
                <div className="h-24 rounded-xl border border-dashed border-neutral-700 flex items-center justify-center text-neutral-400 text-sm">
                    Ingen lukkede trades i perioden.
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {/* Linie 1: Wins */}
                    <div className="grid grid-cols-2 gap-2">
                        <Box label="Current win streak" value={s.curWin} tone="win" />
                        <Box label="Best win streak" value={s.bestWin} tone="win" />
                    </div>
                    {/* Linie 2: Losses */}
                    <div className="grid grid-cols-2 gap-2">
                        <Box label="Current loss streak" value={s.curLoss} tone="loss" />
                        <Box label="Best loss streak" value={s.bestLoss} tone="loss" />
                    </div>
                    <div className="text-[11px] text-neutral-400">Baseret på {s.n} trades i perioden.</div>
                </div>
            )}
        </div>
    );
}
