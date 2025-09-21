// app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import GridLayout, { Layout, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { widgetSizes, WidgetSlug } from "./_components/widgetSizes";
import { getWidgetSpec } from "./_components/widgetRegistry";
import CustomizeLayoutModal from "./_components/CustomizeLayoutModal";

const RGL = WidthProvider(GridLayout);

/* ================= Grid-consts (ens højde, tæt spacing) ================= */
const COLS = 12;
const ROW_HEIGHT = 72;                   // 1 “grid-række” i px
const MARGIN: [number, number] = [12, 12]; // afstand mellem celler
const CONTAINER_PADDING: [number, number] = [0, 0];

/* ===================== LocalStorage (bump VERSION) ====================== */
const LS_VERSION = "5"; // <- bump for at tvinge nyt seed efter ændringer
const LS_KEYS = {
    version: "tt.dashboard.v2.version",
    widgets: "tt.dashboard.v2.widgets",
    layout: "tt.dashboard.v2.layout",
};

/* ================================= Typer ================================ */
type WidgetInstance = {
    id: string;         // stable id = layout.i
    slug: WidgetSlug;   // reference til registry
};

/* =============================== Utils ================================= */
const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Lægger widgets i rækker a’ 12 kolonner.
 * y øges med HØJESTE h i rækker, så der aldrig bliver overlap.
 */
function packLayout(slugsLeftToRight: WidgetSlug[]): { instances: WidgetInstance[]; layout: Layout[] } {
    const instances: WidgetInstance[] = [];
    const layout: Layout[] = [];

    let cursorX = 0;
    let cursorY = 0;
    let rowMaxH = 0;

    for (const slug of slugsLeftToRight) {
        const size = widgetSizes[slug] ?? { w: 3, h: 2, minH: 2, maxH: 2 };
        const w = Math.min(size.w ?? 3, COLS);
        const h = Math.max(1, size.h ?? 2);

        // wrap til ny række hvis ikke plads
        if (cursorX + w > COLS) {
            cursorX = 0;
            cursorY += rowMaxH; // hop ned med forrige rækkes max-h
            rowMaxH = 0;
        }

        const id = `${slug}-${uid()}`;
        instances.push({ id, slug });

        layout.push({ i: id, x: cursorX, y: cursorY, w, h, static: false });

        cursorX += w;
        rowMaxH = Math.max(rowMaxH, h);
    }

    // ikke strengt nødvendigt at flushe sidste række, da RGL ikke bruger det,
    // men det gør ingen skade at lade det være.
    return { instances, layout };
}

/**
 * Migrér/ret et eksisterende layout så w/h matcher låste sizes (minH/maxH).
 * Sikrer faste højder = samme pixelhøjde ved samme h.
 */
function sanitizeLayout(instances: WidgetInstance[], layout: Layout[]): Layout[] {
    const byId = new Map(instances.map((w) => [w.id, w.slug] as const));
    return layout.map((l) => {
        const slug = byId.get(l.i) ?? ("filler" as WidgetSlug);
        const s = widgetSizes[slug];
        if (!s) return l;
        const w = Math.min(s.w ?? l.w, COLS);
        const h = Math.max(1, s.h ?? l.h);
        const minH = s.minH ?? h;
        const maxH = s.maxH ?? h;
        return { ...l, w, h: Math.max(minH, Math.min(h, maxH)) };
    });
}

/* =========================== Default Free layout ======================== */
/**
 * Free default (række-ordre = venstre→højre, top→bund)
 * – Tilpas rækkernes slugs så de svarer til dine ønskede rækker.
 * – Selve w/h styres i widgetSizes.
 */
