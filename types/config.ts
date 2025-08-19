// types/config.ts

/* ===== Roller & SignalType ===== */
export type Role = "CL" | "TL_ROOT" | "TL_NESTED";
export type SignalType =
    | "BUY NOW" | "SELL NOW"
    | "BUY LIMIT" | "SELL LIMIT"
    | "BUY STOP" | "SELL STOP";

/* ===== Community (branding, invite, standards, dashboard, permissions, notifications) ===== */
export interface BrandingConfig {
    name: string;
    logoUrl?: string;
    themeColor?: string;
    welcomeText?: string;
}

export interface InviteConfig {
    communityInviteUrl?: string;
    communityJoinCode?: string;
}

export interface StandardsConfig {
    disclaimer: "neutral" | "ojd" | "custom";
    customDisclaimer?: string;
    emojiDecorDefault: boolean;
}

export interface DashboardConfig {
    topThreshold: number;
    supportThreshold: number;
    autoRotateMs: number;
}

export interface PermissionConfig {
    tlCanEditRouting: boolean;
    tlCanAddChannels: boolean;
    tlCanManageMembers: boolean;
}

export type NotificationEvent =
    | "signal_sent" | "signal_update" | "tp_hit" | "sl_hit" | "cancelled";

export interface NotificationsConfig {
    enabled: NotificationEvent[];
    retentionDays: number;
}

/* ===== Team ===== */
export interface ChannelDef {
    id: string;                 // intern id vi bruger i app'en
    name: string;               // visningsnavn i UI
    discordChannelId: string;   // rigtig Discord channel id
    isDefault?: boolean;        // bruges som “default-kanal”
}

export interface TraderDef {
    id: string;
    displayName: string;
    discordMention?: string;
    active: boolean;
    order: number;
}

export interface StrategyDef {
    id: string;
    name: string;
    category?: "Scalping" | "Swing" | "News" | "Other";
    description?: string;
    active: boolean;
    order: number;
}

export interface TeamRouting {
    defaultBySignalType: Record<SignalType, string[]>; // channel ids (vores interne ChannelDef.id)
}

export interface TeamConfig {
    id: string;
    name: string;
    inviteUrl?: string;
    joinCode?: string;
    managerUserId?: string;   // Team manager (valgfri)
    channels: ChannelDef[];
    traders: TraderDef[];
    strategies: StrategyDef[];
    routing: TeamRouting;
}

/* ===== Signals ===== */
export interface SignalTemplates {
    tpHit: string;           // "TP{index} ramt"
    slHit: string;           // "SL ramt"
    signalUpdated: string;   // "Signal opdateret"
    signalCancelled: string; // "Signal annulleret"
}

export interface SignalDefaults {
    defaultTraderId?: string;
    defaultStrategyId?: string;
    defaultDisclaimer?: "neutral" | "ojd" | "custom";
    emojiDecor: boolean;
}

export interface SignalFormRules {
    requireTrader: boolean;
    requireStrategy: boolean;
    symbolWhitelist?: string[];
}

export interface PlanLimits {
    free: { maxChannelsPerSignal: number };
    premium: { maxChannelsPerSignal: number };
    pro: { maxChannelsPerSignal: number };
}

export interface AutoTracking {
    mode: "manual" | "pricefeed";
    tolerancePips?: number;
    sequentialTP: boolean;
    allowPartialTP: boolean;
}

/* ===== Bot ===== */
export interface WebhookDef {
    channelId: string; // discord channel id
    url: string;
}

export interface BotCredentials {
    botToken?: string;
    webhooks?: WebhookDef[];
}

export interface ChannelMap {
    signalsChannelId: string;
    updatesChannelId?: string;
    errorsChannelId?: string;
    testChannelId?: string;
}

export interface NewsAlerts {
    enabled: boolean;
    highImpactTo: "signals" | "updates" | "specific";
    mediumImpactTo: "signals" | "updates" | "specific";
    specificChannelIdHigh?: string;
    specificChannelIdMedium?: string;
}

export interface BotCommands {
    allowTradeDm: boolean; // !trade -> DM aktive trades
}

export interface RateLimit { maxMessagesPerMinute?: number; }
export interface BotFallback {
    fallbackChannelId?: string;
    logLevel?: "error" | "warn" | "info" | "debug";
}

