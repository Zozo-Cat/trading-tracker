"use client";

import { useEffect, useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";

/**
 * VolatilityWidget (noob-friendly, uden sparkline)
 * - KPI: Standard deviation (%) af returns i valgt periode
 * - Badge (Lav/Moderat/Høj) + volatility-meter
 * - Forklaringstekst + HelpTip
 * - Loader / Empty / Error states
 */

type Props = { instanceId: string };

// ===== Demo: simuleret datahentning pr. periode =====
function simulateFetchReturns(period: PeriodValue): Promise<number[]> {
    const seeds: Record<PeriodValue, number[]> = {
        day: [0.4, -0.2, 0.6, -0.3, 0.2],
        week: [0.8, -0.5, 1.2, -0.9, 0.4, 0.6, -0.3, 0.1, 0.9],
        month: [1.2, -1.5, 0.7, -0.8, 0.5, 0.4, -0.2, 1.1, -0.6, 0.3, 0.2, -0.4, 0.9, -0.7, 0.8],
    };
    return new Promise((resolve) => {
        setTimeout(() => resolve(seeds[period]), 400);
    });
}

// ===== Math helpers =====
function stdev(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
    return Math.sqrt(variance);
}

const MAX_EXPECTED_VOL = 10; // % (kan justeres globalt)

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}
function hsl(h: number, s: number, l: number) {
    return `hsl(${h}deg ${s}% ${l}%)`;
}

/** Map vol% til farve + label (grøn→gul→rød) */
function classifyVol(volPct: number) {
    const t = Math.max(0, Math.min(1, volPct / MAX_EXPECTED_VOL));
    const hue = t < 0.5 ? lerp(150, 45, t / 0.5) : lerp(45, 0, (t - 0.5) / 0.5);
    const color = hsl(hue, 70, 50);
    const soft = hsl(hue, 70, 18);

    const level = volPct <= 2 ? "Lav" : volPct <= 5 ? "Moderat" : "Høj";
    const desc =
        level === "Lav" ? "stabilt afkast" : level === "Moderat" ? "normale udsving" : "store udsving";

    return { level, color, soft, desc };
}

export default function VolatilityWidget({ instanceId }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");
    const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
    const [returns, setReturns] = useState<number[]>([]);

    useEffect(() => {
        let alive = true;
        setStatus("loading");
        simulateFetchReturns(period)
            .then((vals) => {
                if (!alive) return;
                setReturns(vals);
                setStatus("ready");
            })
            .catch(() => {
                if (!alive) return;
                setStatus("error");
            });
        return () => {
            alive = false;
        };
    }, [period]);

    const stats = useMemo(() => {
        if (returns.length < 2) return null;
        const vol = stdev(returns);
        const volPct = +vol.toFixed(2);
        const { level, color, soft, desc } = classifyVol(volPct);
        return { volPct, level, color, soft, desc };
    }, [returns]);

    const Header = (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="font-medium">Volatility</div>
                <HelpTip text="Volatility = hvor meget dine resultater svinger (std.dev. af afkast). Grøn = stabilt, rød = store udsving." />
            </div>
            <PeriodToggle
                instanceId={instanceId}
                slug="volatility"
                defaultValue="day"
                onChange={setPeriod}
            />
        </div>
    );

    if (status === "loading") {
        return (
            <div className="rounded-xl p-4 bg-neutral-900/60 border border-neutral-800" id={`${instanceId}-panel`}>
                {Header}
                <div className="h-28 rounded-xl border border-dashed border-neutral-700 flex items-center justify-center text-neutral-400 text-sm">
                    Henter data…
                </div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="rounded-xl p-4 bg-neutral-900/60 border border-neutral-800" id={`${instanceId}-panel`}>
                {Header}
                <div className="h-28 rounded-xl border border-red-900 bg-red-950/30 flex items-center justify-center text-red-300 text-sm">
                    Kunne ikke hente data. Prøv igen senere.
                </div>
            </div>
        );
    }

    const notEnough = !stats;

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 border border-neutral-800" id={`${instanceId}-panel`}>
            {Header}

            {notEnough ? (
                <div className="h-28 rounded-xl border border-dashed border-neutral-700 flex items-center justify-center text-neutral-400 text-sm">
                    Ikke nok data til at beregne volatilitet (kræver ≥ 2 returns).
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {/* KPI + Badge */}
                    <div className="flex items-baseline gap-3">
                        <div className="text-3xl font-bold text-neutral-100">{stats!.volPct}%</div>
                        <span
                            className="text-xs px-2 py-1 rounded-full"
                            style={{
                                background: `${stats!.soft}`,
                                color: stats!.color,
                                border: `1px solid ${stats!.color}66`,
                            }}
                            title={`${stats!.level} volatilitet (${stats!.desc})`}
                        >
              {stats!.level}
            </span>
                    </div>
                    <div className="text-xs text-neutral-400">
                        Standardafvigelse af afkast i valgt periode.{" "}
                        <span className="text-neutral-300">Lav</span> = mere stabilt,{" "}
                        <span className="text-neutral-300">Høj</span> = store udsving.
                    </div>

                    {/* Volatility meter */}
                    <div className="mt-1">
                        <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                            <span>Lav</span>
                            <span>Moderat</span>
                            <span>Høj</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                            <div
                                className="h-full transition-all"
                                style={{
                                    width: `${Math.max(
                                        2,
                                        Math.min(100, (stats!.volPct / MAX_EXPECTED_VOL) * 100)
                                    )}%`,
                                    background: stats!.color,
                                }}
                            />
                        </div>
                        <div className="mt-1 text-[11px] text-neutral-400">
                            Højere farve og længere bar = større udsving.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
