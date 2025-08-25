// app/dashboard/_components/layout-helpers.ts
"use client";

import { WIDGETS, CATEGORIES, getWidgetMeta } from "./widgetRegistry";

/** Public plan-type (valgfri brug) */
export type Plan = "free" | "premium" | "pro";

/** Visnings-kategorier i fast rækkefølge (labels = samme som i venstre panel) */
export const CATEGORY_ORDER: string[] = [
    "Stats",
    "Kerne",
    "Konti & Risiko",
    "Nyheder & Kalender",
    "Mål & fremdrift",
    "Mentor & community",
    "Insights",
    "Personligt",
];

/** Et katalog‑item til venstre panel */
export type CatalogItem = {
    id: string;              // base id (fx "news", "plan", "stats")
    title: string;           // visningsnavn
    w: number;
    h: number;
    categoryLabel: string;   // fx "Nyheder & Kalender"
    mandatory?: boolean;     // påkrævet (kan flyttes, ikke fjernes)
    planBadge?: "premium" | "pro" | null; // badge i UI
};

/** Konverterer WIDGETS -> katalog (venstre panel) */
export const catalog: CatalogItem[] = WIDGETS.map((w) => {
    const meta = getWidgetMeta(w.id)!; // findes pr. definition
    const categoryLabel = CATEGORIES[w.category as keyof typeof CATEGORIES] ?? w.category;
    const planBadge =
        w.locked === "Pro" ? "pro" : w.locked === "Premium" ? "premium" : null;

    return {
        id: w.id,
        title: meta.title,
        w: meta.w,
        h: meta.h,
        categoryLabel,
        mandatory: !!meta.mandatory,
        planBadge,
    };
});

/** Grupperer kataloget efter visnings‑kategori */
export function groupByCategory(items: CatalogItem[]) {
    const map = new Map<string, CatalogItem[]>();
    CATEGORY_ORDER.forEach((cat) => map.set(cat, []));
    for (const it of items) {
        if (!map.has(it.categoryLabel)) map.set(it.categoryLabel, []);
        map.get(it.categoryLabel)!.push(it);
    }
    return map;
}

/** Simpel mapper til badge‑tekst i UI */
export function planBadge(it: CatalogItem): "premium" | "pro" | null {
    return it.planBadge ?? null;
}

/** Stats meta: hvor mange stats findes i layout + hvilket næste id skal bruges */
export function statsMeta(layoutIds: string[]) {
    const used = new Set(layoutIds.filter((id) => id.startsWith("stats#")));
    let n = 1;
    while (used.has(`stats#${n}`)) n++;
    return {
        count: used.size,
        nextId: `stats#${n}`,
    };
}
