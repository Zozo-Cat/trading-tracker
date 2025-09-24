"use client";

import { WidgetSlug } from "./widgetSizes";

/** ========= Imports: ALLE widgets ========= */
/* Stats */
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
import PerformanceVsExpectancyWidget from "./widgets/PerformanceVsExpectancyWidget";
import RiskPerTradeWidget from "./widgets/RiskPerTradeWidget";
import TradeDurationWidget from "./widgets/TradeDurationWidget";
import ConsistencyWidget from "./widgets/ConsistencyWidget";
import VolatilityWidget from "./widgets/VolatilityWidget";

/* Kerne */
import DailyChecklistWidget from "./widgets/DailyChecklistWidget";
// TradingPlanWidget — fjernet
// ScorecardWidget   — fjernet
import UnnamedTradesWidget from "./widgets/UnnamedTradesWidget";
import TodaysTradesWidget from "./widgets/TodaysTradesWidget";
import TradingJournalShortcutWidget from "./widgets/TradingJournalShortcutWidget";

/* Den nye, sammenlagte Discipline-widget (Plan + Score i én) */
import DisciplineWidget from "./widgets/DisciplineWidget";

/* Konti & Risiko */
import AccountsWidget from "./widgets/AccountsWidget";
import ChallengesWidget from "./widgets/ChallengesWidget";

/* Nyheder & Kalender */
import NewsListWidget from "./widgets/NewsListWidget";
import UpcomingNewsWidget from "./widgets/UpcomingNewsWidget";
import MarketSessionsWidget from "./widgets/MarketSessionsWidget";

/* Mål & Fremdrift */
import TradingGoalsWidget from "./widgets/TradingGoalsWidget";

/* Mentor & Community */
import MentorFeedbackWidget from "./widgets/MentorFeedbackWidget";
import NotificationsCenterWidget from "./widgets/NotificationsCenterWidget";

/* Personligt */
import WelcomeWidget from "./widgets/WelcomeWidget";
import GamificationWidget from "./widgets/GamificationWidget";
import DailyReminderWidget from "./widgets/DailyReminderWidget";
import DailyFocusWidget from "./widgets/DailyFocusWidget";
import AutoInsightsWidget from "./widgets/AutoInsightsWidget";

/* Community / Team */
import TeamGoalsWidget from "./widgets/TeamGoalsWidget";
import TeamChallengesWidget from "./widgets/TeamChallengesWidget";
import LeaderboardSnapshotWidget from "./widgets/LeaderboardSnapshotWidget";
import MyRankInTeamWidget from "./widgets/MyRankInTeamWidget";
import TeamAnnouncementsWidget from "./widgets/TeamAnnouncementsWidget";
import TeamStreaksWidget from "./widgets/TeamStreaksWidget";
import BadgesEarnedByTeamWidget from "./widgets/BadgesEarnedByTeamWidget";
import CommunitySignalsWidget from "./widgets/CommunitySignalsWidget";

/* Bonus */
import SignalPerformanceSnapshotWidget from "./widgets/SignalPerformanceSnapshotWidget";
import RiskAlertsWidget from "./widgets/RiskAlertsWidget";
import PortfolioValueWidget from "./widgets/PortfolioValueWidget";
import PinnedResourcesWidget from "./widgets/PinnedResourcesWidget";
import UpcomingSessionsWidget from "./widgets/UpcomingSessionsWidget";

/** ========= Typer ========= */
export type WidgetSpec = {
    slug: WidgetSlug;
    title: string;
    description?: string;
    category:
        | "Stats"
        | "Core"
        | "AccountsRisk"
        | "NewsCalendar"
        | "GoalsProgress"
        | "MentorCommunity"
        | "Personal"
        | "CommunityTeam"
        | "Bonus";
    component: (p: { instanceId: string }) => JSX.Element;
};

