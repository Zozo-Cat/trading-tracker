// app/dashboard/_components/widgetSizes.ts

/** 12-col grid sizes.
 *  w = bredde i kolonner (grit), h = antal rækker (beholder 1 overalt indtil videre).
 *  Justér h senere pr. widget hvis vi giver enkelte mere lodret plads.
 */

export type WidgetSize = { w: number; h: number };

/** Default sizes pr. widget. */
export const widgetSizes = {
    /* -------- System / Fallback -------- */
    filler: { w: 3, h: 1 } as WidgetSize,

    /* -------- :bar_chart: Stats -------- */
    successRate:        { w: 3, h: 1 }, // Succesrate
    profitLoss:         { w: 4, h: 1 }, // Profit / Loss
    tradesCount:        { w: 3, h: 1 }, // Antal handler
    riskReward:         { w: 3, h: 1 }, // R/R (gennemsnit)  ← ned til 3
    expectancy:         { w: 3, h: 1 }, // Expectancy (EV)   ← ned til 3
    drawdown:           { w: 4, h: 1 }, // Drawdown
    streaks:            { w: 3, h: 1 }, // Streaks            ← ned til 3 (UI = 2x2 bokse)
    accountGrowth:      { w: 3, h: 1 }, // Kontovækst %
    sessionPerformance: { w: 3, h: 1 }, // Session performance ← ned til 3 (med sessions-note)
    sharpeSortino:      { w: 6, h: 1 }, // Sharpe / Sortino
    setupDistribution:  { w: 3, h: 1 }, // Setup-distribution
    newsVsNoNews:       { w: 4, h: 1 }, // News vs. no-news
    customKpi:          { w: 3, h: 1 }, // Custom KPI (deaktiv / venter)

    // NYE stats vi har bygget i denne runde
    volatility:         { w: 4, h: 1 }, // Volatility
    consistency:        { w: 3, h: 1 }, // Konsistens
    tradeDuration:      { w: 4, h: 1 }, // Trade Duration
    perfVsExpectancy:   { w: 3, h: 1 }, // Performance vs. Expectancy ← ned til 3
    riskPerTrade:       { w: 3, h: 1 }, // Risk per Trade            ← ned til 3

    /* -------- :jigsaw: Kerne -------- */
    tradingPlanScorecard:{ w: 6, h: 1 },
    todaysTrades:        { w: 6, h: 1 },
    unnamedTrades:       { w: 6, h: 1 },

    /* -------- :credit_card: Konti & Risiko -------- */
    accounts:           { w: 6, h: 1 },
    challenges:         { w: 6, h: 1 },

    /* -------- :newspaper: Nyheder & Kalender -------- */
    newsList:           { w: 6, h: 1 },
    upcomingNews:       { w: 6, h: 1 },

    /* -------- :dart: Mål & fremdrift -------- */
    tradingGoals:       { w: 6, h: 1 },

    /* -------- :busts_in_silhouette: Mentor & Community -------- */
    mentorFeedback:     { w: 6, h: 1 },
    notifications:      { w: 4, h: 1 },

    /* -------- :brain: Insights (Premium/Pro) -------- */
    autoInsights:       { w: 6, h: 1 },
    newsVsPerformance:  { w: 4, h: 1 },

    /* -------- :star2: Personligt -------- */
    welcome:            { w: 3, h: 1 },
    gamification:       { w: 3, h: 1 },
} as const;

/** Slug-typen bruges af jeres registry. */
export type WidgetSlug = keyof typeof widgetSizes;
