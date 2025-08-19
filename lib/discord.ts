// lib/discord.ts
type Guild = { id: string; name: string; icon?: string | null };
type Channel = { id: string; name: string; type?: number; parent_id?: string | null; parentName?: string | null };
type Role = { id: string; name: string; color?: number };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
    if (!res.ok) throw new Error(`Discord API route failed: ${res.status} ${await res.text()}`);
    return res.json();
}

// Guilds the current user is in
export async function getUserGuilds(): Promise<Guild[]> {
    return api<Guild[]>("/api/discord/guilds");
}

// Given a list of guild IDs, which have the bot installed
export async function getBotMemberships(guildIds: string[]): Promise<{ present: string[] }> {
    return api<{ present: string[] }>("/api/discord/bot-memberships", { method: "POST", body: JSON.stringify({ guildIds }) });
}

// Channels for a guild
export async function getGuildChannels(guildId: string): Promise<Channel[]> {
    return api<Channel[]>(`/api/discord/channels?guildId=${encodeURIComponent(guildId)}`);
}

// Roles for a guild
export async function getGuildRoles(guildId: string): Promise<Role[]> {
    return api<Role[]>(`/api/discord/roles?guildId=${encodeURIComponent(guildId)}`);
}

// Helper: filter guilds to ones where bot is present; optionally intersect with connected set
export function filterInstalled(
    guilds: Guild[],
    memberships: { present: string[] },
    connectedIds?: Set<string>
) {
    const present = new Set(memberships?.present ?? []);
    let out = guilds.filter(g => present.has(g.id));
    if (connectedIds?.size) out = out.filter(g => connectedIds.has(g.id));
    return out;
}
