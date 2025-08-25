"use client";

/**
 * Registry for widgets:
 * - WIDGETS: meta til venstre-listen (titel, størrelse, kategori, plan)
 * - getWidgetMeta(key): find meta ud fra "base key"
 * - COMPONENTS: map fra base key -> React komponent
 *
 * Keys her skal matche dine widget-komponenter.
 */

import dynamic from "next/dynamic";
import React from "react";

// Dine widgets (du har allerede disse filer):
import WelcomeWidget from "./widgets/WelcomeWidget";
import StatsWidget from "./widgets/StatsWidget";
import NewsWidget from "./widgets/NewsWidget";
import UpcomingNewsWidget from "./widgets/UpcomingNewsWidget";
import TradesTodayWidget from "./widgets/TradesTodayWidget";
import UnnamedTradesWidget from "./widgets/UnnamedTradesWidget";
import AccountsWidget from "./widgets/AccountsWidget";
import ChallengesWidget from "./widgets/ChallengesWidget";
import InsightsWidget from "./widgets/InsightsWidget";
import MentorFeedbackWidget from "./widgets/MentorFeedbackWidget";
import GamificationWidget from "./widgets/GamificationWidget";
import GoalsWidget from "./widgets/GoalsWidget";
import TradingPlanWidget from "./widgets/TradingPlanWidget";

/* ─────────────────────────────────────────────────────────────────────────── */

export type WidgetTier = "Free" | "Premium" | "Pro";

export type WidgetMeta = {
    key: string;               // base key, fx "news"
    title: string;             // visningsnavn
    size: [number, number];    // default w,h i gridpoint
    category: string;          // venstre-liste sektion
    plan: WidgetTier;          // Free / Premium / Pro (til badge)
};

export const WIDGETS: WidgetMeta[] = [
    // Stats
    {
        key: "stats",
        title: "Stat (vælg KPI i boksen)",
        size: [3, 1],
        category: "Stats",
        plan: "Free",
    },

    // Kerne
    {
        key: "welcome",
        title: "Velkomst-hilsen",
        size: [4, 2],
        category: "Kerne",
        plan: "Free",
    },
    {
        key: "planScorecard",
        title: "Tradingplan & Scorecard",
        size: [6, 2],
        category: "Kerne",
        plan: "Free",
    },
    {
        key: "tradesToday",
        title: "Dagens trades",
        size: [4, 1],
        category: "Kerne",
        plan: "Free",
    },
    {
        key: "unnamedTrades",
        title: "Unavngivne trades",
        size: [6, 1],
        category: "Kerne",
        plan: "Free",
    },
    {
        key: "challenges",
        title: "Challenges",
        size: [3, 1],
        category: "Kerne",
        plan: "Free",
    },

    // Konti & Risiko
    {
        key: "accounts",
        title: "Mine konti",
        size: [4, 1],
        category: "Konti & Risiko",
        plan: "Free",
    },

    // Nyheder & Kalender
    {
        key: "upcomingNews",
        title: "Upcoming High-Impact News",
        size: [4, 1],
        category: "Nyheder & Kalender",
        plan: "Free",
    },
    {
        key: "news",
        title: "News",
        size: [4, 2],
        category: "Nyheder & Kalender",
        plan: "Free",
    },

    // Mål & fremdrift
    {
        key: "goals",
        title: "Trading Goals",
        size: [4, 1],
        category: "Mål & fremdrift",
        plan: "Free",
    },

    // Mentor & community
    {
        key: "mentorFeedback",
        title: "Mentor feedback",
        size: [4, 1],
        category: "Mentor & community",
        plan: "Premium",
    },
    {
        key: "gamification",
        title: "Gamification",
        size: [4, 1],
        category: "Mentor & community",
        plan: "Premium",
    },

    // Insights
    {
        key: "insights",
        title: "Automatiske Insights",
        size: [4, 1],
        category: "Insights (Premium/Pro)",
        plan: "Premium",
    },
];

/** Find meta for en base-key. */
export function getWidgetMeta(key: string): WidgetMeta | undefined {
    return WIDGETS.find((w) => w.key === key);
}

/** Base key -> React komponent.  */
export const COMPONENTS: Record<string, React.ComponentType<any>> = {
    welcome: WelcomeWidget,
    stats: StatsWidget,
    news: NewsWidget,
    upcomingNews: UpcomingNewsWidget,
    tradesToday: TradesTodayWidget,
    unnamedTrades: UnnamedTradesWidget,
    accounts: AccountsWidget,
    challenges: ChallengesWidget,
    insights: InsightsWidget,
    mentorFeedback: MentorFeedbackWidget,
    gamification: GamificationWidget,
    goals: GoalsWidget,
    planScorecard: TradingPlanWidget,
};