function seedDefaultFree(): { instances: WidgetInstance[]; layout: Layout[] } {
    // Row 1: 4x stats
    const row1: WidgetSlug[] = [
        "successRate",
        "riskReward",
        "accountGrowth",
        "streaks",
    ];

    // Row 2 (team-conditional):
    // Hvis brugeren er i team -> Community widgets øverst;
    // Ellers -> dags-trades + journal-genvej.
    const inTeam = false; // TODO: sæt denne dynamisk når du har brugerdata
    const row2: WidgetSlug[] = inTeam
        ? ["communitySignals", "teamAnnouncements"] // forventes w=6 h=3 hver
        : ["todaysTrades", "tradingJournalShortcut"]; // w=6 h=3 hver

    // Row 3: små KPI/utility (hver w=3 h=2)
    const row3: WidgetSlug[] = [
        "profitLoss",
        "tradesCount",
        "sessionPerformance",
        "dailyReminder",
    ];

    // Row 4: plan + velkomst + sessions + scorecard
    const row4: WidgetSlug[] = [
        "tradingPlan",
        "welcome",
        "sessionsTimeline",
        "scorecard",
    ];

    // Row 5: unavngivne + news + challenges
    const row5: WidgetSlug[] = [
        "unnamedTrades",
        "upcomingNews",
        "challenges",
    ];

    const order = [...row1, ...row2, ...row3, ...row4, ...row5];
    return packLayout(order);
}

/* ======================= LocalStorage load/save ========================= */
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

        // basic sanity: alle layout.i skal findes i instances
        const ids = new Set(instances.map((w) => w.id));
        if (!layout.every((l) => ids.has(l.i))) return null;

        // Lås w/h til widgetSizes for faste højder
        const sanitized = sanitizeLayout(instances, layout);
        return { instances, layout: sanitized };
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

/* ================================ Page ================================== */
export default function DashboardPage() {
    // Live state (vises på dashboardet)
    const [{ instances, layout }, setState] = useState<{
        instances: WidgetInstance[];
        layout: Layout[];
    }>({ instances: [], layout: [] });

    // Modal open/close
    const [customizeOpen, setCustomizeOpen] = useState(false);

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
            const seeded = seedDefaultFree();
            setState(seeded);
            saveToLocalStorage(seeded.instances, seeded.layout);
        }
    }, []);

    // Opslagstabel
    const instanceById = useMemo(() => {
        const m = new Map<string, WidgetInstance>();
        for (const w of instances) m.set(w.id, w);
        return m;
    }, [instances]);

    // live layout change (drag/resize er deaktiveret her)
    const handleLayoutChange = (nextLayout: Layout[]) => {
        setState((prev) => {
            const sanitized = sanitizeLayout(prev.instances, nextLayout);
            const nextState = { instances: prev.instances, layout: sanitized };
            scheduleSave(nextState.instances, nextState.layout);
            return nextState;
        });
    };

    // Nulstil → seed igen (sikrer default free layout)
    const resetLayout = () => {
        const seeded = seedDefaultFree();
        setState(seeded);
        saveToLocalStorage(seeded.instances, seeded.layout);
    };

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
                Layout er låst. Klik <span className="text-neutral-200">Tilpas layout</span> for at ændre widget-placering.
            </div>

            {/* Fuldbredde grid */}
            <div className="w-full">
                <RGL
                    className="layout"
                    layout={layout}
                    cols={COLS}
                    rowHeight={ROW_HEIGHT}
                    margin={MARGIN}
                    containerPadding={CONTAINER_PADDING}
                    compactType={null}             // ingen auto-komprimering
                    preventCollision={true}        // undgå overlap
                    isBounded={false}
                    onLayoutChange={handleLayoutChange}
                    isDraggable={false}            // live = låst
                    isResizable={false}            // live = låst
                    draggableHandle=".tt-widget-header"
                    draggableCancel="button, a, input, textarea, select"
                >
                    {layout.map((l) => {
                        const inst = instanceById.get(l.i);
                        const slug = inst?.slug ?? "filler";
                        const spec = getWidgetSpec(slug);

                        // VIGTIGT: INGEN ekstra chrome/ramme her (widgets tegner selv deres container)
                        return (
                            <div key={l.i}>
                                {spec.component({ instanceId: l.i })}
                            </div>
                        );
                    })}
                </RGL>
            </div>

            {/* Customize modal (styrer egen grid) */}
            <CustomizeLayoutModal
                open={customizeOpen}
                onClose={() => setCustomizeOpen(false)}
                onSave={(inst, lay) => {
                    // Lås w/h til widgetSizes ved gem
                    const sanitized = sanitizeLayout(inst, lay);
                    setState({ instances: inst, layout: sanitized });
                    saveToLocalStorage(inst, sanitized);
                }}
            />
        </div>
    );
}
