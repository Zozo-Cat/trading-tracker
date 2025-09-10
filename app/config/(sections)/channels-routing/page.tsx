// app/config/(sections)/channels-routing/page.tsx
"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getConfig, saveConfig } from "@/lib/configStore";

export const dynamic = "force-dynamic";

const ADMIN_BIT = 0x8; // Discord permission: Administrator
const CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID as string;
const GLOBAL_TEAM_ID = "team-global";

type Guild = { id: string; name: string; icon: string | null; permissions?: number };
type BotMemberships = { present: string[]; absent: string[] };
type DiscordChannel = { id: string; name: string; type: number; categoryName: string | null };
type SavedChannel = { id: string; name: string; discordChannelId: string; isDefault?: boolean };

/** Wrapper så useSearchParams er inde i en Suspense-boundary */
export default function ChannelsRoutingPage() {
    return (
        <Suspense fallback={null}>
            <ChannelsRoutingPageInner />
        </Suspense>
    );
}

function ChannelsRoutingPageInner() {
    const router = useRouter();
    const sp = useSearchParams();
    const view = (sp.get("view") ?? "servers") as "servers" | "channels";

    // ---- Config (persist via localStorage nu, API senere) ----
    const userId = process.env.NEXT_PUBLIC_DEV_PROFILE_ID || "demo-user";
    const [cfg, setCfg] = useState(() => getConfig(userId));
    const [dirty, setDirty] = useState(false);
    const connectedIds = useMemo(
        () => new Set(cfg.integrations?.discord?.connectedGuildIds ?? []),
        [cfg.integrations?.discord?.connectedGuildIds]
    );
    const markDirty = () => setDirty(true);
    const doSave = () => {
        saveConfig(userId, cfg);
        setDirty(false);
        alert("Gemte ✅");
    };

    // Sørg for at “global team” findes (legacy)
    useEffect(() => {
        if (!Array.isArray(cfg.teams)) return;
        const hasGlobal = cfg.teams.some((t: any) => t.id === GLOBAL_TEAM_ID);
        if (!hasGlobal) {
            setCfg((p: any) => ({
                ...p,
                teams: [
                    ...p.teams,
                    {
                        id: GLOBAL_TEAM_ID,
                        name: "Global Channels",
                        managerUserId: "",
                        inviteUrl: "",
                        joinCode: "",
                        channels: [],
                        traders: [],
                        strategies: [],
                        routing: {
                            defaultBySignalType: {
                                "BUY NOW": [],
                                "SELL NOW": [],
                                "BUY LIMIT": [],
                                "SELL LIMIT": [],
                                "BUY STOP": [],
                                "SELL STOP": [],
                            },
                        },
                    },
                ],
            }));
            markDirty();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---- Discord data ----
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [botPresent, setBotPresent] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setErr(null);

                // 1) Brugerens guilds (kræver Discord-login)
                const r = await fetch("/api/discord/guilds", { cache: "no-store" });
                if (!r.ok) throw new Error("Kunne ikke hente dine Discord-servere");
                const data = await r.json();
                const list: Guild[] = data.guilds || [];
                setGuilds(list);

                // 2) Hvilke af dem er botten i?
                if (list.length) {
                    const ids = list.map((g) => g.id);
                    const m = await fetch("/api/discord/bot-memberships", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ guildIds: ids }),
                    });
                    const mm: BotMemberships = await m.json();
                    setBotPresent(new Set(mm.present || []));
                }
            } catch (e: any) {
                setErr(e?.message || "Uventet fejl");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const botIn = guilds.filter((g) => botPresent.has(g.id));
    const botOut = guilds.filter((g) => !botPresent.has(g.id) && ((g.permissions ?? 0) & ADMIN_BIT));

    // Til channels-view: vis kun guilds hvor botten er i – og hvis der er valgt connected, så filtrér til dem
    const visibleGuilds = useMemo(() => {
        const onlyBotGuilds = guilds.filter((g) => botPresent.has(g.id));
        return connectedIds.size ? onlyBotGuilds.filter((g) => connectedIds.has(g.id)) : onlyBotGuilds;
    }, [guilds, botPresent, connectedIds]);

    // 🔐 Per-guild gemte kanaler struktur
    useEffect(() => {
        setCfg((prev: any) => {
            const savedByGuild = prev.integrations?.discord?.savedByGuild ?? {};
            return {
                ...prev,
                integrations: {
                    ...prev.integrations,
                    discord: {
                        ...prev.integrations?.discord,
                        savedByGuild,
                    },
                },
            };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✨ Auto-tilføj nye bot-guilds til dropdowns (connectedGuildIds)
    useEffect(() => {
        if (!botIn.length) return;
        const presentIds = new Set(botIn.map((g) => g.id));
        const needAdd: string[] = [];
        for (const id of presentIds) {
            if (!connectedIds.has(id)) needAdd.push(id);
        }
        if (needAdd.length) {
            setCfg((prev: any) => ({
                ...prev,
                integrations: {
                    ...prev.integrations,
                    discord: {
                        ...prev.integrations?.discord,
                        connectedGuildIds: Array.from(
                            new Set([...(prev.integrations?.discord?.connectedGuildIds ?? []), ...needAdd])
                        ),
                    },
                },
            }));
            markDirty();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [botIn.length]);

    const header = (
        <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: "#D4AF37" }}>
                {view === "servers" ? "Tilknyttede servers" : "Kanaler"}
                <InfoIcon
                    label="Hjælp"
                    title={
                        view === "servers"
                            ? "Her ser du servers hvor Trading Tracker-botten er installeret (og hvor du er admin). Tryk 'Administrer' for at opsætte kanaler."
                            : "Vælg server og kanal til at modtage beskeder. Søg på navn, kategori eller indsæt kanal-ID."
                    }
                />
            </h2>
            <div className="flex items-center gap-2">
                {dirty && (
                    <span
                        className="text-xs rounded-md px-2 py-1"
                        style={{ backgroundColor: "#fffacd", color: "#211d1d", border: "1px solid #D4AF37" }}
                    >
            Ugemte ændringer
          </span>
                )}
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 rounded-lg text-black font-medium"
                    style={{ backgroundColor: "#5dade2" }}
                    title="Genindlæs siden og hent seneste data"
                >
                    Opdater
                </button>
                <button
                    onClick={doSave}
                    className="px-4 py-2 rounded-lg text-black font-medium"
                    style={{ backgroundColor: "#76ed77" }}
                    disabled={!dirty}
                    title="Gem dine ændringer"
                >
                    Gem
                </button>
            </div>
        </div>
    );

    if (loading) return <div className="p-6" style={{ color: "#D4AF37" }}>Henter servere…</div>;

    /* ========================== VIEW: SERVERS ========================== */
    if (view === "servers") {
        return (
            <div className="space-y-8">
                {header}

                {/* Dine tilknyttede */}
                <CardSection
                    title={
                        <span className="inline-flex items-center gap-2">
              Dine tilknyttede servers
              <InfoIcon title="Servers hvor botten allerede er inde. Du kan vælge om de skal vises i dropdowns i appen." />
            </span>
                    }
                    hint="Botten er allerede inde på disse servers."
                >
                    {botIn.length === 0 ? (
                        <EmptyNote text="Ingen tilknyttede servers endnu. Tilføj botten nedenfor." />
                    ) : (
                        <Grid>
                            {botIn.map((g) => {
                                const inDropdown = connectedIds.has(g.id);
                                return (
                                    <GuildCard
                                        key={g.id}
                                        guild={g}
                                        status="attached"
                                        dropdownStatus={inDropdown ? "shown" : "hidden"}
                                        primaryAction={{
                                            label: inDropdown ? "Skjul i dropdowns" : "Vis i dropdowns",
                                            onClick: () => {
                                                const next = new Set(connectedIds);
                                                next.has(g.id) ? next.delete(g.id) : next.add(g.id);
                                                setCfg((prev: any) => ({
                                                    ...prev,
                                                    integrations: {
                                                        ...prev.integrations,
                                                        discord: { ...prev.integrations?.discord, connectedGuildIds: Array.from(next) },
                                                    },
                                                }));
                                                markDirty();
                                            },
                                        }}
                                        secondaryAction={{
                                            label: "Administrer",
                                            onClick: () => router.push("/config/channels-routing?view=channels"),
                                        }}
                                    />
                                );
                            })}
                        </Grid>
                    )}
                </CardSection>

                <Divider />

                {/* Tilgængelige */}
                <CardSection
                    title={
                        <span className="inline-flex items-center gap-2">
              Tilgængelige servers (du er admin)
              <InfoIcon title="Her kan du invitere botten til nye servers, hvor du har administrator-rettigheder." />
            </span>
                    }
                    hint="Invitér Trading Tracker-botten til en ny server."
                >
                    {botOut.length === 0 ? (
                        <EmptyNote text="Ingen flere servers at tilføje." />
                    ) : (
                        <Grid>
                            {botOut.map((g) => (
                                <GuildCard key={g.id} guild={g} status="available" dropdownStatus="na" primaryLink={inviteUrlFor(g.id)} />
                            ))}
                        </Grid>
                    )}
                    {err && <p className="text-xs mt-3" style={{ color: "#ffb3b3" }}>{err}</p>}
                </CardSection>
            </div>
        );
    }

    /* ========================== VIEW: CHANNELS ========================== */
    return (
        <div className="space-y-8">
            {header}

            {/* Autocomplete channel picker */}
            <ChannelPicker
                visibleGuilds={visibleGuilds}
                guildsAll={guilds}
                cfg={cfg}
                setCfg={setCfg}
                markDirty={markDirty}
            />

            {/* Gemte kanaler pr. valgt server + SEND TEST */}
            <SavedChannelsPanel cfg={cfg} setCfg={setCfg} markDirty={markDirty} guildsAll={guilds} />
        </div>
    );
}

/* ============================= helpers/components ============================= */

function inviteUrlFor(guildId: string) {
    const base = "https://discord.com/oauth2/authorize";
    const params = new URLSearchParams({
        client_id: CLIENT_ID || "",
        scope: "bot applications.commands",
        permissions: "8",
        guild_id: guildId,
        disable_guild_select: "true",
    });
    return `${base}?${params.toString()}`;
}

function Divider() {
    return <div className="my-2 border-t" style={{ borderColor: "rgba(212,175,55,0.30)" }} />;
}

function CardSection({
                         title,
                         hint,
                         children,
                     }: {
    title: React.ReactNode;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <Card className="p-6">
            <div className="mb-4">
                <div className="font-medium flex items-center gap-2" style={{ color: "#D4AF37" }}>
                    {title}
                </div>
                {hint && (
                    <div className="text-xs opacity-80" style={{ color: "#D4AF37" }}>
                        {hint}
                    </div>
                )}
            </div>
            {children}
        </Card>
    );
}

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={`rounded-2xl border shadow-sm ${className}`} style={{ backgroundColor: "#1a1717", borderColor: "#D4AF37" }}>
            {children}
        </div>
    );
}

function Grid({ children }: { children: React.ReactNode }) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function InfoIcon({ title, label = "?" }: { title: string; label?: string }) {
    return (
        <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full border text-xs"
            style={{ borderColor: "#D4AF37", color: "#D4AF37" }}
            title={title}
            aria-label={title}
            role="img"
        >
      {label}
    </span>
    );
}

function GuildCard(props: {
    guild: Guild;
    status: "attached" | "available";
    dropdownStatus: "shown" | "hidden" | "na";
    primaryAction?: { label: string; onClick: () => void };
    secondaryAction?: { label: string; onClick: () => void };
    primaryLink?: string; // til “+ Tilføj bot”
}) {
    const { guild: g, status, dropdownStatus, primaryAction, secondaryAction, primaryLink } = props;
    const icon = g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128` : null;

    return (
        <div
            className="rounded-2xl border px-4 py-4 flex items-center gap-4"
            style={{ borderColor: "#D4AF37", backgroundColor: "#211d1d" }}
        >
            <div
                className="w-12 h-12 rounded-full overflow-hidden border shrink-0"
                style={{ borderColor: "#D4AF37", boxShadow: "0 0 0 3px rgba(212,175,55,0.12)" }}
            >
                {icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={icon} alt={g.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: "#211d1d", background: "#f0e68c" }}>
                        {g.name.slice(0, 2).toUpperCase()}
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="font-medium truncate" style={{ color: "#D4AF37" }}>
                    {g.name}
                </div>
                <div className="mt-1 flex items-center gap-2">
                    {status === "attached" ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: "#76ed77", color: "#211d1d" }}>
              ✅ Tilknyttet
            </span>
                    ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: "#E6D892", color: "#211d1d" }}>
              Klar til opsætning
            </span>
                    )}

                    {/* dropdown-status chip */}
                    {dropdownStatus !== "na" &&
                        (dropdownStatus === "shown" ? (
                            <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: "#f0e68c", color: "#211d1d" }}>
                I dropdowns
              </span>
                        ) : (
                            <span
                                className="text-[11px] px-2 py-0.5 rounded-md"
                                style={{ background: "transparent", color: "#E6D892", border: "1px solid #E6D892" }}
                            >
                Skjult
              </span>
                        ))}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {primaryLink ? (
                    <a href={primaryLink} className="px-3 py-1.5 rounded-md text-black text-xs font-semibold" style={{ backgroundColor: "#E6D892" }}>
                        + Tilføj bot
                    </a>
                ) : primaryAction ? (
                    <button
                        onClick={primaryAction.onClick}
                        className="px-3 py-1.5 rounded-md text-black text-xs font-semibold"
                        style={{ backgroundColor: "#5dade2" }}
                        title="Skjul eller vis denne server i dropdowns"
                    >
                        {primaryAction.label}
                    </button>
                ) : null}

                {secondaryAction && (
                    <button
                        onClick={secondaryAction.onClick}
                        className="px-3 py-1.5 rounded-md text-black text-xs font-semibold"
                        style={{ backgroundColor: "#f0e68c" }}
                        title="Gå til kanal-opsætning for denne server"
                    >
                        {secondaryAction.label}
                    </button>
                )}
            </div>
        </div>
    );
}

function GuildMini({ guild: g }: { guild: Guild }) {
    const icon = g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128` : null;
    return (
        <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border" style={{ borderColor: "#D4AF37" }}>
                {icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={icon} alt={g.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "#211d1d", background: "#f0e68c" }}>
                        {g.name.slice(0, 2).toUpperCase()}
                    </div>
                )}
            </div>
            <div className="truncate" style={{ color: "#D4AF37" }}>
                {g.name}
            </div>
        </div>
    );
}

