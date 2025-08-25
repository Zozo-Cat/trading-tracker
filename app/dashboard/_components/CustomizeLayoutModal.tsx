"use client";

import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { WIDGETS, type WidgetMeta, getWidgetMeta } from "./widgetRegistry";

type GridItem = { i: string; x?: number; y?: number; w?: number; h?: number; static?: boolean };
type GridLayoutT = Required<GridItem>[];

const STORAGE_KEY = "tt_dash_layout_v2";

const GRID = { cols: 12 };

const norm = (it: GridItem): Required<GridItem> => ({
    i: it.i,
    x: Number.isFinite(it.x as number) ? (it.x as number) : 0,
    y: Number.isFinite(it.y as number) ? (it.y as number) : Infinity,
    w: Number.isFinite(it.w as number) ? (it.w as number) : 3,
    h: Number.isFinite(it.h as number) ? (it.h as number) : 1,
    static: !!it.static,
});

const LEGACY_MAP: Record<string, string> = {
    plan: "planScorecard",
    scorecard: "planScorecard",
    planAndScorecard: "planScorecard",
    upcomingNews: "upcomingNews",
    todaysTrades: "tradesToday",
    unnamed: "unnamedTrades",
};
const normalizeBaseKey = (id: string) => {
    const base = id.replace(/[-_#]*\d+$/g, "");
    return LEGACY_MAP[base] ?? base;
};

// layout I/O
function loadLayout(): GridLayoutT {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as GridItem[];
        if (!Array.isArray(parsed)) return [];
        const migrated = parsed.map((p) => {
            const it = norm(p);
            const base = normalizeBaseKey(it.i);
            const meta = getWidgetMeta(base);
            const fixed = meta ? `${base}${(it.i.match(/\d+$/)?.[0] ?? "1")}` : it.i;
            return { ...it, i: fixed };
        });
        return migrated.map(norm);
    } catch {
        return [];
    }
}
function saveLayout(layout: GridLayoutT) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

// grupper WIDGETS pr. kategori
function groupByCategory(list: WidgetMeta[]) {
    const map = new Map<string, WidgetMeta[]>();
    for (const w of list) {
        const arr = map.get(w.category) || [];
        arr.push(w);
        map.set(w.category, arr);
    }
    // stabil sortering
    for (const [k, arr] of map) arr.sort((a, b) => a.title.localeCompare(b.title));
    return Array.from(map.entries());
}

export default function CustomizeLayoutModal({
                                                 onClose,
                                             }: {
    onClose: () => void;
}) {
    const [open, setOpen] = useState(true);
    const [preview, setPreview] = useState<GridLayoutT>(() => loadLayout());
    const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set()); // accordion

    // helper: næste index for en base key
    const nextIndex = (base: string) => {
        const used = preview
            .map((p) => p.i)
            .filter((id) => normalizeBaseKey(id) === base)
            .map((id) => Number(id.match(/\d+$/)?.[0] ?? 0));
        const max = used.length ? Math.max(...used) : 0;
        return String(max + 1);
    };

    const addWidget = (meta: WidgetMeta) => {
        const [w, h] = meta.size;
        // find placering: simpelt flow – læg sidst i preview
        const i = `${meta.key}${nextIndex(meta.key)}`;
        const lastY = preview.length ? Math.max(...preview.map((p) => p.y + p.h)) : 0;
        const item = norm({ i, x: 0, y: lastY, w, h });
        setPreview((p) => [...p, item]);
    };

    const removeWidget = (id: string) => {
        setPreview((p) => p.filter((x) => x.i !== id));
    };

    const move = (id: string, dir: -1 | 1) => {
        // enkel reordering i liste (kun i UI; grid placering justeres ved gem)
        const idx = preview.findIndex((x) => x.i === id);
        if (idx < 0) return;
        const next = [...preview];
        const newIdx = Math.min(preview.length - 1, Math.max(0, idx + dir));
        const [row] = next.splice(idx, 1);
        next.splice(newIdx, 0, row);
        setPreview(next);
    };

    const grouped = useMemo(() => groupByCategory(WIDGETS), []);

    const toggleCat = (name: string) => {
        setCollapsed((s) => {
            const n = new Set(s);
            n.has(name) ? n.delete(name) : n.add(name);
            return n;
        });
    };

    const handleSave = () => {
        // simple “pack”: læg elementer i rækker à 12
        let x = 0;
        let y = 0;
        const packed = preview.map((raw) => {
            const it = norm(raw);
            const base = normalizeBaseKey(it.i);
            const meta = getWidgetMeta(base);
            const w = Math.min(it.w, 12);
            const h = meta?.size?.[1] ?? it.h;
            if (x + w > 12) {
                x = 0;
                y += 1;
            }
            const out = { ...it, w, h, x, y };
            x += w;
            return out;
        });
        saveLayout(packed);
        setOpen(false);
        onClose();
    };

    const handleClose = () => {
        setOpen(false);
        onClose();
    };

    return (
        <Transition show={open} as={Fragment} appear>
            <Dialog onClose={handleClose} className="fixed inset-0 z-[100]">
                <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
                <div className="absolute inset-0 flex items-start justify-center p-6">
                    <Dialog.Panel className="w-full max-w-[1200px] rounded-xl border border-neutral-800 bg-[#171515] text-white shadow-2xl">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                            <div className="text-sm font-medium">Tilpas layout</div>
                            <div className="flex gap-2">
                                <button
                                    className="px-3 py-1.5 rounded border border-neutral-700 text-sm hover:bg-white/5"
                                    onClick={() => {
                                        localStorage.removeItem(STORAGE_KEY);
                                        setPreview([]);
                                    }}
                                >
                                    Gendan standard
                                </button>
                                <button
                                    className="px-3 py-1.5 rounded border border-neutral-700 text-sm hover:bg-white/5"
                                    onClick={handleSave}
                                >
                                    Gem & luk
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-[320px_1fr] gap-4 p-4">
                            {/* Venstre: kategorier */}
                            <aside className="rounded-lg border border-neutral-800">
                                <ul className="divide-y divide-neutral-800">
                                    {grouped.map(([cat, items]) => {
                                        const isClosed = collapsed.has(cat);
                                        return (
                                            <li key={cat}>
                                                <button
                                                    className="w-full flex items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-white/5"
                                                    onClick={() => toggleCat(cat)}
                                                >
                                                    <span className="font-medium">{cat}</span>
                                                    <span className="text-xs text-neutral-400">{isClosed ? "Vis" : "Skjul"}</span>
                                                </button>
                                                {!isClosed && (
                                                    <div className="p-2 grid grid-cols-1 gap-2">
                                                        {items.map((m) => (
                                                            <div
                                                                key={m.key}
                                                                className="rounded border border-neutral-700 bg-[#1c1919] px-2 py-2"
                                                                style={{ lineHeight: 1.15 }}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="text-[13px] font-medium">{m.title}</div>
                                                                    <button
                                                                        className="px-2 py-0.5 rounded text-[12px] border border-neutral-600 hover:bg-white/5"
                                                                        onClick={() => addWidget(m)}
                                                                    >
                                                                        Tilføj
                                                                    </button>
                                                                </div>
                                                                <div className="mt-1 text-[11px] text-neutral-400">
                                                                    {m.size[0]}×{m.size[1]} · {m.plan}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </aside>

                            {/* Højre: preview (kompakt) */}
                            <section className="rounded-lg border border-neutral-800 p-3">
                                {preview.length === 0 ? (
                                    <div className="h-[420px] flex items-center justify-center text-neutral-400 text-sm">
                                        Ingen widgets endnu – tilføj fra venstre.
                                    </div>
                                ) : (
                                    <ul className="grid grid-cols-12 auto-rows-[74px] gap-2">
                                        {preview.map((it) => {
                                            const base = normalizeBaseKey(it.i);
                                            const meta = getWidgetMeta(base);
                                            const w = (meta?.size?.[0] ?? it.w) * 1; // 1 kolonne = 1 grid col
                                            const h = (meta?.size?.[1] ?? it.h) * 74; // 74px per række
                                            return (
                                                <li
                                                    key={it.i}
                                                    className="rounded border border-neutral-700 bg-[#1b1818] p-2 flex flex-col justify-between"
                                                    style={{ gridColumn: `span ${Math.min(w, 12)}`, height: h }}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-[13px] font-medium truncate">
                                                            {meta?.title ?? base} <span className="text-neutral-500 text-[11px]">{it.i}</span>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                className="px-2 py-0.5 rounded text-[11px] border border-neutral-600 hover:bg-white/5"
                                                                onClick={() => move(it.i, -1)}
                                                            >
                                                                ↑
                                                            </button>
                                                            <button
                                                                className="px-2 py-0.5 rounded text-[11px] border border-neutral-600 hover:bg-white/5"
                                                                onClick={() => move(it.i, +1)}
                                                            >
                                                                ↓
                                                            </button>
                                                            <button
                                                                className="px-2 py-0.5 rounded text-[11px] border border-neutral-600 hover:bg-white/5 text-red-300"
                                                                onClick={() => removeWidget(it.i)}
                                                            >
                                                                Fjern
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="text-[11px] text-neutral-400">
                                                        {meta ? `${meta.size[0]}×${meta.size[1]}` : `${it.w}×${it.h}`}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </section>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </Transition>
    );
}
