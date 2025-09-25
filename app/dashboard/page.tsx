// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { widgetSizes, WidgetSlug } from "./_components/widgetSizes";
import { widgetRegistry } from "./_components/widgetRegistry";
import CustomizeLayoutModal from "./_components/CustomizeLayoutModal";
import DashboardHeader from "./_components/DashboardHeader";

const ResponsiveGridLayout = WidthProvider(Responsive);

/* ====== Layout constants ====== */
const COLS = 12;
const ROW_HEIGHT = 72;
/** Horisontal = 16px, Vertikal = 0px (tætte rækker) */
const MARGIN: [number, number] = [16, 0];
/** Bund-padding så sidste række ikke støder på footeren */
const CONTAINER_PADDING: [number, number] = [0, 24];

/* ===================== LocalStorage ====================== */
const LS_KEY_LAYOUT = "tt.dashboard.v2.layout";
const LS_KEY_WIDGETS = "tt.dashboard.v2.widgets";
// Vi opretholder version-nøglen hvis andre steder læser den, men vi bruger den IKKE til at reseede her:
const LS_KEY_VERSION = "tt.dashboard.v2.version";

/* ===================== Types ====================== */
export type Layout = {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    static?: boolean;
};

type WidgetInstance = {
    id: string;
    type: WidgetSlug;
    title?: string;
};

/** En “row” er et array af “stacks”; hver stack er 1..n widgets ovenpå hinanden i samme kolonne. */
type Row = WidgetSlug[][];

/* ===================== Seed default (kompakt; ingen mellemrum) ====================== */
function seedDefaultFree(): { instances: WidgetInstance[]; layout: Layout[] } {
    const rows: Row[] = [
        // Række 1 (≈5 høj)
        [
            ["successRate", "profitLoss"],           // 2 + 3
            ["riskReward", "tradesCount"],           // 2 + 3
            ["accountGrowth", "sessionPerformance"], // 2 + 3
            ["upcomingNews"],                        // 5
        ],
        // Række 2 (8 høj)
        [
            ["discipline"],                          // 8
            ["marketSessions", "unnamedTrades"],     // 4 + 4
            ["challenges", "tradingGoals"],          // 4 + 4
        ],
    ];
    return packRowsWithStacks(rows);
}

/* ===================== Pack helper (row + stacks) ====================== */
function packRowsWithStacks(
    rows: Row[]
): { instances: WidgetInstance[]; layout: Layout[] } {
    let y = 0;
    const instances: WidgetInstance[] = [];
    const layout: Layout[] = [];

    for (const stacks of rows) {
        let x = 0;
        let rowMaxH = 0;

        for (const stack of stacks) {
            const colW = Math.max(...stack.map((s) => widgetSizes[s].w));
            let yOffsetInCol = 0;

            for (const slug of stack) {
                const size = widgetSizes[slug];
                const id = `w-${slug}-${instances.length}`;

                layout.push({
                    i: id,
                    x,
                    y: y + yOffsetInCol,
                    w: size.w,
                    h: size.h,
                    static: true, // låst grid i live-view
                });

                instances.push({
                    id,
                    type: slug,
                    title: widgetRegistry[slug]?.title,
                });

                yOffsetInCol += size.h;
            }

            const stackHeight = stack.reduce((sum, s) => sum + widgetSizes[s].h, 0);
            rowMaxH = Math.max(rowMaxH, stackHeight);
            x += colW;
        }

        y += rowMaxH;
    }

    return { instances, layout };
}

export default function DashboardPage() {
    const [instances, setInstances] = useState<WidgetInstance[]>([]);
    const [layout, setLayout] = useState<Layout[]>([]);
    const [isCustomizeOpen, setCustomizeOpen] = useState(false);

    // Helper: læs det, der ligger i LS, og sæt state
    const applyFromLocalStorage = () => {
        const savedLayout = localStorage.getItem(LS_KEY_LAYOUT);
        const savedWidgets = localStorage.getItem(LS_KEY_WIDGETS);
        if (savedLayout && savedWidgets) {
            setLayout(JSON.parse(savedLayout));
            setInstances(JSON.parse(savedWidgets));
        }
    };

    useEffect(() => {
        // 1) Hvis der allerede ER et layout i LS, brug det (rør IKKE ved det)
        const savedLayout = localStorage.getItem(LS_KEY_LAYOUT);
        const savedWidgets = localStorage.getItem(LS_KEY_WIDGETS);

        if (savedLayout && savedWidgets) {
            setLayout(JSON.parse(savedLayout));
            setInstances(JSON.parse(savedWidgets));
            return;
        }

        // 2) Første gangs load (intet i LS) → seed og skriv
        const seeded = seedDefaultFree();
        setInstances(seeded.instances);
        setLayout(seeded.layout);
        localStorage.setItem(LS_KEY_LAYOUT, JSON.stringify(seeded.layout));
        localStorage.setItem(LS_KEY_WIDGETS, JSON.stringify(seeded.instances));
        if (!localStorage.getItem(LS_KEY_VERSION)) {
            localStorage.setItem(LS_KEY_VERSION, "1");
        }
    }, []);

    return (
        <div className="tt-dashboard p-4 pb-8">
            <DashboardHeader onCustomize={() => setCustomizeOpen(true)} />

            <ResponsiveGridLayout
                className="layout"
                rowHeight={ROW_HEIGHT}
                cols={{ lg: COLS, md: COLS, sm: 6, xs: 4, xxs: 2 }}
                margin={MARGIN}
                containerPadding={CONTAINER_PADDING}
                isDraggable={false}
                isResizable={false}
                preventCollision
                compactType={null}
                layouts={{ lg: layout }}
            >
                {instances.map((inst) => {
                    const spec = widgetRegistry[inst.type];
                    if (!spec) return null;
                    const Comp = spec.component;
                    return (
                        <div key={inst.id} className="tt-grid-content">
                            <Comp instanceId={inst.id} />
                        </div>
                    );
                })}
            </ResponsiveGridLayout>

            {isCustomizeOpen && (
                <CustomizeLayoutModal
                    open={isCustomizeOpen}
                    onClose={() => setCustomizeOpen(false)}
                    onSave={(newInstances, newLayout) => {
                        // Gem præcis det, modalen giver os (samme struktur/type som resten af appen)
                        localStorage.setItem(LS_KEY_LAYOUT, JSON.stringify(newLayout));
                        localStorage.setItem(LS_KEY_WIDGETS, JSON.stringify(newInstances));
                        // Opdater dashboardet med det samme
                        applyFromLocalStorage();
                        setCustomizeOpen(false);
                    }}
                />
            )}
        </div>
    );
}
