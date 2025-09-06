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
    | "customKpi"
    | "tradingPlanScorecard"
    | "todaysTrades"
    | "unnamedTrades"
    | "accounts"
    | "challenges"
    | "newsList"
    | "upcomingNews"
    | "tradingGoals"
    | "mentorFeedback"
    | "notifications"
    | "autoInsights"
    | "newsVsPerformance"
    | "welcome"
    | "gamification"
    | "filler"; // fallback widget

export const widgetSizes: Record<WidgetSlug, { w: number; h: number }> = {
    successRate: { w: 2, h: 2 },
    profitLoss: { w: 2, h: 2 },
    tradesCount: { w: 2, h: 2 },
    riskReward: { w: 2, h: 2 },
    expectancy: { w: 2, h: 2 },
    drawdown: { w: 3, h: 2 },
    streaks: { w: 3, h: 2 },
    accountGrowth: { w: 2, h: 2 },
    sessionPerformance: { w: 4, h: 2 },
    sharpeSortino: { w: 2, h: 2 },
    setupDistribution: { w: 2, h: 2 },
    newsVsNoNews: { w: 3, h: 2 },
    customKpi: { w: 3, h: 2 },
    tradingPlanScorecard: { w: 6, h: 2 },
    todaysTrades: { w: 4, h: 1 },
    unnamedTrades: { w: 6, h: 1 },
    accounts: { w: 4, h: 1 },
    challenges: { w: 3, h: 1 },
    newsList: { w: 4, h: 1 },
    upcomingNews: { w: 4, h: 1 },
    tradingGoals: { w: 6, h: 1 },
    mentorFeedback: { w: 4, h: 1 },
    notifications: { w: 3, h: 1 },
    autoInsights: { w: 3, h: 1 },
    newsVsPerformance: { w: 6, h: 1 },
    welcome: { w: 4, h: 2 },
    gamification: { w: 4, h: 1 },
    filler: { w: 2, h: 1 }, // fallback størrelse
};
