"use client";

import { useRouter, useSearchParams } from "next/navigation";
import UnnamedTradesWidget from "../_components/widgets/UnnamedTradesWidget";
import TodaysTradesWidget from "../_components/widgets/TodaysTradesWidget";
import TradingPlanWidget from "../_components/widgets/TradingPlanWidget";
import DailyChecklistWidget from "../_components/widgets/DailyChecklistWidget";
import ScorecardWidget from "../_components/widgets/ScorecardWidget";
import TradingJournalShortcutWidget from "../_components/widgets/TradingJournalShortcutWidget";
import AccountsWidget from "../_components/widgets/AccountsWidget";
import ChallengesWidget from "../_components/widgets/ChallengesWidget";
import NewsListWidget from "../_components/widgets/NewsListWidget";
import UpcomingNewsWidget from "../_components/widgets/UpcomingNewsWidget";
import TradingGoalsWidget from "../_components/widgets/TradingGoalsWidget";
import MentorFeedbackWidget from "../_components/widgets/MentorFeedbackWidget";
import NotificationsCenterWidget from "../_components/widgets/NotificationsCenterWidget";
import WelcomeWidget from "../_components/widgets/WelcomeWidget";
import GamificationWidget from "../_components/widgets/GamificationWidget";
import DailyReminderWidget from "../_components/widgets/DailyReminderWidget";
import DailyFocusWidget from "../_components/widgets/DailyFocusWidget";
import AutoInsightsWidget from "../_components/widgets/AutoInsightsWidget";
import TeamGoalsWidget from "../_components/widgets/TeamGoalsWidget";
import TeamChallengesWidget from "../_components/widgets/TeamChallengesWidget";
import LeaderboardSnapshotWidget from "../_components/widgets/LeaderboardSnapshotWidget";
import MyRankInTeamWidget from "../_components/widgets/MyRankInTeamWidget";
import TeamAnnouncementsWidget from "../_components/widgets/TeamAnnouncementsWidget";
import TeamStreaksWidget from "../_components/widgets/TeamStreaksWidget";
import BadgesEarnedByTeamWidget from "../_components/widgets/BadgesEarnedByTeamWidget";
import CommunitySignalsWidget from "../_components/widgets/CommunitySignalsWidget";
import SignalPerformanceSnapshotWidget from "../_components/widgets/SignalPerformanceSnapshotWidget";
import RiskAlertsWidget from "../_components/widgets/RiskAlertsWidget";
import PortfolioValueWidget from "../_components/widgets/PortfolioValueWidget";
import PinnedResourcesWidget from "../_components/widgets/PinnedResourcesWidget";
import UpcomingSessionsWidget from "../_components/widgets/UpcomingSessionsWidget";
import MarketSessionsWidget from "../_components/widgets/MarketSessionsWidget";


type Render = (id: string) => JSX.Element;

