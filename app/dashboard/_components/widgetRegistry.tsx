"use client";

import { ReactNode } from "react";
import { widgetSizes, WidgetSlug } from "./widgetSizes";

export type WidgetSpec = {
    slug: WidgetSlug;
    title: string;
    description: string;
    category: string;
    defaultSize: { w: number; h: number };
    tier?: "free" | "premium" | "pro";
    component: (props: { instanceId: string }) => ReactNode; // content-only (vores widgets har egen chrome pt.)
};

// ---------- Helpers ----------
const P =
    (label: string) =>
        function Placeholder() {
            return <div className="text-sm text-neutral-400">{label} – indhold kommer senere</div>;
        };

// ---------- Importer implementerede widgets ----------
import SuccessRateWidget from "./widgets/SuccessRateWidget";
import ProfitLossWidget from "./widgets/ProfitLossWidget";
import TradesCountWidget from "./widgets/TradesCountWidget";
import RiskRewardWidget from "./widgets/RiskRewardWidget";
import ExpectancyWidget from "./widgets/ExpectancyWidget";
import DrawdownWidget from "./widgets/DrawdownWidget";
import StreaksWidget from "./widgets/StreaksWidget";
import AccountGrowthWidget from "./widgets/AccountGrowthWidget";
import SessionPerformanceWidget from "./widgets/SessionPerformanceWidget";
import SharpeSortinoWidget from "./widgets/SharpeSortinoWidget";
import SetupDistributionWidget from "./widgets/SetupDistributionWidget";
import NewsVsNoNewsWidget from "./widgets/NewsVsNoNewsWidget";
import VolatilityWidget from "./widgets/VolatilityWidget";
import TradeDurationWidget from "./widgets/TradeDurationWidget";
import PerformanceVsExpectancyWidget from "./widgets/PerformanceVsExpectancyWidget";
import RiskPerTradeWidget from "./widgets/RiskPerTradeWidget";
import ConsistencyWidget from "./widgets/ConsistencyWidget";

// ---------- Registry ----------
export const widgetRegistry: Record<WidgetSlug, WidgetSpec> = {
    /* -------- System / Fallback -------- */
    filler: {
        slug: "filler",
        title: "Ukendt Widget",
        description: "Fallback når en widget ikke findes i registry",
        category: "System",
        defaultSize: widgetSizes.filler,
        component: P("Filler widget – mangler i registry"),
    },

    /* -------- :bar_chart: Stats -------- */
    successRate: {
        slug: "successRate",
        title: "Succesrate",
        description: "Andel af vundne handler",
        category: "Stats",
        defaultSize: widgetSizes.successRate,
        component: ({ instanceId }) => <SuccessRateWidget instanceId={instanceId} />,
    },
    profitLoss: {
        slug: "profitLoss",
        title: "Profit / Loss",
        description: "Overskud eller tab i perioden",
        category: "Stats",
        defaultSize: widgetSizes.profitLoss,
        component: ({ instanceId }) => <ProfitLossWidget instanceId={instanceId} />,
    },
    tradesCount: {
        slug: "tradesCount",
        title: "Antal handler",
        description: "Samlet antal handler i perioden",
        category: "Stats",
        defaultSize: widgetSizes.tradesCount,
        component: ({ instanceId }) => <TradesCountWidget instanceId={instanceId} />,
    },
    riskReward: {
        slug: "riskReward",
        title: "R/R (gennemsnit)",
        description: "Gennemsnitligt risk/reward-forhold",
        category: "Stats",
        defaultSize: widgetSizes.riskReward,
        component: ({ instanceId }) => <RiskRewardWidget instanceId={instanceId} />,
    },
    expectancy: {
        slug: "expectancy",
        title: "Expectancy (EV)",
        description: "Forventet værdi pr. trade",
        category: "Stats",
        defaultSize: widgetSizes.expectancy,
        component: ({ instanceId }) => <ExpectancyWidget instanceId={instanceId} />,
    },
    drawdown: {
        slug: "drawdown",
        title: "Drawdown",
        description: "Maks. og aktuel drawdown",
        category: "Stats",
        defaultSize: widgetSizes.drawdown,
        component: ({ instanceId }) => <DrawdownWidget instanceId={instanceId} />,
    },
    streaks: {
        slug: "streaks",
        title: "Streaks",
        description: "W/L streak badges",
        category: "Stats",
        defaultSize: widgetSizes.streaks,
        component: ({ instanceId }) => <StreaksWidget instanceId={instanceId} />,
    },
    accountGrowth: {
        slug: "accountGrowth",
        title: "Kontovækst %",
        description: "Kontoens procentvise vækst",
        category: "Stats",
        defaultSize: widgetSizes.accountGrowth,
        component: ({ instanceId }) => <AccountGrowthWidget instanceId={instanceId} />,
    },
    sessionPerformance: {
        slug: "sessionPerformance",
        title: "Session performance",
        description: "Segmenteret performance pr. session",
        category: "Stats",
        defaultSize: widgetSizes.sessionPerformance,
        component: ({ instanceId }) => <SessionPerformanceWidget instanceId={instanceId} />,
    },
    sharpeSortino: {
        slug: "sharpeSortino",
        title: "Sharpe / Sortino",
        description: "Risikojusteret afkast",
        category: "Stats",
        defaultSize: widgetSizes.sharpeSortino,
        component: ({ instanceId }) => <SharpeSortinoWidget instanceId={instanceId} />,
    },
    setupDistribution: {
        slug: "setupDistribution",
        title: "Setup-distribution",
        description: "Fordeling på setups",
        category: "Stats",
        defaultSize: widgetSizes.setupDistribution,
        component: ({ instanceId }) => <SetupDistributionWidget instanceId={instanceId} />,
    },
    newsVsNoNews: {
        slug: "newsVsNoNews",
        title: "News vs. no-news",
        description: "Performance med/uden nyheder",
        category: "Stats",
        defaultSize: widgetSizes.newsVsNoNews,
        component: ({ instanceId }) => <NewsVsNoNewsWidget instanceId={instanceId} />,
    },
    volatility: {
        slug: "volatility",
        title: "Volatility",
        description: "Standardafvigelse af afkast i valgt periode",
        category: "Stats",
        defaultSize: widgetSizes.volatility,
        component: ({ instanceId }) => <VolatilityWidget instanceId={instanceId} />,
    },
    tradeDuration: {
        slug: "tradeDuration",
        title: "Trade Duration",
        description: "Varighedsfordeling + gennemsnit",
        category: "Stats",
        defaultSize: widgetSizes.tradeDuration,
        component: ({ instanceId }) => <TradeDurationWidget instanceId={instanceId} />,
    },
    perfVsExpectancy: {
        slug: "perfVsExpectancy",
        title: "Performance vs. Expectancy",
        description: "Sammenligner realiseret P/L mod forventet",
        category: "Stats",
        defaultSize: widgetSizes.perfVsExpectancy,
        component: ({ instanceId }) => <PerformanceVsExpectancyWidget instanceId={instanceId} />,
    },
    riskPerTrade: {
        slug: "riskPerTrade",
        title: "Risk per Trade",
        description: "% af konto risikeret pr. trade + distribution",
        category: "Stats",
        defaultSize: widgetSizes.riskPerTrade,
        component: ({ instanceId }) => <RiskPerTradeWidget instanceId={instanceId} />,
    },
    consistency: {
        slug: "consistency",
        title: "Konsistens",
        description: "% aktive handelsdage + mikro-heatmap",
        category: "Stats",
        defaultSize: widgetSizes.consistency,
        component: ({ instanceId }) => <ConsistencyWidget instanceId={instanceId} />,
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
