"use client";

import { useEffect, useMemo, useState } from "react";
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

/* ===== Venstre panel data (slug + label) ===== */
const CATEGORIES: Array<{
    title: string;
    items: Array<{ slug: WidgetSlug; label: string }>;
}> = [
    {
        title: "Kerne",
        items: [
            { slug: "tradingPlanScorecard", label: "Tradingplan & Scorecard" },
            { slug: "todaysTrades", label: "Dagens trades" },
            { slug: "unnamedTrades", label: "Unavngivne trades" },
        ],
    },
    {
        title: "Konti & Risiko",
        items: [
            { slug: "accounts", label: "Mine konti" },
            { slug: "challenges", label: "Challenges" },
        ],
    },
    {
        title: "Nyheder & Kalender",
        items: [
            { slug: "newsList", label: "News (seneste 5)" },
            { slug: "upcomingNews", label: "Upcoming High-Impact News" },
        ],
    },
    {
        title: "Mål & fremdrift",
        items: [{ slug: "tradingGoals", label: "Trading Goals" }],
    },
    {
        title: "Mentor & Community",
        items: [
            { slug: "mentorFeedback", label: "Mentor feedback" },
            { slug: "notifications", label: "Notifikationscenter" },
        ],
    },
    {
        title: "Insights (Premium/Pro)",
        items: [
            { slug: "autoInsights", label: "Automatiske Insights" },
            { slug: "newsVsPerformance", label: "News vs. Performance (mini)" },
        ],
    },
    {
        title: "Stats",
        items: [
            { slug: "successRate", label: "Succesrate / Hit rate" },
            { slug: "profitLoss", label: "P/L (Profit / Loss)" },
            { slug: "tradesCount", label: "Antal handler" },
            { slug: "riskReward", label: "R/R (gennemsnit)" },
            { slug: "expectancy", label: "Expectancy (EV)" },
            { slug: "drawdown", label: "Drawdown" },
            { slug: "streaks", label: "Streaks (W/L badges)" },
            { slug: "accountGrowth", label: "Kontovækst %" },
            { slug: "sessionPerformance", label: "Session performance" },
            { slug: "sharpeSortino", label: "Sharpe / Sortino" },
            { slug: "setupDistribution", label: "Setup-distribution" },
            { slug: "newsVsNoNews", label: "News vs. no-news" },
            { slug: "customKpi", label: "Custom KPI" },
        ],
    },
    {
        title: "Personligt",
        items: [
            { slug: "welcome", label: "Velkomsthilsen" },
            { slug: "gamification", label: "Gamification" },
        ],
    },
];

/* ===== Props ===== */
type CustomizeLayoutModalProps = {
    open: boolean;
    onClose: () => void;
    onSave: (instances: WidgetInstance[], layout: Layout[]) => void;
};

export default function CustomizeLayoutModal({
                                                 open,
                                                 onClose,
                                                 onSave,
                                             }: CustomizeLayoutModalProps) {
    /* ===== Hooks: ESC-luk + scroll lock ===== */
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

    /* ===== Staged state (arbejdes på i modal) ===== */
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

    // Opslag
    const instById = useMemo(() => {
        const m = new Map<string, WidgetInstance>();
        for (const w of stagedInstances) m.set(w.id, w);
        return m;
    }, [stagedInstances]);

    /* ===== Handlers i preview ===== */
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

    /* ===== Tilføj via "+" knap ===== */
    const addWidget = (slug: WidgetSlug) => {
        const size = widgetSizes[slug];
        const id = `${slug}-${uid()}`;
        // Find næste ledige række: placer ved bunden (y = max(y+h))
        const nextY =
            stagedLayout.reduce((m, l) => Math.max(m, l.y + l.h), 0) || 0;

        const newInst: WidgetInstance = { id, slug };
        const newItem: Layout = {
            i: id,
            x: 0,
            y: nextY,
            w: size.w,
            h: size.h,
            static: false,
        };

        setStaged((prev) => ({
            stagedInstances: [...prev.stagedInstances, newInst],
            stagedLayout: [...prev.stagedLayout, newItem],
        }));
    };

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
                <aside className="w-[340px] max-w-[40vw] h-full bg-[#141212] border-r border-neutral-800 p-4 overflow-y-auto">
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
                        Hver række har 12 point. Brug <span className="text-neutral-200">+</span> for at tilføje widgets til preview.
                    </p>

                    <div className="space-y-4">
                        {CATEGORIES.map((cat) => (
                            <Section
                                key={cat.title}
                                title={cat.title}
                                count={`(${cat.items.length}/${cat.items.length})`}
                            >
                                {cat.items.map(({ slug, label }) => {
                                    const size = widgetSizes[slug];
                                    const sizeLabel = `${size.w}×${size.h}`;
                                    const spec = getWidgetSpec(slug);
                                    const lockedTier = spec.tier && spec.tier !== "free";
                                    return (
                                        <WidgetTile
                                            key={slug}
                                            slug={slug}
                                            label={label}
                                            size={sizeLabel}
                                            locked={lockedTier}
                                            onAdd={() => addWidget(slug)}
                                        />
                                    );
                                })}
                            </Section>
                        ))}
                    </div>
                </aside>

                {/* Right panel (preview) */}
                <main className="flex-1 h-full bg-[#0f0d0d] p-4 overflow-hidden">
                    {/* Top helper bar */}
                    <div className="mb-3 text-xs text-neutral-400 flex items-center justify-between">
                        <div>
                            <strong className="text-neutral-200">Preview:</strong>{" "}
                            Flyt/resize i preview. Ændringer gemmes først når du trykker <em>Færdig</em>.
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
                            onClick={() => onSave(stagedInstances, stagedLayout)}
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
                        slug,
                        label,
                        size,
                        locked,
                        onAdd,
                    }: {
    slug: WidgetSlug;
    label: string;
    size: string;
    locked?: boolean;
    onAdd: () => void;
}) {
    return (
        <div
            className="group rounded-lg border border-neutral-800 bg-[#1a1717] px-3 py-2 flex items-center justify-between hover:border-amber-600/40 hover:bg-[#1d1919] transition"
            title={locked ? "Kræver højere plan" : "Tilføj til preview"}
        >
            <div className="min-w-0">
                <div className="text-sm text-neutral-200 truncate">{label}</div>
                <div className="text-[11px] text-neutral-500">
                    {size}{locked ? " · 🔒" : ""}
                </div>
            </div>
            <button
                type="button"
                onClick={onAdd}
                disabled={locked}
                className={`ml-3 px-2 py-1 rounded-md text-xs border transition
          ${locked
                    ? "border-neutral-800 text-neutral-600 cursor-not-allowed"
                    : "border-amber-500/60 text-amber-300 hover:bg-amber-500/10"}`}
                aria-label={`Tilføj ${label}`}
            >
                +
            </button>
        </div>
    );
}