/** ========= Registry ========= */
export const widgetRegistry: Record<WidgetSlug, WidgetSpec> = {
    /* Stats */
    successRate: {
        slug: "successRate",
        title: "Succesrate",
        category: "Stats",
        component: (p) => <SuccessRateWidget {...p} />,
    },
    profitLoss: {
        slug: "profitLoss",
        title: "P/L (Profit/Loss)",
        category: "Stats",
        component: (p) => <ProfitLossWidget {...p} />,
    },
    tradesCount: {
        slug: "tradesCount",
        title: "Antal handler",
        category: "Stats",
        component: (p) => <TradesCountWidget {...p} />,
    },
    riskReward: {
        slug: "riskReward",
        title: "R/R (gennemsnit)",
        category: "Stats",
        component: (p) => <RiskRewardWidget {...p} />,
    },
    expectancy: {
        slug: "expectancy",
        title: "Expectancy (EV)",
        category: "Stats",
        component: (p) => <ExpectancyWidget {...p} />,
    },
    drawdown: {
        slug: "drawdown",
        title: "Drawdown",
        category: "Stats",
        component: (p) => <DrawdownWidget {...p} />,
    },
    streaks: {
        slug: "streaks",
        title: "Streaks",
        category: "Stats",
        component: (p) => <StreaksWidget {...p} />,
    },
    accountGrowth: {
        slug: "accountGrowth",
        title: "Kontovækst %",
        category: "Stats",
        component: (p) => <AccountGrowthWidget {...p} />,
    },
    sessionPerformance: {
        slug: "sessionPerformance",
        title: "Session performance",
        category: "Stats",
        component: (p) => <SessionPerformanceWidget {...p} />,
    },
    sharpeSortino: {
        slug: "sharpeSortino",
        title: "Sharpe / Sortino",
        category: "Stats",
        component: (p) => <SharpeSortinoWidget {...p} />,
    },
    setupDistribution: {
        slug: "setupDistribution",
        title: "Setup-distribution",
        category: "Stats",
        component: (p) => <SetupDistributionWidget {...p} />,
    },
    newsVsNoNews: {
        slug: "newsVsNoNews",
        title: "News vs. no-news",
        category: "Stats",
        component: (p) => <NewsVsNoNewsWidget {...p} />,
    },
    performanceVsExpectancy: {
        slug: "performanceVsExpectancy",
        title: "Performance vs EV",
        category: "Stats",
        component: (p) => <PerformanceVsExpectancyWidget {...p} />,
    },
    riskPerTrade: {
        slug: "riskPerTrade",
        title: "Risiko pr. trade",
        category: "Stats",
        component: (p) => <RiskPerTradeWidget {...p} />,
    },
    tradeDuration: {
        slug: "tradeDuration",
        title: "Trade-varighed",
        category: "Stats",
        component: (p) => <TradeDurationWidget {...p} />,
    },
    consistency: {
        slug: "consistency",
        title: "Consistency",
        category: "Stats",
        component: (p) => <ConsistencyWidget {...p} />,
    },
    volatility: {
        slug: "volatility",
        title: "Volatilitet",
        category: "Stats",
        component: (p) => <VolatilityWidget {...p} />,
    },

    /* Kerne */
    dailyChecklist: {
        slug: "dailyChecklist",
        title: "Daily checklist",
        category: "Core",
        component: (p) => <DailyChecklistWidget {...p} />,
    },
    // tradingPlan — fjernet
    // scorecard   — fjernet
    unnamedTrades: {
        slug: "unnamedTrades",
        title: "Unavngivne trades",
        category: "Core",
        component: (p) => <UnnamedTradesWidget {...p} />,
    },
    todaysTrades: {
        slug: "todaysTrades",
        title: "Dagens trades",
        category: "Core",
        component: (p) => <TodaysTradesWidget {...p} />,
    },
    journalShortcut: {
        slug: "journalShortcut",
        title: "Trading Journal Shortcut",
        category: "Core",
        component: (p) => <TradingJournalShortcutWidget {...p} />,
    },
    discipline: {
        slug: "discipline",
        title: "Trading Plan",
        category: "Core",
        component: (p) => <DisciplineWidget {...p} />,
    },

    /* Konti & Risiko */
    accounts: {
        slug: "accounts",
        title: "Mine konti",
        category: "AccountsRisk",
        component: (p) => <AccountsWidget {...p} />,
    },
    challenges: {
        slug: "challenges",
        title: "Challenges",
        category: "AccountsRisk",
        component: (p) => <ChallengesWidget {...p} />,
    },

    /* Nyheder & Kalender */
    newsList: {
        slug: "newsList",
        title: "Næste 5 nyheder",
        category: "NewsCalendar",
        component: (p) => <NewsListWidget {...p} />,
    },
    upcomingNews: {
        slug: "upcomingNews",
        title: "High Volatility News",
        category: "NewsCalendar",
        component: (p) => <UpcomingNewsWidget {...p} />,
    },
    marketSessions: {
        slug: "marketSessions",
        title: "Sessions Timeline",
        category: "NewsCalendar",
        component: (p) => <MarketSessionsWidget {...p} />,
    },

    /* Mål & Fremdrift */
    tradingGoals: {
        slug: "tradingGoals",
        title: "Trading mål",
        category: "GoalsProgress",
        component: (p) => <TradingGoalsWidget {...p} />,
    },

    /* Mentor & Community */
    mentorFeedback: {
        slug: "mentorFeedback",
        title: "Mentor feedback",
        category: "MentorCommunity",
        component: (p) => <MentorFeedbackWidget {...p} />,
    },
    notifications: {
        slug: "notifications",
        title: "Notifikationscenter",
        category: "MentorCommunity",
        component: (p) => <NotificationsCenterWidget {...p} />,
    },

    /* Personligt */
    welcome: {
        slug: "welcome",
        title: "Velkomsthilsen",
        category: "Personal",
        component: (p) => <WelcomeWidget {...p} />,
    },
    gamification: {
        slug: "gamification",
        title: "Gamification",
        category: "Personal",
        component: (p) => <GamificationWidget {...p} />,
    },
    dailyReminder: {
        slug: "dailyReminder",
        title: "Daily Reminder",
        category: "Personal",
        component: (p) => <DailyReminderWidget {...p} />,
    },
    dailyFocus: {
        slug: "dailyFocus",
        title: "Daily Focus",
        category: "Personal",
        component: (p) => <DailyFocusWidget {...p} />,
    },
    autoInsights: {
        slug: "autoInsights",
        title: "Automatiske Insights",
        category: "Personal",
        component: (p) => <AutoInsightsWidget {...p} />,
    },

    /* Community / Team */
    teamGoals: {
        slug: "teamGoals",
        title: "Team Goals (readonly)",
        category: "CommunityTeam",
        component: (p) => <TeamGoalsWidget {...p} />,
    },
    teamChallenges: {
        slug: "teamChallenges",
        title: "Team Challenges",
        category: "CommunityTeam",
        component: (p) => <TeamChallengesWidget {...p} />,
    },
    leaderboard: {
        slug: "leaderboard",
        title: "Leaderboard Snapshot",
        category: "CommunityTeam",
        component: (p) => <LeaderboardSnapshotWidget {...p} />,
    },
    myTeamRank: {
        slug: "myTeamRank",
        title: "Min placering",
        category: "CommunityTeam",
        component: (p) => <MyRankInTeamWidget {...p} />,
    },
    teamAnnouncements: {
        slug: "teamAnnouncements",
        title: "Team Announcements",
        category: "CommunityTeam",
        component: (p) => <TeamAnnouncementsWidget {...p} />,
    },
    teamStreaks: {
        slug: "teamStreaks",
        title: "Team Streaks",
        category: "CommunityTeam",
        component: (p) => <TeamStreaksWidget {...p} />,
    },
    teamBadgesFeed: {
        slug: "teamBadgesFeed",
        title: "Badges Earned by Team",
        category: "CommunityTeam",
        component: (p) => <BadgesEarnedByTeamWidget {...p} />,
    },
    communitySignals: {
        slug: "communitySignals",
        title: "Community Signals",
        category: "CommunityTeam",
        component: (p) => <CommunitySignalsWidget {...p} />,
    },

    /* Bonus */
    signalPerformance: {
        slug: "signalPerformance",
        title: "Signal Performance Snapshot",
        category: "Bonus",
        component: (p) => <SignalPerformanceSnapshotWidget {...p} />,
    },
    riskAlerts: {
        slug: "riskAlerts",
        title: "Risk Alerts",
        category: "Bonus",
        component: (p) => <RiskAlertsWidget {...p} />,
    },
    portfolioValue: {
        slug: "portfolioValue",
        title: "Portfolio Value (aggregated)",
        category: "Bonus",
        component: (p) => <PortfolioValueWidget {...p} />,
    },
    pinnedResources: {
        slug: "pinnedResources",
        title: "Pinned Resources",
        category: "Bonus",
        component: (p) => <PinnedResourcesWidget {...p} />,
    },
    upcomingSessions: {
        slug: "upcomingSessions",
        title: "Upcoming Sessions",
        category: "Bonus",
        component: (p) => <UpcomingSessionsWidget {...p} />,
    },
};

/** ========= Helper ========= */
export function getWidgetSpec(slug: WidgetSlug): WidgetSpec {
    const spec = widgetRegistry[slug];
    if (spec) return spec;

    // Fallback – simpel “ukendt widget”
    return {
        slug: slug,
        title: "Ukendt Widget",
        category: "Core",
        component: ({ instanceId }) => (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 text-sm">
                Filler — indhold kommer senere (id: {instanceId}; slug: {slug})
            </div>
        ),
    };
}
