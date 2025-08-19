// lib/auth.ts
import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export const authOptions = {
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            // Bevar dine eksisterende felter
            if (account?.provider === "discord" && account.access_token) {
                (token as any).discordAccessToken = account.access_token;
            }
            (token as any).discordUserId = token.sub;

            // NYT: gem Discord snowflake (providerAccountId) første login
            if (account?.provider === "discord" && account.providerAccountId) {
                (token as any).discordId = account.providerAccountId;
            }

            // NYT: admin-allowlist fra env
            const adminIds = (process.env.ADMIN_DISCORD_IDS || "")
                .split(",")
                .map(s => s.trim())
                .filter(Boolean);
            const adminEmails = (process.env.ADMIN_EMAILS || "")
                .split(",")
                .map(s => s.trim().toLowerCase())
                .filter(Boolean);

            const isAdminById =
                (token as any).discordId && adminIds.includes(String((token as any).discordId));
            const isAdminByEmail =
                token.email && adminEmails.includes(String(token.email).toLowerCase());

            (token as any).role =
                isAdminById || isAdminByEmail ? "admin" : "user";

            return token;
        },

        async session({ session, token }) {
            // Bevar dine eksisterende felter i session
            (session as any).discordAccessToken =
                (token as any).discordAccessToken ?? null;
            (session as any).discordUserId = (token as any).discordUserId ?? null;

            // NYT: eksponer discordId og role i session
            (session as any).discordId = (token as any).discordId ?? null;

            // Sørg for at user.id findes
            if (session.user && token.sub) {
                (session.user as any).id = (session.user as any).id || token.sub;
            }

            // NYT: læg rolle på user
            (session.user as any).role = (token as any).role || "user";

            // NYT: giv admin fuld adgang i UI (matcher dine checks i siderne)
            if ((token as any).role === "admin") {
                (session.user as any).isTeamLead = true;
                (session.user as any).isCommunityLead = true;
                (session.user as any).isPro = true;
            }

            return session;
        },
    },
};

export default NextAuth(authOptions);
