"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

type CustomizeLayoutModalProps = {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
};

export default function CustomizeLayoutModal({
                                                 open,
                                                 onClose,
                                                 onSave,
                                             }: CustomizeLayoutModalProps) {
    // Luk på ESC + lock body scroll når modal er åben
    useEffect(() => {
        if (!open) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, onClose]);

    if (!open) return null;

    // Fullscreen overlay via portal
    return createPortal(
        <div className="tt-customize fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden
            />

            {/* Modal content */}
            <div className="relative z-10 h-full w-full flex">
                {/* Left panel (categories) */}
                <aside className="w-[320px] max-w-[40vw] h-full bg-[#141212] border-r border-neutral-800 p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Tilpas layout</h2>
                        <button
                            onClick={onClose}
                            className="px-2 py-1 rounded-md text-sm border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                            aria-label="Luk"
                            title="Luk"
                        >
                            Luk
                        </button>
                    </div>

                    <p className="text-xs text-neutral-400 mb-3">
                        Hver række har 12 point. Træk widgets ind i previewet til højre.
                    </p>

                    <div className="space-y-3">
                        {/* KERNE */}
                        <Section title="Kerne" count="(3/3)">
                            <WidgetTile label="Tradingplan & Scorecard" size="6×2" />
                            <WidgetTile label="Dagens trades" size="4×1" />
                            <WidgetTile label="Unavngivne trades" size="6×1" />
                        </Section>

                        {/* KONTI & RISIKO */}
                        <Section title="Konti & Risiko" count="(2/2)">
                            <WidgetTile label="Mine konti" size="4×1" />
                            <WidgetTile label="Challenges" size="3×1" />
                        </Section>

                        {/* NYHEDER & KALENDER */}
                        <Section title="Nyheder & Kalender" count="(2/2)">
                            <WidgetTile label="News (seneste 5)" size="4×1" />
                            <WidgetTile label="Upcoming High-Impact News" size="4×1" />
                        </Section>

                        {/* MÅL & FREMDRIFT */}
                        <Section title="Mål & fremdrift" count="(1/1)">
                            <WidgetTile label="Trading Goals" size="6×1" />
                        </Section>

                        {/* MENTOR & COMMUNITY */}
                        <Section title="Mentor & Community" count="(2/2)">
                            <WidgetTile label="Mentor feedback" size="4×1" />
                            <WidgetTile label="Notifikationscenter" size="3×1" />
                        </Section>

                        {/* INSIGHTS */}
                        <Section title="Insights (Premium/Pro)" count="(2/2)">
                            <WidgetTile label="Automatiske Insights" size="3×1" locked />
                            <WidgetTile label="News vs. Performance (mini)" size="6×1" locked />
                        </Section>

                        {/* STATS */}
                        <Section title="Stats" count="(12/12)">
                            <WidgetTile label="Succesrate / Hit rate" size="2×2" />
                            <WidgetTile label="P/L (Profit / Loss)" size="2×2" />
                            <WidgetTile label="Antal handler" size="2×2" />
                            <WidgetTile label="R/R (gennemsnit)" size="2×2" />
                            <WidgetTile label="Expectancy (EV)" size="2×2" />
                            <WidgetTile label="Drawdown" size="3×2" />
                            <WidgetTile label="Streaks (W/L badges)" size="3×2" />
                            <WidgetTile label="Kontovækst %" size="2×2" />
                            <WidgetTile label="Session performance" size="4×2" />
                            <WidgetTile label="Sharpe / Sortino" size="2×2" />
                            <WidgetTile label="Setup-distribution" size="2×2" />
                            <WidgetTile label="News vs. no-news" size="3×2" />
                            <WidgetTile label="Custom KPI" size="3×2" />
                        </Section>

                        {/* PERSONLIGT */}
                        <Section title="Personligt" count="(2/2)">
                            <WidgetTile label="Velkomsthilsen" size="4×2" />
                            <WidgetTile label="Gamification" size="4×1" />
                        </Section>
                    </div>
                </aside>

                {/* Right panel (preview) */}
                <main className="flex-1 h-full bg-[#0f0d0d] p-4 overflow-hidden">
                    {/* Top helper bar */}
                    <div className="mb-3 text-xs text-neutral-400 flex items-center justify-between">
                        <div>
                            <strong className="text-neutral-200">Preview:</strong>{" "}
                            Træk widgets ind her. Hver række har 12 point.
                        </div>
                        <button
                            className="px-2 py-1 rounded-md text-xs border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                            onClick={() => {
                                // (kommer i næste step) — gendan staged default
                            }}
                        >
                            Gendan standard
                        </button>
                    </div>

                    {/* Preview canvas (placeholder – grid kommer i næste step) */}
                    <div className="h-[calc(100%-56px)] rounded-xl border border-neutral-800 bg-[#151313] p-4 overflow-auto">
                        <div className="h-full w-full border-2 border-dashed border-neutral-700 rounded-lg flex items-center justify-center text-neutral-400">
                            Preview-grid kommer i næste step
                        </div>
                    </div>

                    {/* Footer actions */}
                    <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-md text-sm border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                        >
                            Annuller
                        </button>
                        <button
                            onClick={onSave}
                            className="px-3 py-1.5 rounded-md text-sm border border-amber-500 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                        >
                            Færdig
                        </button>
                    </div>
                </main>
            </div>
        </div>,
        document.body
    );
}

function Section({
                     title,
                     count,
                     children,
                 }: {
    title: string;
    count?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-lg border border-neutral-800">
            <header className="px-3 py-2 flex items-center justify-between">
                <div className="text-sm font-medium">{title}</div>
                {count ? <span className="text-xs text-neutral-400">{count}</span> : null}
            </header>
            <div className="px-2 pb-2 grid gap-2">
                {children}
            </div>
        </section>
    );
}

function WidgetTile({
                        label,
                        size,
                        locked,
                    }: {
    label: string;
    size: string;
    locked?: boolean;
}) {
    return (
        <div
            className="group rounded-lg border border-neutral-800 bg-[#1a1717] px-3 py-2 flex items-center justify-between hover:border-amber-600/40 hover:bg-[#1d1919] transition"
            title="Træk ind i preview"
            draggable
            onDragStart={(e) => {
                // placeholder – i næste step sætter vi dataTransfer med slug osv.
                e.dataTransfer.setData("text/plain", label);
            }}
        >
            <div className="min-w-0">
                <div className="text-sm text-neutral-200 truncate">{label}</div>
                <div className="text-[11px] text-neutral-500">{size}{locked ? " · 🔒" : ""}</div>
            </div>
            <div className="text-[11px] text-neutral-400 opacity-0 group-hover:opacity-100 transition">
                træk
            </div>
        </div>
    );
}
