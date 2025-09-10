// app/servers/page.tsx — viser KUN servere hvor botten er medlem + "Tilknyt"-knap
import RegisterBtn from "./register-btn";
import { getServerClient } from "@/lib/supabaseServer";

type Guild = {
    id: string;
    name: string;
    icon: string | null;
    owner?: boolean;
    permissions?: number;
};

async function fetchUserGuilds(discordAccessToken: string): Promise<Guild[]> {
    const res = await fetch("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${discordAccessToken}` },
        cache: "no-store",
    });
    if (!res.ok) throw new Error(`Discord API (user guilds) error: ${res.status}`);
    return res.json();
}

async function fetchBotGuilds(botToken: string): Promise<Guild[]> {
    const res = await fetch("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bot ${botToken}` },
        cache: "no-store",
    });
    if (!res.ok) throw new Error(`Discord API (bot guilds) error: ${res.status}`);
    return res.json();
}

export const dynamic = "force-dynamic";

export default async function ServersPage() {
    // Hent Supabase-session server-side
    const supabase = getServerClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Discord OAuth access token fra Supabase-sessionen
    // (Supabase gemmer provider-token under 'provider_token' ved OAuth-login)
    const discordAccessToken = (session as any)?.provider_token as string | undefined;

    if (!session) {
        return (
            <main
                style={{
                    color: "#D4AF37",
                    background: "#211d1d",
                    minHeight: "100vh",
                    display: "grid",
                    placeItems: "center",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <h1>Servers</h1>
                    <p>Du skal være logget ind for at se dine servere.</p>
                </div>
            </main>
        );
    }

    if (!discordAccessToken) {
        return (
            <main
                style={{
                    color: "#D4AF37",
                    background: "#211d1d",
                    minHeight: "100vh",
                    display: "grid",
                    placeItems: "center",
                    padding: 24,
                }}
            >
                <div style={{ textAlign: "center", maxWidth: 700 }}>
                    <h1>Servers</h1>
                    <p style={{ marginTop: 8 }}>
                        Din session mangler Discord-adgangstoken. Log venligst ind igen med Discord.
                    </p>
                    <p style={{ opacity: 0.85, marginTop: 8, fontSize: 14 }}>
                        Tip: Sørg for at Discord-provider i Supabase har scope <code>guilds</code> (fx{" "}
                        <code>identify email guilds</code>), ellers kan vi ikke hente dine guilds.
                    </p>
                </div>
            </main>
        );
    }

    const botToken = process.env.DISCORD_BOT_TOKEN;

    let filtered: Guild[] = [];
    try {
        const [userGuilds, botGuilds] = await Promise.all([
            fetchUserGuilds(discordAccessToken),
            botToken ? fetchBotGuilds(botToken) : Promise.resolve([] as Guild[]),
        ]);
        const botGuildIdSet = new Set(botGuilds.map((g) => g.id));
        filtered = userGuilds.filter((g) => botGuildIdSet.has(g.id));
    } catch (e) {
        console.error(e);
    }

    return (
        <main style={{ color: "#D4AF37", background: "#211d1d", minHeight: "100vh", padding: 24 }}>
            <h1 style={{ marginBottom: 16 }}>Dine servere (tilknyttet hjemmesiden)</h1>
            {!filtered.length ? (
                <p>Ingen fundet (inviter botten og opdater siden).</p>
            ) : (
                <ul style={{ display: "grid", gap: 12, listStyle: "none", padding: 0 }}>
                    {filtered.map((g) => (
                        <li
                            key={g.id}
                            style={{
                                border: "1px solid #D4AF37",
                                borderRadius: 8,
                                padding: 12,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 600 }}>{g.name}</div>
                                <div style={{ fontSize: 12, opacity: 0.9 }}>Guild ID: {g.id}</div>
                            </div>
                            <RegisterBtn guildId={g.id} name={g.name} />
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
