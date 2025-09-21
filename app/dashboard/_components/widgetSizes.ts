// app/dashboard/_components/widgetSizes.ts

export type WidgetSlug =
// Stats
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
    | "profitLossWidget"
    | "riskPerTrade"
    | "riskRewardWidget"
    | "sessionPerf"
    | "tradeDuration"
    | "tradesCountWidget"
    | "volatility"
    // Kerne
    | "tradingPlan"
    | "scorecard"
    | "todaysTrades"
    | "unnamedTrades"
    | "tradingJournalShortcut"
    // Konti & Risiko
    | "accounts"
    | "challenges"
    // Nyheder & Kalender
    | "newsList"
    | "upcomingNews"
    // Mål & Fremdrift
    | "tradingGoals"
    // Mentor & Community
    | "mentorFeedback"
    | "notificationsCenter"
    // Personligt
    | "welcome"
    | "gamification"
    | "dailyReminder"
    | "dailyFocus"
    | "autoInsights"
    // Community/Team
    | "teamGoals"
    | "teamChallenges"
    | "leaderboardSnapshot"
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
    | "upcomingSessions"
    // Timeline
    | "sessionsTimeline";

type Size = {
    w: number;
    h: number;
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
};

// Ens logik: hvis to widgets har samme h, har de samme pixelhøjde.
// Lås altid minH/maxH = h (og evt. minW) for at undgå drift.
export const widgetSizes: Record<WidgetSlug, Size> = {
    /* ===== Stats (top) ===== */
    successRate:          { w: 3, h: 3, minW: 3, minH: 3, maxH: 3 },
    riskReward:           { w: 3, h: 3, minW: 3, minH: 3, maxH: 3 },
    accountGrowth:        { w: 3, h: 3, minW: 3, minH: 3, maxH: 3 },
    streaks:              { w: 3, h: 3, minW: 3, minH: 3, maxH: 3 },

    profitLoss:           { w: 3, h: 2, minW: 3, minH: 2, maxH: 2 },
    tradesCount:          { w: 3, h: 2, minW: 3, minH: 2, maxH: 2 },
    sessionPerformance:   { w: 3, h: 2, minW: 3, minH: 2, maxH: 2 },
    dailyReminder:        { w: 3, h: 2, minW: 3, minH: 2, maxH: 2 },

    // (reserve/andre stats – sæt faste størrelser hvis de bruges)
    expectancy:           { w: 3, h: 3, minW: 3, minH: 3, maxH: 3 },
    drawdown:             { w: 4, h: 3, minW: 3, minH: 3, maxH: 3 },
    sharpeSortino:        { w: 4, h: 3, minW: 3, minH: 3, maxH: 3 },
    setupDistribution:    { w: 4, h: 3, minW: 3, minH: 3, maxH: 3 },
    newsVsNoNews:         { w: 4, h: 3, minW: 3, minH: 3, maxH: 3 },
    performanceVsExpectancy: { w: 4, h: 3, minW: 3, minH: 3, maxH: 3 },
    profitLossWidget:     { w: 3, h: 2, minW: 3, minH: 2, maxH: 2 },
    riskPerTrade:         { w: 3, h: 2, minW: 3, minH: 2, maxH: 2 },
    riskRewardWidget:     { w: 3, h: 2, minW: 3, minH: 2, maxH: 2 },
    sessionPerf:          { w: 3, h: 2, minW: 3, minH: 2, maxH: 2 },
    tradeDuration:        { w: 3, h: 2, minW: 3, minH: 2, maxH: 2 },
    tradesCountWidget:    { w: 3, h: 2, minW: 3, minH: 2, maxH: 2 },
    volatility:           { w: 3, h: 2, minW: 3, minH: 2, maxH: 2 },

    /* ===== Kerne ===== */
    tradingPlan:          { w: 4, h: 4, minW: 4, minH: 4, maxH: 4 },
    scorecard:            { w: 4, h: 4, minW: 4, minH: 4, maxH: 4 },
    todaysTrades:         { w: 6, h: 3, minW: 6, minH: 3, maxH: 3 },
    unnamedTrades:        { w: 4, h: 3, minW: 4, minH: 3, maxH: 3 },
    tradingJournalShortcut:{ w: 6, h: 3, minW: 6, minH: 3, maxH: 3 },

    /* ===== Konti & Risiko ===== */
    accounts:             { w: 4, h: 3, minW: 4, minH: 3, maxH: 3 },
    challenges:           { w: 4, h: 3, minW: 4, minH: 3, maxH: 3 },

    /* ===== Nyheder & Kalender ===== */
    newsList:             { w: 4, h: 3, minW: 4, minH: 3, maxH: 3 },
    upcomingNews:         { w: 4, h: 3, minW: 4, minH: 3, maxH: 3 },

    /* ===== Mål & Fremdrift ===== */
    tradingGoals:         { w: 4, h: 3, minW: 4, minH: 3, maxH: 3 },

    /* ===== Mentor & Notifikationer ===== */
    mentorFeedback:       { w: 4, h: 3, minW: 4, minH: 3, maxH: 3 },
    notificationsCenter:  { w: 4, h: 3, minW: 4, minH: 3, maxH: 3 },

    /* ===== Personligt ===== */
    welcome:              { w: 4, h: 2, minW: 4, minH: 2, maxH: 2 },
    gamification:         { w: 4, h: 3, minW: 3, minH: 3, maxH: 3 },
    dailyFocus:           { w: 3, h: 2, minW: 3, minH: 2, maxH: 2 },
    autoInsights:         { w: 4, h: 3, minW: 4, minH: 3, maxH: 3 },

    /* ===== Community / Team ===== */
    teamGoals:            { w: 6, h: 3, minW: 6, minH: 3, maxH: 3 },
    teamChallenges:       { w: 6, h: 3, minW: 6, minH: 3, maxH: 3 },
    leaderboardSnapshot:  { w: 6, h: 3, minW: 6, minH: 3, maxH: 3 },
    myTeamRank:           { w: 6, h: 2, minW: 6, minH: 2, maxH: 2 },
    teamAnnouncements:    { w: 6, h: 3, minW: 6, minH: 3, maxH: 3 },
    teamStreaks:          { w: 6, h: 2, minW: 6, minH: 2, maxH: 2 },
    teamBadgesFeed:       { w: 6, h: 2, minW: 6, minH: 2, maxH: 2 },
    communitySignals:     { w: 6, h: 3, minW: 6, minH: 3, maxH: 3 },

    /* ===== Bonus ===== */
    signalPerformance:    { w: 4, h: 3, minW: 4, minH: 3, maxH: 3 },
    riskAlerts:           { w: 4, h: 2, minW: 4, minH: 2, maxH: 2 },
    portfolioValue:       { w: 4, h: 2, minW: 4, minH: 2, maxH: 2 },
    pinnedResources:      { w: 4, h: 2, minW: 4, minH: 2, maxH: 2 },
    upcomingSessions:     { w: 4, h: 2, minW: 4, minH: 2, maxH: 2 },

    /* ===== Sessions timeline ===== */
    sessionsTimeline:     { w: 4, h: 2, minW: 4, minH: 2, maxH: 2 },
};
