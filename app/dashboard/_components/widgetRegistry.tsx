"use client";

import { widgetSizes, WidgetSlug } from "./widgetSizes";
import { ReactNode } from "react";

export type WidgetSpec = {
    slug: WidgetSlug;
    title: string;
    description: string;
    category: string;
    defaultSize: { w: number; h: number };
    tier?: "free" | "premium" | "pro";
    component: (props: { instanceId: string }) => ReactNode; // returns CONTENT ONLY (no chrome)
};

// Simple placeholder factory
const P = (label: string) =>
    function Placeholder() {
        return (
            <div className="text-sm text-neutral-400">
                {label} – indhold kommer senere
            </div>
        );
    };

// Complete registry
export const widgetRegistry: Record<WidgetSlug, WidgetSpec> = {
    /* -------- System / Fallback -------- */
    filler: {
        slug: "filler",
        title: "Ukendt Widget",
        description: "Fallback når en widget ikke findes i registry",
        category: "System",
        defaultSize: widgetSizes.filler,
        component: ({}) => (
            <div className="text-sm text-red-400">
                Filler widget – mangler i registry
            </div>
        ),
    },

    /* -------- :bar_chart: Stats -------- */
    successRate: {
        slug: "successRate",
        title: "Succesrate",
        description: "Andel af vundne handler",
        category: "Stats",
        defaultSize: widgetSizes.successRate,
        component: P("Succesrate"),
    },
    profitLoss: {
        slug: "profitLoss",
        title: "Profit / Loss",
        description: "Overskud eller tab i perioden",
        category: "Stats",
        defaultSize: widgetSizes.profitLoss,
        component: P("Profit / Loss"),
    },
    tradesCount: {
        slug: "tradesCount",
        title: "Antal handler",
        description: "Samlet antal handler i perioden",
        category: "Stats",
        defaultSize: widgetSizes.tradesCount,
        component: P("Antal handler"),
    },
    riskReward: {
        slug: "riskReward",
        title: "R/R (gennemsnit)",
        description: "Gennemsnitligt risk/reward-forhold",
        category: "Stats",
        defaultSize: widgetSizes.riskReward,
        component: P("R/R (gennemsnit)"),
    },
    expectancy: {
        slug: "expectancy",
        title: "Expectancy (EV)",
        description: "Forventet værdi pr. trade",
        category: "Stats",
        defaultSize: widgetSizes.expectancy,
        component: P("Expectancy (EV)"),
    },
    drawdown: {
        slug: "drawdown",
        title: "Drawdown",
        description: "Maks. og aktuel drawdown",
        category: "Stats",
        defaultSize: widgetSizes.drawdown,
        component: P("Drawdown"),
    },
    streaks: {
        slug: "streaks",
        title: "Streaks",
        description: "W/L streak badges",
        category: "Stats",
        defaultSize: widgetSizes.streaks,
        component: P("Streaks"),
    },
    accountGrowth: {
        slug: "accountGrowth",
        title: "Kontovækst %",
        description: "Kontoens procentvise vækst",
        category: "Stats",
        defaultSize: widgetSizes.accountGrowth,
        component: P("Kontovækst %"),
    },
    sessionPerformance: {
        slug: "sessionPerformance",
        title: "Session performance",
        description: "Segmenteret performance pr. session",
        category: "Stats",
        defaultSize: widgetSizes.sessionPerformance,
        component: P("Session performance"),
    },
    sharpeSortino: {
        slug: "sharpeSortino",
        title: "Sharpe / Sortino",
        description: "Risikojusteret afkast",
        category: "Stats",
        defaultSize: widgetSizes.sharpeSortino,
        component: P("Sharpe / Sortino"),
    },
    setupDistribution: {
        slug: "setupDistribution",
        title: "Setup-distribution",
        description: "Fordeling på setups",
        category: "Stats",
        defaultSize: widgetSizes.setupDistribution,
        component: P("Setup-distribution"),
    },
    newsVsNoNews: {
        slug: "newsVsNoNews",
        title: "News vs. no-news",
        description: "Performance med/uden nyheder",
        category: "Stats",
        defaultSize: widgetSizes.newsVsNoNews,
        component: P("News vs. no-news"),
    },
    customKpi: {
        slug: "customKpi",
        title: "Custom KPI",
        description: "Egen defineret metrik",
        category: "Stats",
        defaultSize: widgetSizes.customKpi,
        component: P("Custom KPI"),
    },

    /* -------- :jigsaw: Kerne -------- */
    tradingPlanScorecard: {
        slug: "tradingPlanScorecard",
        title: "Tradingplan & Scorecard",
        description: "Dine kerneprincipper og scorecard",
        category: "Kerne",
        defaultSize: widgetSizes.tradingPlanScorecard,
        component: P("Tradingplan & Scorecard"),
    },
    todaysTrades: {
        slug: "todaysTrades",
        title: "Dagens trades",
        description: "Åbne og nyeste handler i dag",
        category: "Kerne",
        defaultSize: widgetSizes.todaysTrades,
        component: P("Dagens trades"),
    },
    unnamedTrades: {
        slug: "unnamedTrades",
        title: "Unavngivne trades",
        description: "Hurtig tagging/navngivning af trades",
        category: "Kerne",
        defaultSize: widgetSizes.unnamedTrades,
        component: P("Unavngivne trades"),
    },

    /* -------- :credit_card: Konti & Risiko -------- */
    accounts: {
        slug: "accounts",
        title: "Mine konti",
        description: "Overblik over konti",
        category: "Konti & Risiko",
        defaultSize: widgetSizes.accounts,
        component: P("Mine konti"),
    },
    challenges: {
        slug: "challenges",
        title: "Challenges",
        description: "Prop-firm udfordringer (med donut)",
        category: "Konti & Risiko",
        defaultSize: widgetSizes.challenges,
        component: P("Challenges"),
    },

    /* -------- :newspaper: Nyheder & Kalender -------- */
    newsList: {
        slug: "newsList",
        title: "News (seneste 5)",
        description: "Seneste nyheder",
        category: "Nyheder & Kalender",
        defaultSize: widgetSizes.newsList,
        component: P("News (seneste 5)"),
    },
    upcomingNews: {
        slug: "upcomingNews",
        title: "Upcoming High-Impact News",
        description: "Næste vigtige events (6–7)",
        category: "Nyheder & Kalender",
        defaultSize: widgetSizes.upcomingNews,
        component: P("Upcoming High-Impact News"),
    },

    /* -------- :dart: Mål & fremdrift -------- */
    tradingGoals: {
        slug: "tradingGoals",
        title: "Trading Goals",
        description: "Mål og fremdrift",
        category: "Mål & fremdrift",
        defaultSize: widgetSizes.tradingGoals,
        component: P("Trading Goals"),
    },

    /* -------- :busts_in_silhouette: Mentor & Community -------- */
    mentorFeedback: {
        slug: "mentorFeedback",
        title: "Mentor feedback",
        description: "Seneste noter og feedback",
        category: "Mentor & Community",
        defaultSize: widgetSizes.mentorFeedback,
        component: P("Mentor feedback"),
    },
    notifications: {
        slug: "notifications",
        title: "Notifikationscenter",
        description: "System- og konto-notifikationer",
        category: "Mentor & Community",
        defaultSize: widgetSizes.notifications,
        component: P("Notifikationscenter"),
    },

    /* -------- :brain: Insights (Premium/Pro) -------- */
    autoInsights: {
        slug: "autoInsights",
        title: "Automatiske Insights",
        description: "Auto-genererede indsigter (Pro)",
        category: "Insights",
        defaultSize: widgetSizes.autoInsights,
        tier: "pro",
        component: P("Automatiske Insights"),
    },
    newsVsPerformance: {
        slug: "newsVsPerformance",
        title: "News vs. Performance (mini)",
        description: "Sammenhæng mellem nyheder og performance",
        category: "Insights",
        defaultSize: widgetSizes.newsVsPerformance,
        tier: "pro",
        component: P("News vs. Performance (mini)"),
    },

    /* -------- :star2: Personligt -------- */
    welcome: {
        slug: "welcome",
        title: "Velkomsthilsen",
        description: "Personlige hilsner og onboarding",
        category: "Personligt",
        defaultSize: widgetSizes.welcome,
        component: P("Velkomsthilsen"),
    },
    gamification: {
        slug: "gamification",
        title: "Gamification",
        description: "Streaks og badges",
        category: "Personligt",
        defaultSize: widgetSizes.gamification,
        component: P("Gamification"),
    },
} as const;

// Hjælpere
export const getWidgetSpec = (slug: WidgetSlug): WidgetSpec =>
    widgetRegistry[slug] ?? widgetRegistry.filler;

export const allWidgetSlugs = Object.keys(widgetRegistry) as WidgetSlug[];
