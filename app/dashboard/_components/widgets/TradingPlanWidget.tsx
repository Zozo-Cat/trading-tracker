"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

type Props = { instanceId: string };

type Severity = "hard" | "soft";
type Rule = { id: string; label: string; severity: Severity };
type Plan = { id: string; name: string; rules: Rule[] };

/** Eksempel-regler (katalog) */
const RULE_CATALOG: Array<{ label: string; severity: Severity }> = [
    { label: "Risiko ≤ 1–2% pr. trade", severity: "hard" },
    { label: "Min. R/R ≥ 1:2 ved entry", severity: "hard" },
    { label: "Kun handle whitelisted instrumenter", severity: "hard" },
    { label: "Ingen trades ±30 min før røde nyheder", severity: "hard" },
    { label: "Følg tidsvinduer (fx 08–11, 14–16)", severity: "soft" },
    { label: "Setup skal være valgt/tagget", severity: "soft" },
    { label: "Screenshot før entry", severity: "soft" },
    { label: "Flyt SL til BE først efter 1R", severity: "soft" },
    { label: "Max 3 trades pr. dag", severity: "soft" },
    { label: "Journal-notat inden entry", severity: "soft" },
    { label: "Ingen revenge-trades", severity: "hard" },
    { label: "Scalping kun under høj likviditet", severity: "soft" },
];

/** Syntetiske planer (deterministisk pr. instance) */
function synthPlans(instanceId: string): Plan[] {
    const rng = seededRng(`${instanceId}::tplans`);
    const names = ["Global", "Scalping", "Egen analyse"];
    const count = 2 + Math.floor(rng() * 2); // 2..3

    const plans: Plan[] = [];
    for (let p = 0; p < count; p++) {
        const name = names[p % names.length];

        // Vælg op til 10 regler deterministisk
        const ruleCount = 7 + Math.floor(rng() * 4); // 7..10
        const picked = [...RULE_CATALOG].sort(() => (rng() < 0.5 ? -1 : 1)).slice(0, ruleCount);

        plans.push({
            id: `plan-${p}`,
            name,
            rules: picked.map((r, i) => ({
                id: `${name}-${i}`,
                label: r.label,
                severity: r.severity,
            })),
        });
    }
    return plans;
}

export default function TradingPlanWidget({ instanceId }: Props) {
    const plans = useMemo(() => synthPlans(instanceId), [instanceId]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id);
    const selected = plans.find((p) => p.id === selectedPlanId) ?? plans[0];

    const showSelector = plans.length > 1;
    const rules = (selected?.rules ?? []).slice(0, 10);
    const hasRules = rules.length > 0;

    return (
        <div
            className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800 max-w-[720px]" // ~halv bredde visuelt
            id={`${instanceId}-tradingplan`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium">Tradingplan</div>
                    <HelpTip text="Dine vigtigste regler. Scorecard måler efterlevelse automatisk. Du kan have flere planer og skifte imellem dem." />
                </div>

                <div className="flex items-center gap-2">
                    {showSelector && (
                        <select
                            value={selected?.id}
                            onChange={(e) => setSelectedPlanId(e.target.value)}
                            className="bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1 text-xs"
                            title="Vælg plan"
                        >
                            {plans.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    )}

                    <Link
                        href="/tradingplan"
                        className="text-xs px-2 py-1 rounded-md border border-neutral-600 text-neutral-200 hover:bg-neutral-800"
                        title="Åbn fuld tradingplan"
                    >
                        Åbn fuld plan
                    </Link>
                    <Link
                        href="/tradingplan/edit"
                        className="text-xs px-2 py-1 rounded-md border border-neutral-600 text-neutral-200 hover:bg-neutral-800"
                        title="Redigér tradingplan"
                    >
                        Redigér
                    </Link>
                </div>
            </div>

            {/* Liste med nummerering (ingen soft/hard & ingen procenttal) */}
            {!hasRules ? (
                <div className="h-24 rounded-lg border border-dashed border-neutral-700 flex items-center justify-center text-neutral-400 text-sm">
                    Ingen regler i denne plan endnu.
                </div>
            ) : (
                <ul className="space-y-2">
                    {rules.map((r, idx) => (
                        <li
                            key={r.id}
                            className="flex items-center gap-3 rounded-lg border border-neutral-800 px-3 py-2"
                        >
                            <NumberBadge n={idx + 1} />
                            <span className="text-sm text-neutral-200">{r.label}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/* UI: lille nummer-badge */
function NumberBadge({ n }: { n: number }) {
    return (
        <span
            className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-neutral-600 bg-neutral-900 text-neutral-200 text-xs shrink-0"
            aria-hidden
        >
      {n}
    </span>
    );
}