// I testRegistry:
const testRegistry: Record<string, { title: string; render: (id: string) => JSX.Element }> = {
    unnamedTrades: { title: "Unavngivne trades", render: (id) => <UnnamedTradesWidget instanceId={id} /> },
    todaysTrades:  { title: "Dagens trades",      render: (id) => <TodaysTradesWidget instanceId={id} /> },

    // NY:
    tradingPlan:   { title: "Tradingplan",        render: (id) => <TradingPlanWidget instanceId={id} /> },
    checklist:     { title: "Checklist (daglig)",     render: (id) => <DailyChecklistWidget instanceId={id} /> },
    scorecard: { title: "Scorecard", render: (id) => <ScorecardWidget instanceId={id} /> },
    journalShortcut: { title: "Trading Journal Shortcut", render: (id) => <TradingJournalShortcutWidget instanceId={id} /> },
    accounts:   { title: "Mine konti", render: (id) => <AccountsWidget instanceId={id} /> },
    challenges: { title: "Challenges", render: (id) => <ChallengesWidget instanceId={id} /> },
    newsList:     { title: "News (seneste 5)",            render: (id) => <NewsListWidget instanceId={id} /> },
    upcomingNews: { title: "Upcoming High-Impact News",   render: (id) => <UpcomingNewsWidget instanceId={id} /> },
    tradingGoals:     { title: "Trading Goals",      render: (id) => <TradingGoalsWidget instanceId={id} /> },
    mentorFeedback:   { title: "Mentor Feedback",    render: (id) => <MentorFeedbackWidget instanceId={id} /> },
    notifications:    { title: "Notifikationscenter",render: (id) => <NotificationsCenterWidget instanceId={id} /> },
    welcome:       { title: "Velkomsthilsen",            render: (id) => <WelcomeWidget instanceId={id} /> },
    gamification:  { title: "Gamification (streaks+badges)", render: (id) => <GamificationWidget instanceId={id} /> },
    dailyReminder: { title: "Daily Reminder",            render: (id) => <DailyReminderWidget instanceId={id} /> },
    dailyFocus:    { title: "Daily Focus",               render: (id) => <DailyFocusWidget instanceId={id} /> },
    insights:      { title: "Automatiske Insights",      render: (id) => <AutoInsightsWidget instanceId={id} /> },
    teamGoals:     { title: "Team Goals (ro)",        render: (id) => <TeamGoalsWidget instanceId={id} /> },
    teamChallenges:{ title: "Team Challenges",        render: (id) => <TeamChallengesWidget instanceId={id} /> },
    leaderboard:   { title: "Leaderboard Snapshot",   render: (id) => <LeaderboardSnapshotWidget instanceId={id} /> },
    myRank:        { title: "My Rank in Team",        render: (id) => <MyRankInTeamWidget instanceId={id} /> },
    teamAnnouncements: { title: "Team Announcements", render: (id) => <TeamAnnouncementsWidget instanceId={id} /> },
    teamStreaks:       { title: "Team Streaks",      render: (id) => <TeamStreaksWidget instanceId={id} /> },
    teamBadges:        { title: "Badges Earned by Team", render: (id) => <BadgesEarnedByTeamWidget instanceId={id} /> },
    communitySignals:  { title: "Community Signals",  render: (id) => <CommunitySignalsWidget instanceId={id} /> },
    signalPerf:     { title: "Signal Performance Snapshot", render: (id) => <SignalPerformanceSnapshotWidget instanceId={id} /> },
    riskAlerts:     { title: "Risk Alerts",                  render: (id) => <RiskAlertsWidget instanceId={id} /> },
    portfolioValue: { title: "Portfolio Value (aggregated)", render: (id) => <PortfolioValueWidget instanceId={id} /> },
    pinnedResources:{ title: "Pinned Resources",             render: (id) => <PinnedResourcesWidget instanceId={id} /> },
    upcomingSessions:{title: "Upcoming Sessions",            render: (id) => <UpcomingSessionsWidget instanceId={id} /> },
    marketSessions: { title: "Market Sessions", render: (id) => <MarketSessionsWidget instanceId={id} /> },


};

    // 🔜 Tilføj flere her, når vi bygger dem:
    // tradingPlan: { title: "Tradingplan", render: (id) => <TradingPlanWidget instanceId={id} /> },
    // scorecard: { title: "Scorecard", render: (id) => <ScorecardWidget instanceId={id} /> },


export default function DashboardTestPage() {
    const params = useSearchParams();
    const router = useRouter();

    const slug = params.get("w") ?? "unnamedTrades";
    const current = testRegistry[slug];

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSlug = e.target.value;
        const usp = new URLSearchParams(Array.from(params.entries()));
        usp.set("w", newSlug);
        router.replace(`/dashboard/test?${usp.toString()}`);
    };


    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Widget Test</h1>

                <div className="flex items-center gap-2">
                    <label className="text-sm text-neutral-300">Vælg widget:</label>
                    <select
                        value={slug}
                        onChange={handleChange}
                        className="bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1 text-sm"
                    >
                        {Object.entries(testRegistry).map(([key, meta]) => (
                            <option key={key} value={key}>
                                {meta.title} ({key})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Selve widget-previewet */}
            <div className="max-w-6xl">
                {current ? (
                    current.render(`test-${slug}`)
                ) : (
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                        Ukendt widget: <code>{slug}</code>
                    </div>
                )}
            </div>
        </div>
    );
}
