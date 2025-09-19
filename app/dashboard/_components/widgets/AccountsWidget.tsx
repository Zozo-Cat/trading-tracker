"use client";

import { useMemo } from "react";
import HelpTip from "../HelpTip";
import { seededRng } from "../seededRandom";

/**
 * AccountsWidget ("Mine konti")
 * - Viser et kompakt overblik over tilknyttede konti
 * - Summerer "Samlet equity" + små nøgletal
 * - Liste med konto-rækker (broker, navn, type, equity, dagens P/L, MTD %)
 * - Hydration-safe demo-data (seeded)
 *
 * VIGTIGT: Ingen yder-ramme. Denne komponent returnerer KUN content,
 * da /dashboard pakker den i WidgetChrome (titel + hjælpetekst).
 */

type Props = { instanceId: string };

type AccountType = "Real" | "Demo" | "Prop/Challenge";
type Account = {
    id: string;
    broker: string;
    name: string;
    type: AccountType;
    currency: "USD" | "EUR" | "DKK";
    balance: number;
    equity: number;
    plToday: number; // i kontoens valuta
    mtdPct: number; // måned-til-dato i %
    connected: boolean;
    default?: boolean;
};

const BASE_UTC = Date.UTC(2024, 6, 1, 8, 0, 0, 0); // fast anker (2024-07-01 08:00Z)

