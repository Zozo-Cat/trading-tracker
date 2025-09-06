"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import GridLayout, { Layout, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import WidgetChrome from "./WidgetChrome";
import { widgetSizes, WidgetSlug } from "./widgetSizes";
import { getWidgetSpec } from "./widgetRegistry";

const RGL = WidthProvider(GridLayout);

/* ===== LocalStorage (samme keys som page.tsx) ===== */
const LS_VERSION = "2";
const LS_KEYS = {
    version: "tt.dashboard.v2.version",
    widgets: "tt.dashboard.v2.widgets",
    layout: "tt.dashboard.v2.layout",
};

/* ===== Typer (matcher page.tsx) ===== */
type WidgetInstance = {
    id: string; // = layout.i
    slug: WidgetSlug;
};

/* ===== Utils ===== */
const uid = () => Math.random().toString(36).slice(2, 10);

function seedDefault(): { instances: WidgetInstance[]; layout: Layout[] } {
    const plan: Array<{ slug: WidgetSlug; x: number; y: number }> = [
        { slug: "welcome", x: 0, y: 0 },
        { slug: "successRate", x: 4, y: 0 },
        { slug: "profitLoss", x: 6, y: 0 },
        { slug: "tradesCount", x: 8, y: 0 },
        { slug: "riskReward", x: 10, y: 0 },

        { slug: "drawdown", x: 0, y: 2 },
        { slug: "accountGrowth", x: 3, y: 2 },
        { slug: "streaks", x: 5, y: 2 },
        { slug: "sessionPerformance", x: 8, y: 2 },

        { slug: "todaysTrades", x: 0, y: 4 },
        { slug: "newsList", x: 4, y: 4 },
        { slug: "upcomingNews", x: 8, y: 4 },

        { slug: "tradingGoals", x: 0, y: 5 },
    ];

    const instances: WidgetInstance[] = [];
    const layout: Layout[] = [];

    for (const item of plan) {
        const id = `${item.slug}-${uid()}`;
        const size = widgetSizes[item.slug];
        instances.push({ id, slug: item.slug });
        layout.push({
            i: id,
            x: item.x,
            y: item.y,
            w: size.w,
            h: size.h,
            static: false,
        });
    }

    return { instances, layout };
}

function loadFromLocalStorage():
    | { instances: WidgetInstance[]; layout: Layout[] }
    | null {
    if (typeof window === "undefined") return null;
    try {
        const v = localStorage.getItem(LS_KEYS.version);
        if (v !== LS_VERSION) return null;

        const widgetsRaw = localStorage.getItem(LS_KEYS.widgets);
        const layoutRaw = localStorage.getItem(LS_KEYS.layout);
        if (!widgetsRaw || !layoutRaw) return null;

        const instances = JSON.parse(widgetsRaw) as WidgetInstance[];
        const layout = JSON.parse(layoutRaw) as Layout[];

        if (!Array.isArray(instances) || !Array.isArray(layout)) return null;

        const ids = new Set(instances.map((w) => w.id));
        if (!layout.every((l) => ids.has(l.i))) return null;

        return { instances, layout };
    } catch {
        return null;
    }
}

/* ===== Props ===== */
type CustomizeLayoutModalProps = {
    open: boolean;
    onClose: () => void;
    onSave: () => void; // (bindes til live i næste step)
};

export default function CustomizeLayoutModal({
                                                 open,
                                                 onClose,
                                                 onSave,
                                             }: CustomizeLayoutModalProps) {
    /* ===== Alle hooks først (fast orden) ===== */

    // ESC-luk + scroll lock
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

    // Staged state (arbejdes på i modal)
    const [{ stagedInstances, stagedLayout }, setStaged] = useState<{
        stagedInstances: WidgetInstance[];
        stagedLayout: Layout[];
    }>({ stagedInstances: [], stagedLayout: [] });

    // Initier staged fra LS når modal åbner
    useEffect(() => {
        if (!open) return;
        const loaded = loadFromLocalStorage();
        if (loaded) {
            setStaged({ stagedInstances: loaded.instances, stagedLayout: loaded.layout });
        } else {
            const seeded = seedDefault();
            setStaged({ stagedInstances: seeded.instances, stagedLayout: seeded.layout });
        }
    }, [open]);

    // Hjælp: opslag
    const instById = useMemo(() => {
        const m = new Map<string, WidgetInstance>();
        for (const w of stagedInstances) m.set(w.id, w);
        return m;
    }, [stagedInstances]);

    // Handlers i preview
    const handleLayoutChange = (nextLayout: Layout[]) => {
        setStaged((prev) => ({ ...prev, stagedLayout: nextLayout }));
    };

    const removeWidget = (id: string) => {
        setStaged((prev) => ({
            stagedInstances: prev.stagedInstances.filter((w) => w.id !== id),
            stagedLayout: prev.stagedLayout.filter((l) => l.i !== id),
        }));
    };

    const toggleLock = (id: string) => {
        setStaged((prev) => ({
            ...prev,
            stagedLayout: prev.stagedLayout.map((l) =>
                l.i === id ? { ...l, static: !l.static } : l
            ),
        }));
    };

    const resetToDefault = () => {
        const seeded = seedDefault();
        setStaged({ stagedInstances: seeded.instances, stagedLayout: seeded.layout });
    };

    /* ===== Nu må vi gerne conditional-render ===== */
    if (!open) return null;

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
                        <Section title="Stats" count="(13/13)">
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
                            Træk/resize i preview. Ændringer gemmes først når du trykker <em>Færdig</em>.
                        </div>
                        <button
                            className="px-2 py-1 rounded-md text-xs border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                            onClick={resetToDefault}
                        >
                            Gendan standard
                        </button>
                    </div>

                    {/* Preview canvas */}
                    <div className="h-[calc(100%-56px)] rounded-xl border border-neutral-800 bg-[#151313] p-4 overflow-auto">
                        <div className="h-full w-full rounded-lg">
                            <RGL
                                className="layout"
                                layout={stagedLayout}
                                cols={12}
                                rowHeight={72}
                                margin={[10, 10]}
                                compactType={null}
                                preventCollision={true}
                                isBounded={false}
                                onLayoutChange={handleLayoutChange}
                                isDraggable={true}
                                isResizable={true}
                                draggableHandle=".tt-widget-header"
                                draggableCancel="button, a, input, textarea, select"
                            >
                                {stagedLayout.map((l) => {
                                    const inst = instById.get(l.i);
                                    const slug = inst?.slug ?? "filler";
                                    const spec = getWidgetSpec(slug);

                                    return (
                                        <div key={l.i}>
                                            <WidgetChrome
                                                title={spec.title}
                                                helpText={spec.description}
                                                isLocked={!!l.static}
                                                onRemove={() => removeWidget(l.i)}
                                                onToggleLock={() => toggleLock(l.i)}
                                            >
                                                {spec.component({ instanceId: l.i })}
                                            </WidgetChrome>
                                        </div>
                                    );
                                })}
                            </RGL>
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

/* ===== UI helpers (venstre panel) ===== */
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
            title="Træk ind i preview (kommer)"
            draggable
            onDragStart={(e) => {
                // (kommer i næste del) — sæt dataTransfer med slug osv.
                e.dataTransfer.setData("text/plain", label);
            }}
        >
            <div className="min-w-0">
                <div className="text-sm text-neutral-200 truncate">{label}</div>
                <div className="text-[11px] text-neutral-500">
                    {size}{locked ? " · 🔒" : ""}
                </div>
            </div>
            <div className="text-[11px] text-neutral-400 opacity-0 group-hover:opacity-100 transition">
                træk
            </div>
        </div>
    );
}
