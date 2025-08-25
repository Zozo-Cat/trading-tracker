"use client";
import DashboardCard from "../DashboardCard";

type Acct = { id: string; name: string; balance: number; plToday: number };

export default function AccountsWidget() {
    const accts: Acct[] = [
        { id: "a1", name: "Hovedkonto", balance: 12500, plToday: +140 },
        { id: "a2", name: "Swing",      balance:  6200, plToday:  -35 },
        { id: "a3", name: "Index",      balance:  2800, plToday:  +12 },
    ];

    return (
        <DashboardCard title="Mine konti" subtitle={<span className="text-[11px] text-neutral-400">Balance & P/L i dag (demo)</span>}>
            <div className="space-y-2">
                {accts.map(a => (
                    <div key={a.id} className="flex items-center justify-between rounded border border-neutral-800 bg-neutral-900/60 px-3 py-2">
                        <div className="text-white text-sm">{a.name}</div>
                        <div className="text-[12px] text-neutral-300">Balance: {a.balance.toLocaleString("da-DK")} $</div>
                        <div className={`text-[12px] ${a.plToday >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {a.plToday >= 0 ? "+" : ""}{a.plToday.toLocaleString("da-DK")} $
                        </div>
                    </div>
                ))}
            </div>
        </DashboardCard>
    );
}
