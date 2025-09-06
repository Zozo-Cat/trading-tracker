"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import GridLayout, { Layout, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import WidgetChrome from "./_components/WidgetChrome";
import { widgetSizes, WidgetSlug } from "./_components/widgetSizes";
import { getWidgetSpec } from "./_components/widgetRegistry";

const RGL = WidthProvider(GridLayout);

// === LocalStorage keys (versioneret) ===
const LS_VERSION = "2";
const LS_KEYS = {
    version: "tt.dashboard.v2.version",
    widgets: "tt.dashboard.v2.widgets",
    layout: "tt.dashboard.v2.layout",
};

// === Typer ===
type WidgetInstance = {
    id: string;            // stable id = layout.i
    slug: WidgetSlug;      // reference til widgetRegistry
};

// === Utils ===
const uid = () => Math.random().toString(36).slice(2, 10);

// Seed: Default dashboard (Free)
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

function saveToLocalStorage(
    instances: WidgetInstance[],
    layout: Layout[]
) {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_KEYS.version, LS_VERSION);
    localStorage.setItem(LS_KEYS.widgets, JSON.stringify(instances));
    localStorage.setItem(LS_KEYS.layout, JSON.stringify(layout));
}

export default function DashboardPage() {
    const [editMode, setEditMode] = useState(false);
    const [{ instances, layout }, setState] = useState<{
        instances: WidgetInstance[];
        layout: Layout[];
    }>({ instances: [], layout: [] });

    const saveTimer = useRef<number | null>(null);
    const scheduleSave = (nextInstances: WidgetInstance[], nextLayout: Layout[]) => {
        if (saveTimer.current) window.clearTimeout(saveTimer.current);
        saveTimer.current = window.setTimeout(() => {
            saveToLocalStorage(nextInstances, nextLayout);
            saveTimer.current = null;
        }, 400);
    };

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

    const handleLayoutChange = (nextLayout: Layout[]) => {
        setState((prev) => {
            const next = { instances: prev.instances, layout: nextLayout };
            scheduleSave(next.instances, next.layout);
            return next;
        });
    };

    const removeWidget = (id: string) => {
        setState((prev) => {
            const nextInstances = prev.instances.filter((w) => w.id !== id);
            const nextLayout = prev.layout.filter((l) => l.i !== id);
            scheduleSave(nextInstances, nextLayout);
            return { instances: nextInstances, layout: nextLayout };
        });
    };

    const toggleLock = (id: string) => {
        setState((prev) => {
            const nextLayout = prev.layout.map((l) =>
                l.i === id ? { ...l, static: !l.static } : l
            );
            scheduleSave(prev.instances, nextLayout);
            return { instances: prev.instances, layout: nextLayout };
        });
    };

    const resetLayout = () => {
        const seeded = seedDefault();
        setState(seeded);
        saveToLocalStorage(seeded.instances, seeded.layout);
    };

    const instanceById = useMemo(() => {
        const m = new Map<string, WidgetInstance>();
        for (const w of instances) m.set(w.id, w);
        return m;
    }, [instances]);

    return (
        <div className="tt-dashboard min-h-screen p-4">
            {/* Toolbar */}
            <div className="mb-4 flex items-center gap-2 justify-between">
                <h1 className="text-xl font-bold">User Dashboard</h1>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setEditMode((v) => !v)}
                        className={`px-3 py-1.5 rounded-md text-sm border transition
              ${editMode
                            ? "border-amber-400 text-amber-300 bg-amber-500/10"
                            : "border-neutral-600 text-neutral-200 hover:bg-neutral-800"}`}
                        title={editMode ? "Afslut tilpasning" : "Tilpas layout"}
                    >
                        {editMode ? "✔ Afslut tilpasning" : "Tilpas layout"}
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

            {!editMode && (
                <div className="mb-3 text-xs text-neutral-400">
                    Layout er låst. Klik <span className="text-neutral-200">Tilpas layout</span> for at flytte/resize widgets.
                </div>
            )}

            <div className="mx-auto w-full max-w-7xl">
                <RGL
                    className="layout"
                    layout={layout}
                    cols={12}
                    rowHeight={72}               /* tightened from 86 -> 72 */
                    margin={[10, 10]}            /* tightened from [12,12] -> [10,10] */
                    compactType={null}
                    preventCollision={true}
                    isBounded={false}
                    onLayoutChange={handleLayoutChange}
                    isDraggable={editMode}
                    isResizable={editMode}
                    draggableHandle=".tt-widget-header"
                    draggableCancel="button, a, input, textarea, select"
                >
                    {layout.map((l) => {
                        const inst = instanceById.get(l.i);
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
    );
}
