"use client";
import { useMemo, useState } from "react";

/** Props
 * - single: true  => rendér kun EN KPI, uden "Bokse/Konto"-UI
 * - initialKPIs:  ["winrate"]  => hvilken KPI flisen viser
 * - title:        "Succesrate" => overskrift på kortet
 */
export default function StatsWidget({
                                        single = false,
                                        initialKPIs = ["winrate"],
                                        title,
                                    }: {
    single?: boolean;
    initialKPIs?: Array<
        | "winrate" | "hitrate" | "accountGrowth"
        | "pl" | "trades" | "rr" | "expectancy"
        | "drawdown" | "streaks" | "sessionPerf"
        | "sharpe" | "sortino" | "setupDistribution"
        | "newsVsNoNews" | "customKPI"
    >;
    title?: string;
}) {
    const gold = "#D4AF37";
    const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

    // I single-mode viser vi KUN første KPI
    const kpis = single ? [initialKPIs[0]] : initialKPIs;
    const heading = title ?? labelFor(kpis[0]);

    return (
        <div className="rounded-xl bg-neutral-950 border border-neutral-800 h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-3 pt-2 flex items-center justify-between">
                <div className="text-white text-sm">{heading}</div>

                {/* Periode-tabs (med 🔒 på uge/mdr som teaser for free) */}
                <div className="flex gap-1">
                    {(["daily", "weekly", "monthly"] as const).map((p) => {
                        const locked = p !== "daily"; // teaser – kobles til plan senere
                        const active = p === period;
                        return (
                            <button
                                key={p}
                                onClick={() => !locked && setPeriod(p)}
                                className={`px-2 py-1 rounded text-[11px] border ${
                                    active ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "bg-neutral-900 border-neutral-700 text-neutral-300"
                                } ${locked ? "opacity-70" : ""}`}
                                title={locked ? (p === "weekly" ? "Kræver Premium" : "Kræver Pro") : ""}
                            >
                                {p.toUpperCase()} {locked ? "🔒" : ""}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 px-3 pb-3 flex items-center justify-center">
                {kpis.map((k) => (
                    <div key={k} className="w-full h-full flex items-center justify-center">
                        {renderKPI(k, period)}
                    </div>
                ))}
            </div>
        </div>
    );

    /* ───────── helpers ───────── */

    function renderKPI(k: string, _p: typeof period) {
        switch (k) {
            // Donuts
            case "winrate":
            case "hitrate":
            case "accountGrowth":
                return <Donut value={33} label="33%" />;

            // Sparklines / bars
            case "pl":
                return <SparkLine variant="area" points={[2,3,1,4,6,5,7,4]} />;
            case "trades":
                return <BarMini values={[5,6,5,7,8,6,5,7,6,8]} note={`Antal handler pr. ${periodLabel(_p)}`} />;

            // Text + pil
            case "rr":
                return <TextTrend value={1.68} goodUp note="Gns. R/R" />;
            case "drawdown":
                return <TextTrend value={-3.2} goodUp={false} note="Maks. drawdown (%)" />;

            // Expectancy spark
            case "expectancy":
                return <SparkLine variant="line" points={[0.1,0.2,0.05,0.3,0.25,0.4]} note="Forventet afkast pr. trade" />;

            // Streaks badges (simple)
            case "streaks":
                return <StreakBadges win={4} lose={2} />;

            // Session segmented bar (3 segments)
            case "sessionPerf":
                return <Segments3 labels={["Asia","London","NY"]} values={[0.2,0.5,0.3]} />;

            // Sharpe / Sortino spark + marker
            case "sharpe":
            case "sortino":
                return <SparkLine variant="line" points={[1.0,1.2,0.9,1.4,1.6,1.5]} target={1.3} note={k === "sharpe" ? "Sharpe ratio" : "Sortino ratio"} />;

            // Setup distribution (mini stack)
            case "setupDistribution":
                return <Stack3 labels={["A","B","C"]} values={[0.4,0.35,0.25]} />;

            // News vs no-news (double bars)
            case "newsVsNoNews":
                return <DoubleBars labels={["Med nyheder", "Uden nyheder"]} values={[0.42, 0.61]} />;

            // Custom KPI (placeholder spark)
            case "customKPI":
                return <SparkLine variant="line" points={[0.2,0.4,0.45,0.5,0.6]} note="Custom KPI" />;

            default:
                return <div className="text-neutral-400 text-sm">Ukendt KPI</div>;
        }
    }
}

/* ───────── små præsentationskomponenter ───────── */

function Donut({ value, label }: { value: number; label: string }) {
    const gold = "#D4AF37";
    return (
        <div className="flex items-center justify-center">
            <div
                className="relative"
                style={{ width: 96, height: 96 }}
            >
                <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: `conic-gradient(${gold} ${value * 3.6}deg, #2b2b2b 0)` }}
                />
                <div className="absolute inset-2 rounded-full bg-neutral-900" />
                <div className="absolute inset-0 flex items-center justify-center text-white font-semibold">
                    {label}
                </div>
            </div>
        </div>
    );
}

function SparkLine({
                       points,
                       variant = "line",
                       target,
                       note,
                   }: {
    points: number[];
    variant?: "line" | "area";
    target?: number;
    note?: string;
}) {
    const width = 180, height = 64, max = Math.max(...points), min = Math.min(...points);
    const path = points
        .map((v, i) => {
            const x = (i / (points.length - 1)) * (width - 2);
            const y = height - 2 - ((v - min) / (max - min || 1)) * (height - 4);
            return `${i === 0 ? "M" : "L"} ${x},${y}`;
        })
        .join(" ");

    const targetY =
        target != null
            ? height - 2 - ((target - min) / (max - min || 1)) * (height - 4)
            : null;

    return (
        <div className="flex flex-col items-center">
            <svg width={width} height={height}>
                {variant === "area" && (
                    <path
                        d={`${path} L ${width - 2},${height - 2} L 0,${height - 2} Z`}
                        fill="#D4AF3733"
                    />
                )}
                <path d={path} stroke="#D4AF37" strokeWidth={2} fill="none" />
                {targetY != null && (
                    <line x1="0" x2={width} y1={targetY} y2={targetY} stroke="#888" strokeDasharray="3 3" />
                )}
            </svg>
            {note && <div className="text-[11px] text-neutral-400 mt-1 italic">{note}</div>}
        </div>
    );
}

function BarMini({ values, note }: { values: number[]; note?: string }) {
    const max = Math.max(...values, 1);
    return (
        <div className="flex flex-col items-center">
            <div className="flex items-end gap-1">
                {values.map((v, i) => (
                    <div key={i} className="w-2 bg-[#D4AF37]" style={{ height: `${(v / max) * 48}px` }} />
                ))}
            </div>
            {note && <div className="text-[11px] text-neutral-400 mt-1 italic">{note}</div>}
        </div>
    );
}

function TextTrend({ value, goodUp = true, note }: { value: number; goodUp?: boolean; note?: string }) {
    const isUp = value >= 0;
    const ok = isUp === goodUp;
    return (
        <div className="text-center">
            <div className={`text-2xl font-semibold ${ok ? "text-green-400" : "text-red-400"}`}>
                {value > 0 ? "▲" : value < 0 ? "▼" : "•"} {Math.abs(value).toFixed(2)}
            </div>
            {note && <div className="text-[11px] text-neutral-400 mt-1 italic">{note}</div>}
        </div>
    );
}

function StreakBadges({ win, lose }: { win: number; lose: number }) {
    return (
        <div className="flex gap-3 items-center">
            <span className="px-2 py-1 rounded bg-green-600/20 text-green-300 text-xs">W {win}</span>
            <span className="px-2 py-1 rounded bg-red-600/20 text-red-300 text-xs">L {lose}</span>
        </div>
    );
}

function Segments3({ labels, values }: { labels: string[]; values: number[] }) {
    const total = values.reduce((a, b) => a + b, 0) || 1;
    return (
        <div className="w-full">
            <div className="flex h-4 rounded overflow-hidden">
                {values.map((v, i) => (
                    <div key={i} className="bg-[#D4AF37]" style={{ width: `${(v / total) * 100}%` }} />
                ))}
            </div>
            <div className="flex justify-between text-[11px] text-neutral-400 mt-1 italic">
                {labels.map((l) => <span key={l}>{l}</span>)}
            </div>
        </div>
    );
}

function Stack3({ labels, values }: { labels: string[]; values: number[] }) {
    const total = values.reduce((a, b) => a + b, 0) || 1;
    return (
        <div className="w-full">
            <div className="flex h-10 items-end gap-1">
                {values.map((v, i) => (
                    <div key={i} className="flex-1">
                        <div className="w-full bg-[#D4AF37]" style={{ height: `${(v / total) * 64}px` }} />
                        <div className="text-[11px] text-neutral-400 text-center mt-1">{labels[i]}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DoubleBars({ labels, values }: { labels: string[]; values: number[] }) {
    const max = Math.max(...values, 1);
    return (
        <div className="w-full">
            {values.map((v, i) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                    <div className="w-28 text-[12px] text-neutral-300">{labels[i]}</div>
                    <div className="h-3 bg-neutral-800 rounded w-full overflow-hidden">
                        <div className="h-full bg-[#D4AF37]" style={{ width: `${(v / max) * 100}%` }} />
                    </div>
                    <div className="text-[12px] text-neutral-300 w-10 text-right">{Math.round(v * 100)}%</div>
                </div>
            ))}
        </div>
    );
}

function labelFor(k: string) {
    const map: Record<string, string> = {
        winrate: "Succesrate",
        hitrate: "Hit rate",
        accountGrowth: "Kontovækst %",
        pl: "P/L",
        trades: "Antal trades",
        rr: "R/R (gns.)",
        expectancy: "Expectancy (EV)",
        drawdown: "Drawdown",
        streaks: "Streaks",
        sessionPerf: "Session performance",
        sharpe: "Sharpe",
        sortino: "Sortino",
        setupDistribution: "Setup‑distribution",
        newsVsNoNews: "News vs. no‑news",
        customKPI: "Custom KPI",
    };
    return map[k] ?? k;
}

function periodLabel(p: "daily" | "weekly" | "monthly") {
    return p === "daily" ? "dag" : p === "weekly" ? "uge" : "måned";
}
