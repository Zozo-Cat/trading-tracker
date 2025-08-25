"use client";

import React, { useState } from "react";
import {
    CATEGORY_ORDER,
    catalog,
    groupByCategory,
    planBadge,
    statsMeta,
    type CatalogItem,
} from "./layout-helpers";

type Props = {
    layoutIds: string[];
    onAddWidget: (id: string) => void;
};

export default function CustomizeLeftPanel({ layoutIds, onAddWidget }: Props) {
    const grouped = groupByCategory(catalog);

    // collapsed state per category label
    const [open, setOpen] = useState<Record<string, boolean>>(() => {
        // Open only the first few by default to avoid a tall menu
        const defaults: Record<string, boolean> = {};
        CATEGORY_ORDER.forEach((c, idx) => (defaults[c] = idx < 2)); // open first 2
        defaults["Stats"] = true; // keep Stats visible (compact anyway)
        return defaults;
    });

    const toggle = (cat: string) => setOpen((s) => ({ ...s, [cat]: !s[cat] }));

    return (
        <aside className="w-[320px] shrink-0 border-r border-yellow-700/30 pr-3 max-h-[76vh] overflow-auto">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-yellow-200/80">
                Vælg kategori
            </div>

            {/* Stats meta-widget (always shown, very compact) */}
            <section className="mb-3">
                <div className="flex items-center justify-between">
                    <div className="mb-1 font-medium text-yellow-100">Stats</div>
                </div>
                {(() => {
                    const sm = statsMeta(layoutIds);
                    return (
                        <div className="flex items-center justify-between rounded-lg border border-yellow-700/40 bg-black/30 px-2 py-2">
                            <div className="text-sm">
                                <span className="font-medium">Stats</span>{" "}
                                <span className="text-xs text-yellow-200/70">(3×1)</span>{" "}
                                <span className="ml-1 rounded bg-yellow-600/20 px-1.5 py-0.5 text-[10px] text-yellow-200">
                  {sm.count}
                </span>
                            </div>
                            <button
                                className="rounded-lg border border-yellow-600/40 px-2 py-1 text-xs text-yellow-200 hover:bg-yellow-600/10"
                                onClick={() => onAddWidget(sm.nextId)}
                                title="Tilføjer næste ledige stat"
                            >
                                Tilføj stat
                            </button>
                        </div>
                    );
                })()}
            </section>

            {/* Other categories – collapsible */}
            {CATEGORY_ORDER.filter((c) => c !== "Stats").map((cat) => {
                const items = grouped.get(cat) ?? [];
                if (!items.length) return null;

                return (
                    <section key={cat} className="mb-2">
                        <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-md border border-yellow-700/40 bg-black/30 px-2 py-2"
                            onClick={() => toggle(cat)}
                            aria-expanded={!!open[cat]}
                        >
                            <span className="font-medium text-yellow-100">{cat}</span>
                            <span className="text-xs text-yellow-200/70">
                {open[cat] ? "Skjul" : "Vis"}
              </span>
                        </button>

                        {open[cat] && (
                            <div className="mt-2 grid grid-cols-1 gap-2">
                                {items.map((it) => (
                                    <WidgetChip key={it.id} item={it} onAdd={onAddWidget} />
                                ))}
                            </div>
                        )}
                    </section>
                );
            })}
        </aside>
    );
}

function WidgetChip({
                        item,
                        onAdd,
                    }: {
    item: CatalogItem;
    onAdd: (id: string) => void;
}) {
    const badge = planBadge(item);
    return (
        <div className="flex items-center justify-between rounded-lg border border-yellow-700/40 bg-black/30 px-2 py-2">
            <div className="min-w-0">
                <div className="flex items-center gap-1 text-sm">
                    <span className="truncate font-medium">{item.title}</span>
                    {item.mandatory && (
                        <span className="ml-1 rounded bg-yellow-600/20 px-1.5 py-0.5 text-[10px] text-yellow-200">
              Påkrævet
            </span>
                    )}
                    {badge && (
                        <span className="ml-1 rounded bg-yellow-600/20 px-1.5 py-0.5 text-[10px] text-yellow-200">
              {badge === "pro" ? "PRO" : "Premium"}
            </span>
                    )}
                </div>
                <div className="text-xs text-yellow-200/70">
                    {item.w}×{item.h}
                </div>
            </div>

            <button
                className="rounded-lg border border-yellow-600/40 px-2 py-1 text-xs text-yellow-200 hover:bg-yellow-600/10"
                onClick={() => onAdd(item.id)}
                title="Tilføj widget"
            >
                Tilføj
            </button>
        </div>
    );
}
