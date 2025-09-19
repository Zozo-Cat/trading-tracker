// app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import GridLayout, { Layout, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import WidgetChrome from "./_components/WidgetChrome";
import { widgetSizes, WidgetSlug } from "./_components/widgetSizes";
import { getWidgetSpec } from "./_components/widgetRegistry";
import CustomizeLayoutModal from "./_components/CustomizeLayoutModal";

const RGL = WidthProvider(GridLayout);

// ===== Grid constants (matcher test-look) =====
const COLS = 12;
const ROW_HEIGHT = 72;
const MARGIN: [number, number] = [16, 16]; // = gap-4
const CONTAINER_PADDING: [number, number] = [0, 0]; // ingen indre padding

// === LocalStorage keys (versioneret) ===
const LS_VERSION = "3"; // bump → tving ny seed
const LS_KEYS = {
    version: "tt.dashboard.v2.version",
    widgets: "tt.dashboard.v2.widgets",
    layout: "tt.dashboard.v2.layout",
};

// === Typer ===
type WidgetInstance = {
    id: string; // stable id = layout.i
    slug: WidgetSlug;
};

// === Utils ===
const uid = () => Math.random().toString(36).slice(2, 10);

/** Pak widgets venstre→højre i rækker á 12 kolonner, så default layout ligner vores test-grid. */
function packLayout(
    slugsInOrder: WidgetSlug[]
): { instances: WidgetInstance[]; layout: Layout[] } {
    let x = 0;
    let y = 0;

    const instances: WidgetInstance[] = [];
    const layout: Layout[] = [];

    for (const slug of slugsInOrder) {
        const size = widgetSizes[slug] ?? { w: 3, h: 1 };
        const w = Math.min(size.w, COLS);
        const h = Math.max(1, size.h || 1);

        if (x + w > COLS) {
            // ny række
            x = 0;
            // næste ledige y = max y+h fra eksisterende i rækken
            y = layout.reduce((acc, l) => Math.max(acc, l.y + l.h), 0);
        }

        const id = `${slug}-${uid()}`;
        instances.push({ id, slug });
        layout.push({ i: id, x, y, w, h, static: false });
        x += w;
    }

    return { instances, layout };
}

