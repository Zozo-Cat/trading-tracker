"use client";

import { useMemo } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

/**
 * Portfolio Value (aggregated)
 * - Total værdi + ændring
 * - Donut (SVG) for fordeling pr. konto
 * - Legende med beløb og pct
 * - Hydration-safe demo-data
 */

type Props = { instanceId: string };

type Acct = { name: string; value: number };

export default function PortfolioValueWidget({ instanceId }: Props) {
    const { accounts, total, changePct } = useMemo(() => synth(instanceId), [instanceId]);

    const segs = toSegments(accounts.map((a) => a.value));
    const colors = ["#60a5fa", "#34d399", "#f59e0b", "#f472b6", "#a78bfa", "#f87171"];

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Portfolio Value (aggregated)</div>
                    <HelpTip text="Samlet portefølje-værdi på tværs af konti. Donut viser fordelingen." />
                </div>
            </div>

            <div className="flex items-start gap-6">
                {/* Donut */}
                <div className="relative" style={{ width: 140, height: 140 }}>
                    <svg width={140} height={140} role="img" aria-label="Portefølje-fordeling">
                        <g transform="translate(70,70)">
                            {segs.map((s, i) => (
                                <circle
                                    key={i}
                                    r={48}
                                    fill="transparent"
                                    stroke={colors[i % colors.length]}
                                    strokeWidth={16}
                                    strokeDasharray={`${s.seg} ${s.circ - s.seg}`}
                                    strokeDashoffset={-s.offset}
                                />
                            ))}
                            {/* hul */}
                            <circle r={32} fill="#111827" />
                        </g>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-sm text-neutral-400">Total</div>
                            <div className="text-lg font-semibold tabular-nums">{moneyStr(total)}</div>
                            <div className={`text-xs ${changePct >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                                {changePct >= 0 ? "+" : ""}{(changePct * 100).toFixed(1).replace(".", ",")}% d/d
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legende */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {accounts.map((a, i) => {
                        const pct = a.value / total;
                        return (
                            <div key={a.name} className="rounded-lg border border-neutral-700 p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 rounded-sm" style={{ background: colors[i % colors.length] }} />
                                    <div>
                                        <div className="text-sm">{a.name}</div>
                                        <div className="text-xs text-neutral-400">{(pct * 100).toFixed(1).replace(".", ",")}%</div>
                                    </div>
                                </div>
                                <div className="text-sm tabular-nums">{moneyStr(a.value)}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ======= helpers ======= */

function synth(instanceId: string): { accounts: Acct[]; total: number; changePct: number } {
    const rng = seededRng(`${instanceId}::portfolio`);
    const ACCTS = ["Broker A", "Broker B", "Funded X", "Funded Y"];
    const vals = ACCTS.map((n) => ({
        name: n,
        value: Math.round((3000 + rng() * 12000) / 10) * 10, // 3k..15k
    }));
    const total = vals.reduce((s, x) => s + x.value, 0);
    const changePct = (rng() - 0.5) * 0.04; // -2%..+2%
    return { accounts: vals, total, changePct };
}

function toSegments(values: number[]) {
    const tot = values.reduce((s, v) => s + v, 0) || 1;
    const r = 48;
    const circ = 2 * Math.PI * r;
    let acc = 0;
    return values.map((v) => {
        const pct = v / tot;
        const seg = pct * circ;
        const out = { seg, circ, offset: acc };
        acc += seg;
        return out;
    });
}

function moneyStr(n: number) {
    return new Intl.NumberFormat("da-DK", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