export interface BotConfig {
    mode: "test" | "live";
    credentials: BotCredentials;
    channelMap: ChannelMap;
    newsAlerts: NewsAlerts;
    commands: BotCommands;
    rateLimit?: RateLimit;
    fallback?: BotFallback;
}

/* ===== Integrations (NY) ===== */
export interface DiscordIntegration {
    connectedGuildIds: string[]; // de servers (guilds) brugeren har valgt at tilknytte i UI
}

/* ===== Root config ===== */
export interface CommunityConfig {
    branding: BrandingConfig;
    invite: InviteConfig;
    standards: StandardsConfig;
    dashboard: DashboardConfig;
    permissions: PermissionConfig;
    notifications: NotificationsConfig;

    teams: TeamConfig[];                 // flere teams i samme community
    signal: {
        templates: SignalTemplates;
        defaults: SignalDefaults;
        formRules: SignalFormRules;
        planLimits: PlanLimits;
        autoTracking: AutoTracking;
    };

    bot: BotConfig;

    // NY sektion til integrationer
    integrations?: {
        discord: DiscordIntegration;
    };
}

/* ===== Default config (bruges til bootstrap & reset) ===== */
export const defaultConfig: CommunityConfig = {
    branding: { name: "One Journey Denmark", themeColor: "#D4AF37" },
    invite: { communityInviteUrl: "", communityJoinCode: "" },
    standards: { disclaimer: "ojd", customDisclaimer: "", emojiDecorDefault: true },
    dashboard: { topThreshold: 80, supportThreshold: 50, autoRotateMs: 5000 },
    permissions: { tlCanEditRouting: true, tlCanAddChannels: true, tlCanManageMembers: true },
    notifications: {
        enabled: ["signal_sent","tp_hit","sl_hit","signal_update"],
        retentionDays: 30
    },

    teams: [
        {
            id: "team-alpha",
            name: "Team Alpha",
            managerUserId: "",
            inviteUrl: "",
            joinCode: "",
            channels: [
                { id: "ch-signals", name: "#signals", discordChannelId: "123", isDefault: true },
                { id: "ch-crypto",  name: "#crypto",  discordChannelId: "456" }
            ],
            traders: [
                { id: "t-mikkel", displayName: "Mikkel H.", discordMention: "@Mikkel", active: true, order: 1 }
            ],
            strategies: [
                { id: "s-breakout-a", name: "Breakout A", category: "Swing", active: true, order: 1 }
            ],
            routing: {
                defaultBySignalType: {
                    "BUY NOW":   ["ch-signals"],
                    "SELL NOW":  ["ch-signals"],
                    "BUY LIMIT": ["ch-signals"],
                    "SELL LIMIT":["ch-signals"],
                    "BUY STOP":  ["ch-signals"],
                    "SELL STOP": ["ch-signals"]
                }
            }
        }
    ],

    signal: {
        templates: {
            tpHit: "TP{index} ramt",
            slHit: "SL ramt",
            signalUpdated: "Signal opdateret",
            signalCancelled: "Signal annulleret"
        },
        defaults: {
            defaultTraderId: "t-mikkel",
            defaultStrategyId: "s-breakout-a",
            defaultDisclaimer: "ojd",
            emojiDecor: true
        },
        formRules: {
            requireTrader: true,
            requireStrategy: true
        },
        planLimits: {
            free: { maxChannelsPerSignal: 1 },
            premium: { maxChannelsPerSignal: 3 },
            pro: { maxChannelsPerSignal: 9999 }
        },
        autoTracking: {
            mode: "manual",
            tolerancePips: 0.5,
            sequentialTP: true,
            allowPartialTP: true
        }
    },

    bot: {
        mode: "test",
        credentials: { botToken: "", webhooks: [] },
        channelMap: {
            signalsChannelId: "123",
            updatesChannelId: "123",
            errorsChannelId: "123",
            testChannelId: "123"
        },
        newsAlerts: {
            enabled: true,
            highImpactTo: "updates",
            mediumImpactTo: "updates"
        },
        commands: { allowTradeDm: true },
        rateLimit: { maxMessagesPerMinute: 20 },
        fallback: { fallbackChannelId: "123", logLevel: "info" }
    },

    integrations: {
        discord: {
            connectedGuildIds: [] // tom som udgangspunkt — brugeren tilknytter i UI
        }
    }
};