function EmptyNote({ text }: { text: string }) {
    return (
        <div className="text-sm opacity-80" style={{ color: "#D4AF37" }}>
            {text}
        </div>
    );
}

/* ====== Saved Channels Panel (per guild) ====== */
function SavedChannelsPanel({
                                cfg,
                                setCfg,
                                markDirty,
                                guildsAll,
                            }: {
    cfg: any;
    setCfg: (updater: any) => void;
    markDirty: () => void;
    guildsAll: Guild[];
}) {
    const [activeGuildId, setActiveGuildId] = useState<string>("");

    useEffect(() => {
        const v = sessionStorage.getItem("tt_active_guild") || "";
        setActiveGuildId(v);
        const onEvt = (e: any) => {
            if (e?.detail?.guildId !== undefined) setActiveGuildId(e.detail.guildId);
        };
        window.addEventListener("tt:guildChange", onEvt as any);
        return () => window.removeEventListener("tt:guildChange", onEvt as any);
    }, []);

    const savedByGuild: Record<string, SavedChannel[]> = cfg.integrations?.discord?.savedByGuild ?? {};
    const list = (activeGuildId && savedByGuild[activeGuildId]) ? savedByGuild[activeGuildId] : [];
    const activeGuild = guildsAll.find((g) => g.id === activeGuildId);

    function removeChannel(chId: string) {
        setCfg((prev: any) => {
            const current = prev.integrations?.discord?.savedByGuild ?? {};
            const nextForGuild = (current[activeGuildId] ?? []).filter((x: SavedChannel) => x.id !== chId);
            return {
                ...prev,
                integrations: {
                    ...prev.integrations,
                    discord: {
                        ...prev.integrations?.discord,
                        savedByGuild: {
                            ...current,
                            [activeGuildId]: nextForGuild,
                        },
                    },
                },
            };
        });
        markDirty();
    }

    // ---- SEND TEST state ----
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [toast, setToast] = useState<string>("");

    const sendTest = async (discordChannelId: string) => {
        try {
            setSendingId(discordChannelId);
            const r = await fetch("/api/discord/test-send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    channelId: discordChannelId,
                    message: "🔔 Test fra Trading Tracker: Hej kanal! 👋",
                }),
            });
            const j = await r.json();
            if (!r.ok || !j.ok) throw new Error(j.error || "Ukendt fejl");
            setToast("Sendt ✅");
            setTimeout(() => setToast(""), 1800);
        } catch (e: any) {
            alert(`Kunne ikke sende test: ${e?.message || "ukendt fejl"}`);
        } finally {
            setSendingId(null);
        }
    };

    return (
        <Card className="p-6">
            <div className="mb-3 font-medium inline-flex items-center gap-2" style={{ color: "#D4AF37" }}>
                Gemte kanaler
                <InfoIcon
                    title={
                        activeGuild
                            ? `Her ser du hvilke kanaler du har gemt til ${activeGuild.name}. Du kan teste en besked eller fjerne kanalen.`
                            : "Vælg en server for at se gemte kanaler."
                    }
                />
            </div>

            {!activeGuild ? (
                <EmptyNote text="Vælg en server for at se gemte kanaler." />
            ) : list.length === 0 ? (
                <EmptyNote text={`Ingen gemte kanaler endnu for ${activeGuild.name}.`} />
            ) : (
                <div className="space-y-2">
                    {list.map((ch: SavedChannel) => (
                        <div
                            key={ch.id}
                            className="flex items-center justify-between rounded-xl border px-4 py-2"
                            style={{ borderColor: "#D4AF37", backgroundColor: "#211d1d" }}
                        >
                            <div className="truncate" style={{ color: "#D4AF37" }}>
                                {ch.name} <span className="opacity-70 text-xs">({ch.discordChannelId})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => sendTest(ch.discordChannelId)}
                                    disabled={sendingId === ch.discordChannelId}
                                    className="px-3 py-1.5 rounded-md text-black text-xs font-semibold"
                                    style={{ backgroundColor: "#76ed77" }}
                                    title="Send en testbesked til denne kanal"
                                >
                                    {sendingId === ch.discordChannelId ? "Sender…" : "Send test"}
                                </button>
                                <button
                                    onClick={() => removeChannel(ch.id)}
                                    className="px-3 py-1.5 rounded-md text-black text-xs font-medium"
                                    style={{ backgroundColor: "#E6D892" }}
                                    title="Fjern denne kanal fra listen"
                                >
                                    Fjern
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Grøn toast */}
            {toast && (
                <div
                    className="fixed left-1/2 -translate-x-1/2 bottom-6 px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
                    style={{ backgroundColor: "#76ed77", color: "#211d1d", border: "1px solid #1b5e20" }}
                    role="status"
                    aria-live="polite"
                >
                    {toast}
                </div>
            )}
        </Card>
    );
}

/* ====== Channel Picker (autocomplete: skriv for at søge → tilføj) ====== */
function ChannelPicker({
                           visibleGuilds,
                           guildsAll,
                           cfg,
                           setCfg,
                           markDirty,
                       }: {
    visibleGuilds: Guild[];
    guildsAll: Guild[];
    cfg: any;
    setCfg: (updater: any) => void;
    markDirty: () => void;
}) {
    const [guildId, setGuildId] = useState<string>("");
    const [channels, setChannels] = useState<DiscordChannel[]>([]);
    const [loading, setLoading] = useState(false);

    // autocomplete state
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const [multiMode, setMultiMode] = useState(true); // default: vælg flere

    // valgt guild (til header over input)
    const selectedGuild = useMemo(() => visibleGuilds.find((g) => g.id === guildId), [visibleGuilds, guildId]);

    // dropdown ref + klik-udenfor
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Broadcast valgt guild til SavedChannelsPanel
    useEffect(() => {
        sessionStorage.setItem("tt_active_guild", guildId || "");
        window.dispatchEvent(new CustomEvent("tt:guildChange", { detail: { guildId } }));
    }, [guildId]);

    // Grøn toast
    const [toast, setToast] = useState<string>("");
    function showToast(msg: string) {
        setToast(msg);
        window.setTimeout(() => setToast(""), 2000);
    }

    // Saved IDs for valgt guild (anti-duplikat)
    const savedIds = useMemo(() => {
        const arr: SavedChannel[] = cfg.integrations?.discord?.savedByGuild?.[guildId] ?? [];
        return new Set(arr.map((x) => x.discordChannelId));
    }, [cfg, guildId]);

    // Per-guild storage helpers
    function setSavedForGuild(gid: string, updater: (prev: SavedChannel[]) => SavedChannel[]) {
        setCfg((prev: any) => {
            const current = prev.integrations?.discord?.savedByGuild ?? {};
            const nextForGuild = updater(current[gid] ?? []);
            return {
                ...prev,
                integrations: {
                    ...prev.integrations,
                    discord: {
                        ...prev.integrations?.discord,
                        savedByGuild: {
                            ...current,
                            [gid]: nextForGuild,
                        },
                    },
                },
            };
        });
        markDirty();
    }

    async function load(gid: string) {
        if (!gid) {
            setChannels([]);
            return;
        }
        setLoading(true);
        try {
            const r = await fetch(`/api/discord/channels?guildId=${gid}`, { cache: "no-store" });
            const j = await r.json();
            setChannels(j.channels || []);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setQuery("");
        setOpen(false);
        setHighlight(0);
        load(guildId);
        if (guildId) setTimeout(() => inputRef.current?.focus(), 0);
    }, [guildId]);

    // SMART SØGNING: score-baseret sortering + skjul allerede gemte
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const base = channels.filter((c) => !savedIds.has(c.id));
        if (!q) return base.slice(0, 20);

        const startsWith = (s: string) => s.startsWith(q);
        const contains = (s: string) => s.includes(q);

        const scored = base
            .map((c) => {
                const name = c.name.toLowerCase();
                const cat = (c.categoryName || "").toLowerCase();
                const id = c.id;

                let score = 0;

                if (startsWith(name)) score += 100;
                else if (contains(name)) score += 40;

                if (cat) {
                    if (startsWith(cat)) score += 25;
                    else if (contains(cat)) score += 10;
                }

                if (id.includes(q)) score += 15;
                if (id === q) score += 60;

                return { c, score };
            })
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .map((x) => x.c);

        return scored.slice(0, 20);
    }, [channels, query, savedIds]);

    function prettyType(t: number) {
        return t === 5 ? "Announcement" : "Chat";
    }

    function addChannel(c: { id: string; name: string }) {
        if (!guildId) return;

        if (savedIds.has(c.id)) {
            showToast("Allerede tilføjet");
            if (!multiMode) setOpen(false);
            return;
        }

        setSavedForGuild(guildId, (prev) => {
            const exists = new Set(prev.map((x) => x.discordChannelId));
            if (exists.has(c.id)) return prev;
            const newCh: SavedChannel = {
                id: globalThis.crypto?.randomUUID?.() ?? `ch-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                name: `#${c.name}`,
                discordChannelId: c.id,
                isDefault: false,
            };
            return [...prev, newCh];
        });

        showToast("Tilføjet ✅");

        if (!multiMode) {
            setQuery("");
            setOpen(false);
        } else {
            setOpen(true);
        }
    }

    const snowflakeLike = (s: string) => /^[0-9]{17,20}$/.test(s);

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            const q = query.trim();

            if (snowflakeLike(q)) {
                if (savedIds.has(q)) {
                    showToast("Allerede tilføjet");
                    if (!multiMode) setOpen(false);
                    return;
                }
                const byId = channels.find((c) => c.id === q);
                if (byId) {
                    addChannel(byId);
                    if (!multiMode) return;
                } else {
                    alert("Det kanal-ID findes ikke i den valgte server.");
                    return;
                }
            }

            if (open) {
                const pick = filtered[highlight] ?? filtered[0];
                if (pick) addChannel(pick);
            }
            return;
        }

        if (!open) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    }

    function formatOption(c: DiscordChannel) {
        const isAnn = c.type === 5;
        return (
            <>
                <strong>{c.name}</strong>
                {c.categoryName && (
                    <>
                        {" "}
                        <span className="italic opacity-80">i {c.categoryName}</span>
                    </>
                )}
                {", "}
                <span className="opacity-70">{c.id}</span>
                {isAnn && (
                    <span
                        className="ml-2 px-2 py-0.5 rounded-full text-[10px]"
                        style={{ backgroundColor: "#f0e68c", color: "#211d1d" }}
                        aria-label="Announcement channel"
                        title="Announcement channel"
                    >
            📢 Announcement
          </span>
                )}
            </>
        );
    }

    return (
        <Card className="p-6">
            <div className="grid gap-6 md:grid-cols-3">
                {/* Servervælger */}
                <div className="md:col-span-1">
                    <label className="block text-sm mb-2 inline-flex items-center gap-2" style={{ color: "#D4AF37" }}>
                        Vælg Discord-server
                        <InfoIcon title="Vælg den server (Discord), hvor dine beskeder skal sendes hen." />
                    </label>
                    <select
                        value={guildId}
                        onChange={(e) => setGuildId(e.target.value)}
                        disabled={visibleGuilds.length === 0}
                        className="w-full rounded-lg border px-3 py-2 bg-transparent"
                        style={{ borderColor: "#D4AF37", color: "#D4AF37" }}
                        title="Listen viser kun servers, hvor botten er installeret (og som du har tilknyttet)."
                    >
                        <option value="" style={{ color: "#211d1d" }}>
                            — vælg —
                        </option>
                        {visibleGuilds.map((g) => (
                            <option key={g.id} value={g.id} style={{ color: "#211d1d" }}>
                                {g.name}
                            </option>
                        ))}
                    </select>

                    {loading && (
                        <p className="text-xs mt-2 opacity-80" style={{ color: "#D4AF37" }}>
                            Henter kanaler…
                        </p>
                    )}
                </div>

                {/* Autocomplete + controls */}
                <div className="md:col-span-2 relative">
                    {/* Valgt guild */}
                    {selectedGuild && (
                        <div className="mb-2 flex items-center gap-2 text-xs">
              <span className="opacity-70" style={{ color: "#D4AF37" }}>
                Valgt server:
              </span>
                            <div
                                className="inline-flex items-center gap-2 rounded-md border px-2 py-1"
                                style={{ borderColor: "#D4AF37", backgroundColor: "#211d1d", color: "#D4AF37" }}
                            >
                                <GuildMini guild={selectedGuild} />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <label className="block text-sm mb-2 inline-flex items-center gap-2" style={{ color: "#D4AF37" }}>
                            Channel
                            <InfoIcon title="Søg efter kanalnavn eller indsæt kanalens ID (findes ved at højreklikke på kanalen i Discord og kopiere ID)." />
                        </label>

                        {/* Multi-mode toggle */}
                        <label
                            className="mb-2 inline-flex items-center gap-2 text-xs px-2 py-1 rounded-md border"
                            style={{ borderColor: "#D4AF37", color: "#D4AF37" }}
                            title="Sæt flueben for at tilføje flere kanaler uden at feltet lukker."
                        >
                            <input
                                type="checkbox"
                                checked={multiMode}
                                onChange={(e) => setMultiMode(e.target.checked)}
                                className="accent-[#D4AF37]"
                            />
                            Vælg flere
                            <InfoIcon title="Når dette er slået til, forbliver listen åben efter du har tilføjet en kanal, så du hurtigt kan vælge flere." />
                        </label>
                    </div>

                    <input
                        ref={inputRef}
                        disabled={!guildId || loading}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setOpen(true);
                            setHighlight(0);
                        }}
                        onFocus={() => setOpen(true)}
                        onKeyDown={onKeyDown}
                        placeholder={guildId ? "Søg efter navn, kategori eller indsæt kanal-ID" : "Vælg server først"}
                        className="w-full rounded-lg border px-3 py-2 bg-transparent"
                        style={{ borderColor: "#D4AF37", color: "#D4AF37" }}
                    />

                    {/* Dropdown */}
                    {open && guildId && (
                        <div
                            ref={dropdownRef}
                            className="absolute mt-2 w-full rounded-xl border shadow-lg z-10 max-h-80 overflow-auto"
                            style={{ borderColor: "#D4AF37", backgroundColor: "#211d1d" }}
                            onMouseLeave={() => setHighlight(-1)}
                            role="listbox"
                        >
                            <div className="px-3 py-2 text-xs uppercase tracking-wide opacity-70 flex items-center gap-2" style={{ color: "#D4AF37" }}>
                                Channels
                                <InfoIcon title="Tryk på en kanal for at tilføje den. Brug piletaster og Enter for tastaturnavigation." />
                            </div>

                            {filtered.length === 0 ? (
                                <div className="px-3 py-6 text-sm opacity-80" style={{ color: "#D4AF37" }}>
                                    Ingen resultater.
                                    <div className="text-xs mt-1 opacity-70">
                                        Tip: Tjek stavning, prøv et kortere søgeord, eller indsæt kanalens ID (et langt tal).
                                    </div>
                                </div>
                            ) : (
                                filtered.map((c, idx) => {
                                    const active = idx === highlight;
                                    const title = `${c.name}${c.categoryName ? ` i ${c.categoryName}` : ""}, ${c.id} • ${prettyType(c.type)}`;
                                    return (
                                        <button
                                            key={c.id}
                                            onMouseEnter={() => setHighlight(idx)}
                                            onClick={() => addChannel(c)}
                                            className="w-full text-left px-3 py-2 truncate"
                                            style={{
                                                backgroundColor: active ? "#f0e68c" : "transparent",
                                                color: active ? "#211d1d" : "#D4AF37",
                                            }}
                                            title={title}
                                            aria-selected={active}
                                            role="option"
                                        >
                                            <span className="truncate flex items-center gap-1">{formatOption(c)}</span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Grøn toast i bunden */}
                    {toast && (
                        <div
                            className="fixed left-1/2 -translate-x-1/2 bottom-6 px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
                            style={{ backgroundColor: "#76ed77", color: "#211d1d", border: "1px solid #1b5e20" }}
                            role="status"
                            aria-live="polite"
                        >
                            {toast}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