// Seed: Default dashboard (Free) i en rækkefølge der ligner testens visning
function seedDefault(): { instances: WidgetInstance[]; layout: Layout[] } {
    const FREE_DEFAULT: WidgetSlug[] = [
        // ræk.1 (12): 3 + 3 + 3 + 3
        "successRate",
        "tradesCount",
        "riskReward",
        "accountGrowth",
        // ræk.2 (12): 4 + 3 + 4 (11 → tæt nok, næste hopper op)
        "profitLoss",
        "consistency",
        "drawdown",
        // ræk.3 (12): 3 + 3 + 3 + 3
        "sessionPerformance",
        "streaks",
        "welcome",
        "todaysTrades",
        // ræk.4 (12): 6 + 6
        "newsList",
        "upcomingNews",
        // ræk.5
        "tradingGoals",
    ];
    return packLayout(FREE_DEFAULT);
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

function saveToLocalStorage(instances: WidgetInstance[], layout: Layout[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_KEYS.version, LS_VERSION);
    localStorage.setItem(LS_KEYS.widgets, JSON.stringify(instances));
    localStorage.setItem(LS_KEYS.layout, JSON.stringify(layout));
}

/** RGL item-højde = h*rowHeight + (h-1)*marginY  → vend den om for at få h. */
function rowsNeededForHeight(px: number): number {
    const unit = ROW_HEIGHT + MARGIN[1];
    return Math.max(1, Math.ceil((px + MARGIN[1]) / unit)); // lille buffer
}

export default function DashboardPage() {
    // Live state (vises på dashboardet)
    const [{ instances, layout }, setState] = useState<{
        instances: WidgetInstance[];
        layout: Layout[];
    }>({ instances: [], layout: [] });

    // Modal open/close
    const [customizeOpen, setCustomizeOpen] = useState(false);

    // Hydration-safe gate (Stats render kun efter mount pga. demo-randoms)
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // throttle gemning
    const saveTimer = useRef<number | null>(null);
    const scheduleSave = (nextInstances: WidgetInstance[], nextLayout: Layout[]) => {
        if (saveTimer.current) window.clearTimeout(saveTimer.current);
        saveTimer.current = window.setTimeout(() => {
            saveToLocalStorage(nextInstances, nextLayout);
            saveTimer.current = null;
        }, 250);
    };

    // initial load/seed
    useEffect(() => {
        const loaded = loadFromLocalStorage();
        if (loaded) {
            setState(loaded);
        } else {
            const seeded = seedDefault();
            setState(seeded);
            saveToLocalStorage(seeded.instances, seeded.layout);
        }
    }, []);

    // Map for hurtig opslag
    const instanceById = useMemo(() => {
        const m = new Map<string, WidgetInstance>();
        for (const w of instances) m.set(w.id, w);
        return m;
    }, [instances]);

    // ===== AUTO-FIT HØJDE (ResizeObserver) =====
    const roRef = useRef<ResizeObserver | null>(null);

    useEffect(() => {
        if (layout.length === 0) return;

        if (roRef.current) roRef.current.disconnect();
        const ro = new ResizeObserver((entries) => {
            let changed = false;
            const nextLayout = [...layout];

            entries.forEach((entry) => {
                const contentEl = entry.target as HTMLElement;
                const cellEl = contentEl.closest<HTMLElement>("[data-grid-id]");
                if (!cellEl) return;
                const id = cellEl.getAttribute("data-grid-id");
                if (!id) return;

                const heightPx = entry.contentRect.height;
                const needed = rowsNeededForHeight(heightPx);
                const idx = nextLayout.findIndex((l) => l.i === id);
                if (idx >= 0 && nextLayout[idx].h !== needed) {
                    nextLayout[idx] = { ...nextLayout[idx], h: needed };
                    changed = true;
                }
            });

            if (changed) {
                setState((prev) => {
                    const nextState = { instances: prev.instances, layout: nextLayout };
                    scheduleSave(nextState.instances, nextState.layout);
                    return nextState;
                });
            }
        });

        layout.forEach((l) => {
            const el = document.querySelector<HTMLElement>(
                `[data-grid-id="${l.i}"] > .tt-grid-content`
            );
            if (el) ro.observe(el);
        });

        roRef.current = ro;
        return () => ro.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layout.map((l) => l.i).join(",")]);

    // layout change handler (live)
    const handleLayoutChange = (nextLayout: Layout[]) => {
        setState((prev) => {
            const nextState = { instances: prev.instances, layout: nextLayout };
            scheduleSave(nextState.instances, nextState.layout);
            return nextState;
        });
    };

    // Remove widget (live)
    const removeWidget = (id: string) => {
        setState((prev) => {
            const nextInstances = prev.instances.filter((w) => w.id !== id);
            const nextLayout = prev.layout.filter((l) => l.i !== id);
            scheduleSave(nextInstances, nextLayout);
            return { instances: nextInstances, layout: nextLayout };
        });
    };

    // Toggle lock (static) (live)
    const toggleLock = (id: string) => {
        setState((prev) => {
            const nextLayout = prev.layout.map((l) =>
                l.i === id ? { ...l, static: !l.static } : l
            );
            scheduleSave(prev.instances, nextLayout);
            return { instances: prev.instances, layout: nextLayout };
        });
    };

    // Nulstil layout (live)
    const resetLayout = () => {
        const seeded = seedDefault();
        setState(seeded);
        saveToLocalStorage(seeded.instances, seeded.layout);
    };

    // Overlay til stats (for lock/remove)
    const StatsOverlay = ({
                              id,
                              isLocked,
                              onRemove,
                              onToggleLock,
                          }: {
        id: string;
        isLocked: boolean;
        onRemove: () => void;
        onToggleLock: () => void;
    }) => (
        <div className="pointer-events-none absolute right-2 top-2 z-10 opacity-0 transition group-hover:opacity-100">
            <div className="flex gap-1 pointer-events-auto">
                <button
                    type="button"
                    onClick={onToggleLock}
                    className="px-2 py-1 rounded-md text-xs border border-neutral-600 text-neutral-200 hover:bg-neutral-800"
                    title={isLocked ? "Lås op" : "Lås"}
                >
                    {isLocked ? "🔒" : "🔓"}
                </button>
                <button
                    type="button"
                    onClick={onRemove}
                    className="px-2 py-1 rounded-md text-xs border border-red-600 text-red-200 hover:bg-red-900/40"
                    title="Fjern widget"
                >
                    ✕
                </button>
            </div>
        </div>
    );

    const StatsSkeleton = () => (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 h-[170px] animate-pulse" />
    );

    // De widgets der skal renderes UDEN WidgetChrome (egen ramme/header)
    const CHROMELESS_SLUGS = useMemo(
        () => new Set<WidgetSlug>(["todaysTrades"]),
        []
    );

    return (
        <div className="tt-dashboard min-h-screen p-4">
            {/* Toolbar */}
            <div className="mb-4 flex items-center gap-2 justify-between">
                <h1 className="text-xl font-bold">User Dashboard</h1>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setCustomizeOpen(true)}
                        className="px-3 py-1.5 rounded-md text-sm border border-neutral-600 text-neutral-200 hover:bg-neutral-800 transition"
                        title="Tilpas layout"
                    >
                        Tilpas layout
                    </button>

                    <button
                        type="button"
                        onClick={resetLayout}
                        className="px-3 py-1.5 rounded-md text-sm border border-neutral-600 text-neutral-200 hover:bg-neutral-800 transition"
                        title="Nulstil til standard-layout"
                    >
                        Nulstil layout
                    </button>
                </div>
            </div>

            <div className="mb-3 text-xs text-neutral-400">
                Layout er låst. Klik <span className="text-neutral-200">Tilpas layout</span> for at
                ændre widget-placering.
            </div>

            {/* Fuldbredde (samme som test) */}
            <div className="w-full">
                <RGL
                    className="layout"
                    layout={layout}
                    cols={COLS}
                    rowHeight={ROW_HEIGHT}
                    margin={MARGIN}
                    containerPadding={CONTAINER_PADDING}
                    compactType={null}
                    preventCollision={true}
                    isBounded={false}
                    onLayoutChange={handleLayoutChange}
                    isDraggable={false}
                    isResizable={false}
                    draggableHandle=".tt-widget-header"
                    draggableCancel="button, a, input, textarea, select"
                >
                    {layout.map((l) => {
                        const inst = instanceById.get(l.i);
                        const slug = inst?.slug ?? "filler";
                        const spec = getWidgetSpec(slug);
                        const isStats = spec.category === "Stats";
                        const renderBare = isStats || CHROMELESS_SLUGS.has(slug);
                        const content = spec.component({ instanceId: l.i });

                        return (
                            <div
                                key={l.i}
                                data-grid-id={l.i}
                                className={renderBare ? "relative group" : undefined}
                            >
                                <div className="tt-grid-content">
                                    {renderBare ? (
                                        mounted ? (
                                            <>
                                                <StatsOverlay
                                                    id={l.i}
                                                    isLocked={!!l.static}
                                                    onRemove={() => removeWidget(l.i)}
                                                    onToggleLock={() => toggleLock(l.i)}
                                                />
                                                {content}
                                            </>
                                        ) : (
                                            <StatsSkeleton />
                                        )
                                    ) : (
                                        <WidgetChrome
                                            title={spec.title}
                                            helpText={spec.description}
                                            isLocked={!!l.static}
                                            onRemove={() => removeWidget(l.i)}
                                            onToggleLock={() => toggleLock(l.i)}
                                        >
                                            {content}
                                        </WidgetChrome>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </RGL>
            </div>

            {/* Customize modal */}
            <CustomizeLayoutModal
                open={customizeOpen}
                onClose={() => setCustomizeOpen(false)}
                onSave={(instances, layout) => {
                    setState({ instances, layout });
                    saveToLocalStorage(instances, layout);
                }}
            />
        </div>
    );
}
