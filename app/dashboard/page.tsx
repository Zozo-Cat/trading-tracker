"use client";

import { useEffect, useState } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import WidgetChrome from "./_components/WidgetChrome";

export default function DashboardPage() {
    const [layout, setLayout] = useState<Layout[]>([]);
    const [editMode, setEditMode] = useState(false); // ← KUN i Tilpas må man trække/resize

    // Seed layout (for nu bare én widget)
    useEffect(() => {
        const defaultLayout: Layout[] = [{ i: "demo", x: 0, y: 0, w: 4, h: 2 }];
        setLayout(defaultLayout);
    }, []);

    const handleLayoutChange = (newLayout: Layout[]) => {
        setLayout(newLayout);
    };

    return (
        <div className="tt-dashboard min-h-screen bg-neutral-900 text-white p-4">
            {/* Toolbar */}
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-bold">User Dashboard (v2 baseline)</h1>
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
            </div>

            {/* Hint når låst */}
            {!editMode && (
                <div className="mb-3 text-xs text-neutral-400">
                    Layout er låst. Klik <span className="text-neutral-200">Tilpas layout</span> for at flytte/resize widgets.
                </div>
            )}

            <GridLayout
                className="layout"
                layout={layout}
                cols={12}
                rowHeight={86}
                width={1200}
                margin={[12, 12]}
                compactType={null}
                preventCollision={true}
                isBounded={false}
                onLayoutChange={handleLayoutChange}
                isDraggable={editMode}                              // ← kun i Tilpas
                isResizable={editMode}                              // ← kun i Tilpas
                draggableHandle=".tt-widget-header"                 // træk i header
                draggableCancel="button, a, input, textarea, select"
            >
                <div key="demo">
                    <WidgetChrome title="Demo Widget" helpText="Dette er en placeholder widget">
                        <div className="text-sm text-neutral-300">
                            Indholdet af widgetten kan skiftes senere.
                        </div>
                    </WidgetChrome>
                </div>
            </GridLayout>
        </div>
    );
}
