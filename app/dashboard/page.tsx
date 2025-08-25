"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import CustomizeLayoutModal from "./_components/CustomizeLayoutModal";
import { WIDGETS, getWidgetMeta, COMPONENTS } from "./_components/widgetRegistry";

const RGL = dynamic(
    async () => {
        const mod = await import("react-grid-layout");
        return mod.WidthProvider(mod.default);
    },
    { ssr: false }
);

type GridItem = { i: string; x?: number; y?: number; w?: number; h?: number; static?: boolean };
type GridLayoutT = Required<GridItem>[];

const STORAGE_KEY = "tt_dash_layout_v2";

// grid
const GRID = {
    cols: 12,
    rowHeight: 86,
    margin: [12, 12] as [number, number],
    containerPadding: [6, 6] as [number, number],
    isResizable: false,
    isBounded: true,
    draggableCancel: ".tt-no-drag",
};

// sikre tal + default
const norm = (it: GridItem): Required<GridItem> => ({
    i: it.i,
    x: Number.isFinite(it.x as number) ? (it.x as number) : 0,
    y: Number.isFinite(it.y as number) ? (it.y as number) : Infinity,
    w: Number.isFinite(it.w as number) ? (it.w as number) : 3,
    h: Number.isFinite(it.h as number) ? (it.h as number) : 1,
    static: !!it.static,
});

/** Fjern trailing index og skilletegn + migrér gamle nøgle-navne til nye. */
const LEGACY_MAP: Record<string, string> = {
    // ældre navne vi så i billeder/kode
    plan: "planScorecard",
    scorecard: "planScorecard",
    planAndScorecard: "planScorecard",
    // hvis nogen gamle varianter forekommer
    upcomingNews: "upcomingNews",
    todaysTrades: "tradesToday",
    unnamed: "unnamedTrades",
};

function normalizeBaseKey(id: string): string {
    // fjern trailing index og skilletegn (…-1, …_2, …#3, …01)
    const base = id.replace(/[-_#]*\d+$/g, "");
    return LEGACY_MAP[base] ?? base;
}

function buildDefaultLayout(): GridLayoutT {
    const items: GridLayoutT = [];
    let x = 0;
    let y = 0;
    for (const w of WIDGETS) {
        const [ww, hh] = w.size || [3, 1];
        if (x + ww > GRID.cols) {
            x = 0;
            y += 2;
        }
        items.push(norm({ i: w.key + "1", x, y, w: ww, h: hh }));
        x += ww;
    }
    return items;
}

function loadLayout(): GridLayoutT {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return buildDefaultLayout();
        const parsed = JSON.parse(raw) as GridItem[];
        if (!Array.isArray(parsed)) return buildDefaultLayout();

        // migrér: ret basekeys + sørg for gyldige numre
        const migrated = parsed.map((p, idx) => {
            const item = norm(p);
            const base = normalizeBaseKey(item.i);
            // hvis base ikke findes i registret, lad den være (så man kan se “Ukendt…”)
            const meta = getWidgetMeta(base);
            const fixedId = meta ? `${base}${(item.i.match(/\d+$/)?.[0] ?? "1")}` : item.i;
            return { ...item, i: fixedId };
        });

        return migrated.map(norm);
    } catch {
        return buildDefaultLayout();
    }
}

function saveLayout(layout: GridLayoutT) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

export default function DashboardPage() {
    const [layout, setLayout] = useState<GridLayoutT>([]);
    const [mounted, setMounted] = useState(false);
    const [showCustomize, setShowCustomize] = useState(false);

    useEffect(() => {
        setMounted(true);
        setLayout(loadLayout());
    }, []);

    useEffect(() => {
        if (!mounted) return;
        saveLayout(layout);
    }, [layout, mounted]);

    function resetLayout() {
        const d = buildDefaultLayout();
        setLayout(d);
    }

    if (!mounted) {
        return <main className="p-6 text-neutral-300">Indlæser…</main>;
    }

    return (
        <main className="p-4">
            <div className="mb-3 flex items-center justify-end gap-2">
                <button
                    className="px-3 py-1.5 rounded border border-neutral-700 text-sm hover:bg-white/5"
                    onClick={resetLayout}
                >
                    Gendan layout
                </button>
                <button
                    className="px-3 py-1.5 rounded border border-neutral-700 text-sm hover:bg-white/5"
                    onClick={() => setShowCustomize(true)}
                >
                    Tilpas layout
                </button>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-[#111] p-2">
                {/* @ts-ignore */}
                <RGL
                    cols={GRID.cols}
                    rowHeight={GRID.rowHeight}
                    margin={GRID.margin}
                    containerPadding={GRID.containerPadding}
                    isResizable={GRID.isResizable}
                    isBounded={GRID.isBounded}
                    draggableCancel={GRID.draggableCancel}
                    layout={layout.map(norm)}
                    onLayoutChange={(next: GridItem[]) => setLayout(next.map(norm))}
                >
                    {layout.map((raw) => {
                        const item = norm(raw);
                        const baseKey = normalizeBaseKey(item.i);
                        const Cmp = COMPONENTS[baseKey];
                        const meta = getWidgetMeta(baseKey);

                        return (
                            <div key={item.i} data-grid={item} className="rounded-lg overflow-hidden">
                                {Cmp ? (
                                    <Cmp />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-neutral-400 border border-neutral-800 rounded-lg">
                                        Ukendt widget: {baseKey}
                                        {meta ? ` (${meta.title})` : null}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </RGL>
            </div>

            {showCustomize && (
                <CustomizeLayoutModal
                    onClose={() => {
                        setShowCustomize(false);
                        setLayout(loadLayout());
                    }}
                />
            )}
        </main>
    );
}