export default function AccountsWidget({ instanceId }: Props) {
    const rng = useMemo(() => seededRng(`${instanceId}::accounts`), [instanceId]);

    const accounts = useMemo<Account[]>(() => seedAccounts(rng), [rng]);

    const totalEquity = useMemo(
        () => Math.round(accounts.reduce((s, a) => s + a.equity, 0)),
        [accounts]
    );
    const totalPlToday = useMemo(
        () => Math.round(accounts.reduce((s, a) => s + fxToUSD(a.plToday, a.currency), 0)),
        [accounts]
    );
    const avgMtd = useMemo(() => {
        if (!accounts.length) return 0;
        return (
            accounts.reduce((s, a) => s + a.mtdPct, 0) / accounts.length
        );
    }, [accounts]);

    return (
        <div className="space-y-4">
            {/* header-info kommer fra WidgetChrome – vi viser kun en lille intro-tekst her hvis ønsket */}
            <div className="text-sm text-neutral-300 -mt-1 flex items-center gap-2">
                Overblik over tilknyttede konti.
                <HelpTip text="Se dine konti, deres equity og udvikling. Tilføj eller administrér konti fra Min side." />
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
                <Kpi label="Samlet equity (est. USD)" value={usd(totalEquity)} />
                <Kpi label="Dagens P/L (USD est.)" value={plStr(totalPlToday)} tone={totalPlToday >= 0 ? "pos" : "neg"} />
                <Kpi label="MTD (gennemsnit)" value={`${avgMtd.toFixed(1).replace(".", ",")}%`} tone={avgMtd >= 0 ? "pos" : "neg"} />
            </div>

            {/* Liste */}
            <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-lg overflow-hidden">
                {accounts.map((a) => (
                    <div key={a.id} className="p-3 flex items-center gap-3">
                        {/* Status-dot */}
                        <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                                a.connected ? "bg-emerald-500" : "bg-neutral-600"
                            }`}
                            title={a.connected ? "Forbundet" : "Offline"}
                        />

                        {/* Broker + navn */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <div className="font-medium truncate">{a.name}</div>
                                <TypeBadge type={a.type} />
                                {a.default ? (
                                    <span className="text-xs text-neutral-400 border border-neutral-700 rounded px-1.5 py-0.5">
                    Default
                  </span>
                                ) : null}
                            </div>
                            <div className="text-xs text-neutral-400">{a.broker} • {a.currency}</div>
                        </div>

                        {/* Tal */}
                        <div className="w-28 text-right">
                            <div className="text-sm text-neutral-200">{money(a.equity, a.currency)}</div>
                            <div className={`text-xs ${a.plToday >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {plMoney(a.plToday, a.currency)}
                            </div>
                        </div>

                        <div className="w-20 text-right">
                            <div className={`text-sm ${a.mtdPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {a.mtdPct.toFixed(1).replace(".", ",")}%
                            </div>
                            <div className="text-[11px] text-neutral-400">MTD</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* CTA’er (routing kobles på senere) */}
            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    className="px-2.5 py-1.5 rounded-md text-xs border border-neutral-600 text-neutral-200 hover:bg-neutral-800"
                    onClick={() => {}}
                >
                    Administrér konti
                </button>
                <button
                    type="button"
                    className="px-2.5 py-1.5 rounded-md text-xs border border-emerald-600 text-emerald-200 hover:bg-emerald-900/30"
                    onClick={() => {}}
                >
                    Tilføj konto
                </button>
            </div>
        </div>
    );
}

/* ====== UI helpers ====== */
function Kpi({
                 label,
                 value,
                 tone,
             }: {
    label: string;
    value: string;
    tone?: "pos" | "neg";
}) {
    const color =
        tone === "pos" ? "text-emerald-300" : tone === "neg" ? "text-red-300" : "text-neutral-100";
    return (
        <div className="rounded-lg border border-neutral-800 p-3">
            <div className="text-xs text-neutral-400">{label}</div>
            <div className={`text-lg font-semibold ${color}`}>{value}</div>
        </div>
    );
}

function TypeBadge({ type }: { type: AccountType }) {
    const map: Record<AccountType, string> = {
        Real: "border-emerald-700 text-emerald-300",
        Demo: "border-neutral-600 text-neutral-300",
        "Prop/Challenge": "border-amber-700 text-amber-300",
    };
    return (
        <span className={`text-xs border rounded px-1.5 py-0.5 ${map[type]}`}>{type}</span>
    );
}

/* ====== Demo seed ====== */

function seedAccounts(rng: () => number): Account[] {
    const brokers = ["IC Markets", "FTMO", "Eightcap", "Pepperstone"];
    const types: AccountType[] = ["Real", "Prop/Challenge", "Demo", "Real"];

    const accs: Account[] = [];
    for (let i = 0; i < 4; i++) {
        const base = 10000 + Math.floor(rng() * 20000); // 10k–30k
        const mtd = (rng() - 0.45) * 6; // ca -2.7%..+3.3%
        const plToday = Math.round((rng() - 0.5) * 300); // -150..+150 i lokal valuta
        const equity = Math.round(base * (1 + mtd / 100) + plToday);

        const currency: Account["currency"] = rng() > 0.8 ? "EUR" : rng() > 0.5 ? "USD" : "DKK";

        accs.push({
            id: `acc-${i}`,
            broker: brokers[i % brokers.length],
            name: i === 0 ? "Main Account" : i === 1 ? "Prop 50k" : i === 2 ? "Swing (demo)" : "Scalp",
            type: types[i % types.length],
            currency,
            balance: base,
            equity,
            plToday,
            mtdPct: mtd,
            connected: rng() > 0.15,
            default: i === 0,
        });
    }
    return accs;
}

/* ====== Formatting helpers ====== */
function usd(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function money(n: number, ccy: Account["currency"]) {
    return new Intl.NumberFormat(ccy === "DKK" ? "da-DK" : ccy === "EUR" ? "de-DE" : "en-US", {
        style: "currency",
        currency: ccy,
        maximumFractionDigits: 0,
    }).format(n);
}
function plMoney(n: number, ccy: Account["currency"]) {
    const s = n >= 0 ? "+" : "";
    return s + money(Math.abs(n), ccy);
}
function plStr(n: number) {
    const s = n >= 0 ? "+" : "";
    return s + usd(Math.abs(n));
}
function fxToUSD(amount: number, ccy: Account["currency"]) {
    // simple demo fx
    if (ccy === "USD") return amount;
    if (ccy === "EUR") return amount * 1.08;
    if (ccy === "DKK") return amount * 0.14;
    return amount;
}
