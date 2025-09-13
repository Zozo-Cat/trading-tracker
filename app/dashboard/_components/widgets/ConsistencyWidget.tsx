"use client";

import { useMemo, useState } from "react";
import PeriodToggle, { PeriodValue } from "../PeriodToggle";
import HelpTip from "../HelpTip";

/**
 * ConsistencyWidget (kompakt)
 * - KPI: % dage med aktivitet = (handelsdage / total dage) * 100
 * - Mikro-heatmap:
 *    - Dag  : 1 celle
 *    - Uge  : 7 celler (seneste 7 dage)
 *    - Måned: 5x7 celler (seneste 35 dage)  ← kompakt, ikke “kalender-layout”
 * - Props til finjustering af størrelse
 */

type Props = {
    instanceId: string;
    /** px pr. celle-kant (kvadrat). Default 12. */
    cellSize?: number;
    /** Antal uger i “måned”-visning. Default 5 (35 dage). */
    weeksInMonthMode?: number;
};

type Trade = { id: string; openedAt: string }; // ISO

/* ===== UTC helpers (stabil SSR/CSR) ===== */
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUTCDay(d: Date) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function addDaysUTC(d: Date, delta: number) {
    return new Date(d.getTime() + delta * DAY_MS);
}
/** yyyy-mm-dd i UTC */
function ymdUTC(d: Date) {
    return d.toISOString().slice(0, 10);
}

/* ===== Demo data (stabil variation, UTC-baseret) ===== */
function demoTradesUTC(): Trade[] {
    const todayUTC = startOfUTCDay(new Date());
    const out: Trade[] = [];
    for (let d = 0; d < 60; d++) {
        const dayUTC = addDaysUTC(todayUTC, -d); // UTC-midnat
        const weekday = dayUTC.getUTCDay(); // 0..6 (UTC)
        const base = [0.2, 0.6, 1.0, 0.9, 0.5, 0.25, 0.15][weekday];
        const count = Math.max(0, Math.round((Math.sin(d * 1.1) * 0.5 + base) * 3));
        for (let i = 0; i < count; i++) {
            const t = new Date(dayUTC);
            t.setUTCHours(10 + i, 0, 0, 0); // 10:00Z, 11:00Z, ...
            out.push({ id: `t-${d}-${i}`, openedAt: t.toISOString() });
        }
    }
    return out;
}

/* ===== Helpers (vindue & farver) ===== */
function makeDaysBackUTC(n: number) {
    const arr: Date[] = [];
    const todayUTC = startOfUTCDay(new Date());
    for (let i = n - 1; i >= 0; i--) {
        arr.push(addDaysUTC(todayUTC, -i));
    }
    return arr;
}

function colorFor(count: number) {
    if (count <= 0) return { bg: "transparent", border: "1px dashed #3f3f46" };
    const level = Math.min(3, count); // 1..3+
    const bg = `hsl(150deg 70% ${30 + level * 8}%)`; // grøn intensitet
    return { bg, border: "1px solid #27272a" };
}

export default function ConsistencyWidget({
                                              instanceId,
                                              cellSize = 12,
                                              weeksInMonthMode = 5,
                                          }: Props) {
    const [period, setPeriod] = useState<PeriodValue>("day");
    const trades = useMemo(() => demoTradesUTC(), [period]);

    // Vælg periodevindue (antal dage)
    const totalDays =
        period === "day" ? 1 : period === "week" ? 7 : Math.max(4, weeksInMonthMode) * 7;

    // Dagliste bagud fra i dag (UTC-midnat)
    const days = useMemo(() => makeDaysBackUTC(totalDays), [totalDays]);

    // Count pr. dag (UTC)
    const counts = useMemo(() => {
        const map = new Map<string, number>();
        for (const d of days) map.set(ymdUTC(d), 0);
        for (const t of trades) {
            const ts = new Date(t.openedAt); // allerede ISO/UTC
            const key = ymdUTC(startOfUTCDay(ts));
            if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
        }
        return map;
    }, [days, trades]);

    const activeDays = [...counts.values()].filter((n) => n > 0).length;
    const pctActive = Math.round((activeDays / totalDays) * 100);

    /* ===== UI ===== */
    const Header = (
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <div className="font-medium">Konsistens</div>
                <HelpTip text="Markerer hvilke dage der har mindst én trade i valgt vindue. KPI = Handelsdage / Total dage." />
            </div>
            <PeriodToggle instanceId={instanceId} slug="consistency" defaultValue="day" onChange={setPeriod} />
        </div>
    );

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 border border-neutral-800" id={`${instanceId}-panel`}>
            {Header}

            {/* KPI – kompakt */}
            <div className="flex items-baseline gap-2 mb-2">
                <div className="text-2xl font-bold text-neutral-100">{pctActive}%</div>
                <div className="text-[11px] text-neutral-400">
                    Handelsdage {activeDays} / {totalDays}
                </div>
            </div>

            {/* Mikro-heatmap */}
            {period === "day" ? (
                <MiniRow days={days} counts={counts} cellSize={cellSize} columns={1} />
            ) : period === "week" ? (
                <MiniRow days={days} counts={counts} cellSize={cellSize} columns={7} />
            ) : (
                <MiniGrid days={days} counts={counts} cellSize={cellSize} columns={7} />
            )}

            {/* Liten legend */}
            <div className="mt-2 flex items-center gap-1 text-[10px] text-neutral-400">
                <span>0</span>
                <LegendBox intensity={0} size={cellSize - 4} />
                <span>1</span>
                <LegendBox intensity={1} size={cellSize - 4} />
                <span>2</span>
                <LegendBox intensity={2} size={cellSize - 4} />
                <span>3+</span>
                <LegendBox intensity={3} size={cellSize - 4} />
            </div>
        </div>
    );
}

/* ===== Pieces (kompakte celler) ===== */
function Dot({ date, count, size }: { date: Date; count: number; size: number }) {
    const { bg, border } = colorFor(count);
    const title = `${ymdUTC(date)} · ${count} trade${count === 1 ? "" : "s"}`;
    return (
        <div
            title={title}
            className="rounded"
            style={{ width: size, height: size, background: bg, border }}
        />
    );
}

function MiniRow({
                     days,
                     counts,
                     cellSize,
                     columns,
                 }: {
    days: Date[];
    counts: Map<string, number>;
    cellSize: number;
    columns: number;
}) {
    return (
        <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${columns}, ${cellSize}px)` }}
        >
            {days.map((d, i) => (
                <Dot key={i} date={d} count={counts.get(ymdUTC(d)) ?? 0} size={cellSize} />
            ))}
        </div>
    );
}

function MiniGrid({
                      days,
                      counts,
                      cellSize,
                      columns,
                  }: {
    days: Date[];
    counts: Map<string, number>;
    cellSize: number;
    columns: number;
}) {
    // 5x7 (eller nWeeks x 7) – days er allerede totalDays (fx 35)
    return (
        <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${columns}, ${cellSize}px)` }}
        >
            {days.map((d, i) => (
                <Dot key={i} date={d} count={counts.get(ymdUTC(d)) ?? 0} size={cellSize} />
            ))}
        </div>
    );
}

function LegendBox({ intensity, size }: { intensity: 0 | 1 | 2 | 3; size: number }) {
    const { bg, border } =
        intensity === 0 ? { bg: "transparent", border: "1px dashed #3f3f46" } : colorFor(intensity);
    return <div className="rounded" style={{ width: size, height: size, background: bg, border }} />;
}
