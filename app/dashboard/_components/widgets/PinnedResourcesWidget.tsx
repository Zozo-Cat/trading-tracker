"use client";

import { useMemo } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

/**
 * Pinned Resources
 * - Op til 6 links (grid) med type-tag
 * - "Administrér" link til /resources
 */

type Props = { instanceId: string };

type Res = {
    id: string;
    title: string;
    kind: "PDF" | "Video" | "Artikel" | "Link";
    url: string;
};

const TITLES = [
    "Risk Management Guide (PDF)",
    "Order Blocks 101 (Video)",
    "Trading Plan Template",
    "Journal Best Practices",
    "Session Checklist",
    "Macro Calendar Cheatsheet",
    "Breakout Strategy – notes",
    "Prop Firm Rules – summary",
];

export default function PinnedResourcesWidget({ instanceId }: Props) {
    const rows = useMemo<Res[]>(() => {
        const rng = seededRng(`${instanceId}::pinned`);
        const pick = [...TITLES]
            .map((t) => ({ t, r: rng() }))
            .sort((a, b) => a.r - b.r)
            .slice(0, 6)
            .map((x, i) => x.t);

        const kinds: Res["kind"][] = ["PDF", "Video", "Artikel", "Link"];
        return pick.map((t, i) => ({
            id: `${i}`,
            title: t,
            kind: kinds[Math.floor(rng() * kinds.length)],
            url: "#",
        }));
    }, [instanceId]);

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Pinned Resources</div>
                    <HelpTip text="Hurtig adgang til dine vigtigste links, dokumenter og videoer." />
                </div>
                <a
                    href="/resources"
                    className="text-xs text-neutral-200 border border-neutral-600 rounded-md px-2 py-1 hover:bg-neutral-800"
                >
                    Administrér
                </a>
            </div>

            {rows.length === 0 ? (
                <div className="h-20 rounded-lg border border-dashed border-neutral-700 flex items-center justify-center text-neutral-400 text-sm">
                    Ingen ressourcer fastgjort endnu.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {rows.map((r) => (
                        <a
                            key={r.id}
                            href={r.url}
                            className="rounded-lg border border-neutral-700 p-3 hover:bg-neutral-800/50 transition"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="text-sm text-neutral-200 line-clamp-2">{r.title}</div>
                                <span
                                    className={`px-2 py-0.5 rounded-full border text-[10px] ${
                                        r.kind === "PDF"
                                            ? "border-rose-600/50 text-rose-200 bg-rose-600/20"
                                            : r.kind === "Video"
                                                ? "border-emerald-600/50 text-emerald-200 bg-emerald-600/20"
                                                : r.kind === "Artikel"
                                                    ? "border-amber-600/50 text-amber-200 bg-amber-600/20"
                                                    : "border-neutral-600/50 text-neutral-200 bg-neutral-700/20"
                                    }`}
                                >
                  {r.kind}
                </span>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
