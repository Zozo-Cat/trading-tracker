/* ========= Widget sizes =========
   w = kolonne-bredde (af 12)
   h = "grid-rows" (bruges af react-grid-layout rowHeight)
*/

export type WidgetSlug =
    | "successRate"
    | "profitLoss"
    | "tradesCount"
    | "riskReward"
    | "expectancy"
    | "drawdown"
    | "streaks"
    | "accountGrowth"
    | "sessionPerformance"
    | "sharpeSortino"
    | "setupDistribution"
    | "newsVsNoNews"
    | "performanceVsExpectancy"
    | "riskPerTrade"
    | "tradeDuration"
    | "consistency"
    | "volatility"
    // Core
    | "dailyChecklist"
    // "tradingPlan" fjernet
    // "scorecard"   fjernet
    | "unnamedTrades"
    | "todaysTrades"
    | "journalShortcut"
    | "discipline"
    // Accounts & risk
    | "accounts"
    | "challenges"
    // News & calendar
    | "newsList"
    | "upcomingNews"
    | "marketSessions"
    // Goals
    | "tradingGoals"
    // Mentor / community
    | "mentorFeedback"
    | "notifications"
    // Personal
    | "welcome"
    | "gamification"
    | "dailyReminder"
    | "dailyFocus"
    | "autoInsights"
    // Community / Team
    | "teamGoals"
    | "teamChallenges"
    | "leaderboard"
    | "myTeamRank"
    | "teamAnnouncements"
    | "teamStreaks"
    | "teamBadgesFeed"
    | "communitySignals"
    // Bonus
    | "signalPerformance"
    | "riskAlerts"
    | "portfolioValue"
    | "pinnedResources"
    | "upcomingSessions";

export type Size = { w: number; h: number };

export const widgetSizes: Record<WidgetSlug, Size> = {
    /* ===== Toprække (stackede kolonner på 3 + upcomingNews) ===== */
    successRate: { w: 3, h: 2 },
    profitLoss: { w: 3, h: 3 },

    riskReward: { w: 3, h: 2 },
    tradesCount: { w: 3, h: 3 },

    accountGrowth: { w: 3, h: 2 },
    sessionPerformance: { w: 3, h: 3 },

    upcomingNews: { w: 3, h: 5 }, // High Volatility News

    /* ===== Anden række (3 kolonner á w=4) ===== */
    discipline: { w: 4, h: 8 },         // ny combined (Trading Plan + Score)
    marketSessions: { w: 4, h: 4 },
    unnamedTrades: { w: 4, h: 4 },

    challenges: { w: 4, h: 4 },
    tradingGoals: { w: 4, h: 4 },

    /* ========== Øvrige widgets (ikke i default seed) ========== */
    expectancy: { w: 3, h: 3 },
    drawdown: { w: 3, h: 3 },
    streaks: { w: 3, h: 3 },
    sharpeSortino: { w: 3, h: 3 },
    setupDistribution: { w: 3, h: 4 },
    newsVsNoNews: { w: 3, h: 3 },
    performanceVsExpectancy: { w: 3, h: 3 },
    riskPerTrade: { w: 3, h: 2 },
    tradeDuration: { w: 3, h: 2 },
    consistency: { w: 3, h: 3 },
    volatility: { w: 3, h: 3 },

    dailyChecklist: { w: 4, h: 4 },
    todaysTrades: { w: 4, h: 4 },
    journalShortcut: { w: 4, h: 2 },

    accounts: { w: 4, h: 4 },

    newsList: { w: 4, h: 4 },

    mentorFeedback: { w: 4, h: 4 },
    notifications: { w: 4, h: 3 },

    welcome: { w: 4, h: 2 },
    gamification: { w: 4, h: 3 },
    dailyReminder: { w: 4, h: 2 },
    dailyFocus: { w: 4, h: 2 },
    autoInsights: { w: 4, h: 3 },

    teamGoals: { w: 4, h: 4 },
    teamChallenges: { w: 4, h: 4 },
    leaderboard: { w: 4, h: 4 },
    myTeamRank: { w: 4, h: 3 },
    teamAnnouncements: { w: 4, h: 3 },
    teamStreaks: { w: 4, h: 3 },
    teamBadgesFeed: { w: 4, h: 3 },
    communitySignals: { w: 4, h: 4 },

    signalPerformance: { w: 4, h: 4 },
    riskAlerts: { w: 4, h: 3 },
    portfolioValue: { w: 4, h: 3 },
    pinnedResources: { w: 4, h: 3 },
    upcomingSessions: { w: 4, h: 3 },
};
