// lib/auth.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    providers: [
        // Behold Discord login
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        }),

        // NYT: Login med email + kodeord
        CredentialsProvider({
            name: "Email & Kodeord",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Kodeord", type: "password" },
            },
            async authorize(credentials) {
                const email = credentials?.email?.toLowerCase().trim();
                const password = credentials?.password?.trim();
                if (!email || !password) return null;

                const user = await prisma.user.findUnique({
                    where: { email },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        image: true,
                        passwordHash: true,
                        role: true,
                        discordId: true,
                    },
                });

                if (!user || !user.passwordHash) return null;

                const ok = await bcrypt.compare(password, user.passwordHash);
                if (!ok) return null;

                return {
                    id: user.id,
                    email: user.email || undefined,
                    name: user.name || undefined,
                    image: user.image || undefined,
                    role: user.role || "user",
                    discordId: user.discordId || null,
                } as any;
            },
        }),
    ],

    callbacks: {
        async jwt({ token, account, user }) {
            // === Bevar Discord ting ===
            if (account?.provider === "discord" && account.access_token) {
                (token as any).discordAccessToken = account.access_token;
            }
            (token as any).discordUserId = token.sub;

            if (account?.provider === "discord" && account.providerAccountId) {
                (token as any).discordId = account.providerAccountId;
            }

            // === NYT: Credentials login ===
            if (user) {
                (token as any).role = (user as any).role || "user";
                (token as any).discordId = (user as any).discordId ?? (token as any).discordId ?? null;
            }

            // === Admin allowlist ===
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

            (token as any).role = isAdminById || isAdminByEmail ? "admin" : (token as any).role || "user";

            return token;
        },

        async session({ session, token }) {
            // Bevar eksisterende felter
            (session as any).discordAccessToken = (token as any).discordAccessToken ?? null;
            (session as any).discordUserId = (token as any).discordUserId ?? null;

            // Eksponer discordId og role
            (session as any).discordId = (token as any).discordId ?? null;

            if (session.user && token.sub) {
                (session.user as any).id = (session.user as any).id || token.sub;
            }

            (session.user as any).role = (token as any).role || "user";

            // Admin = fuld adgang i UI
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
