"use client";

import { widgetSizes, WidgetSlug } from "./widgetSizes";
import WidgetChrome from "./WidgetChrome";
import { ReactNode } from "react";

// WidgetSpec beskriver hver widget i registret
export type WidgetSpec = {
    slug: WidgetSlug;
    title: string;
    description: string;
    category: string;
    defaultSize: { w: number; h: number };
    tier?: "free" | "premium" | "pro";
    component: (props: { instanceId: string }) => ReactNode;
};

// Simpel placeholder-komponent til nu
function Placeholder({ title }: { title: string }) {
    return (
        <div className="text-sm text-neutral-400">
            {title} – indhold kommer senere
        </div>
    );
}

// Registry over widgets
export const widgetRegistry: Record<WidgetSlug, WidgetSpec> = {
    filler: {
        slug: "filler",
        title: "Ukendt Widget",
        description: "Fallback når en widget ikke findes",
        category: "system",
        defaultSize: widgetSizes.filler,
        component: ({ instanceId }) => (
            <WidgetChrome title="Ukendt Widget">
                <div className="text-red-400 text-sm">
                    Filler widget – mangler i registry (id: {instanceId})
                </div>
            </WidgetChrome>
        ),
    },

    successRate: {
        slug: "successRate",
        title: "Succesrate",
        description: "Andel af vundne handler",
        category: "Stats",
        defaultSize: widgetSizes.successRate,
        component: () => <Placeholder title="Succesrate" />,
    },

    profitLoss: {
        slug: "profitLoss",
        title: "Profit / Loss",
        description: "Overskud eller tab",
        category: "Stats",
        defaultSize: widgetSizes.profitLoss,
        component: () => <Placeholder title="Profit/Loss" />,
    },

    tradesCount: {
        slug: "tradesCount",
        title: "Antal handler",
        description: "Samlet antal handler",
        category: "Stats",
        defaultSize: widgetSizes.tradesCount,
        component: () => <Placeholder title="Antal handler" />,
    },

    // ... resten tilføjes efter samme mønster
} as const;
