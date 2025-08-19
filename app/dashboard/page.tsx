// app/dashboard/page.tsx
"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import MentorOverview, { type Mentee } from "../_components/MentorOverview";
import QuickMessage from "../_components/QuickMessage";
import SendTrade from "../_components/SendTrade";

export default function DashboardPage() {
    const { data: session } = useSession();
    const user = session?.user;
    const gold = "#D4AF37";

    const winrate = 74;
    const challengeProgress = 63;
    const tradingPlanAdherence = 85;

    const statCards = useMemo(
        () => [
            { title: "Winrate", value: `${winrate}%`, chartColor: gold, extra: ["Bedste par: EURUSD", "GBPUSD", "USDJPY"] },
            { title: "Challenge progress", value: `${challengeProgress}%`, chartColor: gold, extra: ["Challenge: 5% i 30 dage"] },
            { title: "Tradingplan overholdelse", value: `${tradingPlanAdherence}%`, chartColor: gold, extra: ["Følg SL", "Risk max 2%", "Ingen revenge trading"] },
        ],
        [winrate, challengeProgress, tradingPlanAdherence]
    );

    const DEMO_MENTEES: Mentee[] = [
        { id: "m4", name: "Signe K.", winRate: 91, tradingPlan: ["Kun A-setup", "Risk 0.5%"] },
        { id: "m1", name: "Amalie N.", winRate: 86, tradingPlan: ["Tag profit ved TP1", "Ingen news-trades"] },
        { id: "m7", name: "Eva D.", winRate: 82, tradingPlan: ["Nyheder = sidelinjen"] },
        { id: "m3", name: "Lars Ø.", winRate: 72, tradingPlan: ["Kun London session", "BE efter 1R"] },
        { id: "m6", name: "Oliver S.", winRate: 64, tradingPlan: ["Breakout kun på H1"] },
        { id: "m5", name: "Noah B.", winRate: 49, tradingPlan: ["Ingen revenge trades"] },
        { id: "m2", name: "Jonas P.", winRate: 43, tradingPlan: ["Max 2 samtidige trades"] },
    ];

    const fromUser: Mentee[] = Array.isArray((user as any)?.mentees)
        ? (user as any).mentees.map((m: any) => {
            const raw =
                typeof m.winRate === "number"
                    ? m.winRate
                    : typeof m.winrate === "number"
                        ? m.winrate
                        : typeof m.performance === "number"
                            ? m.performance
                            : 0;
            const winRate = Math.max(0, Math.min(100, Number(raw) || 0));
            const tradingPlan = Array.isArray(m?.plan?.checklist) ? m.plan.checklist.map((c: any) => c.label) : [];
            return { id: m.id, name: m.name, winRate, tradingPlan } as Mentee;
        })
        : [];

    const validUserMentees = fromUser.filter((m) => (m.winRate ?? 0) > 0);
    const mentees: Mentee[] = validUserMentees.length > 0 ? validUserMentees : DEMO_MENTEES;

    const handleSendTrade = (payload: any) => {
        try {
            const uid = (user?.id || "anon") as string;
            const KEY = `tt_signals_${uid}`;
            const now = new Date().toISOString();
            const existing = JSON.parse(localStorage.getItem(KEY) || "[]");
            const arr = Array.isArray(existing) ? existing : [];
            const newSignal = {
                id: `sig-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`,
                type: String(payload?.type || "BUY NOW").toUpperCase(),
                symbol: String(payload?.symbol || "").toUpperCase(),
                entry: payload?.entry != null ? Number(payload.entry) : null,
                stop: payload?.stop != null ? Number(payload.stop) : null,
                tps: Array.isArray(payload?.tps)
                    ? payload.tps.map((p: any, i: number) => ({ id: `tp-${Date.now()}-${i}`, price: p }))
                    : [{ id: `tp-${Date.now()}`, price: null }],
                traderTag: user?.name || "Ukendt",
                strategyTag: payload?.strategy || "Dashboard",
                includeTrader: true,
                includeStrategy: true,
                channels: ["ch-signals"],
                note: payload?.note || "",
                useEmojiDecorations: true,
                createdAt: now,
                updatedAt: now,
                status: "ACTIVE",
                history: [{ at: now, message: "Signal sendt (fra Dashboard)" }],
            };
            localStorage.setItem(KEY, JSON.stringify([newSignal, ...arr].slice(0, 200)));
        } catch (e) {
            console.error("[SEND TRADE] failed:", e);
        }
    };

    return (
        <div className="p-4 space-y-6">
            {/* Stat cards */}
            {/* … behold resten af rendering uændret … */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-900 rounded-xl p-4">
                    <h2 className="text-lg font-semibold text-white mb-2">Hurtig besked</h2>
                    <QuickMessage />
                </div>
                <div className="bg-neutral-900 rounded-xl p-4">
                    <h2 className="text-lg font-semibold text-white mb-2">Send trade</h2>
                    <SendTrade onSend={handleSendTrade} />
                </div>
            </div>
        </div>
    );
}
