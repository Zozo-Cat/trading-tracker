'use client';

import * as React from 'react';
import { getConfig, saveConfig } from '@/lib/configStore';
import { createClient } from '@supabase/supabase-js';

type SavedChannel = { id: string; name: string; discordChannelId: string; isDefault?: boolean };
type RouteMappingDict = Record<string, string>;
type Guild = { id: string; name: string; icon: string | null };
type DiscordChannel = { id: string; name: string; type: number; parent_id?: string | null; categoryName?: string | null };

type SbRow = { mappings: RouteMappingDict | null; updated_at?: string | null };

// --------- SUPABASE CLIENT (browser) ---------
function createSb() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
    if (!url || !key) return null;
    try { return createClient(url, key); } catch { return null; }
}

async function sbLoadMappings(userId: string, guildId: string) {
    const sb = createSb();
    if (!sb) return { ok: false as const, reason: 'no-supabase', data: null as RouteMappingDict | null, updatedAt: null as string | null };
    const { data, error } = await sb
        .from('route_mappings')
        .select('mappings, updated_at')
        .eq('user_id', userId)
        .eq('guild_id', guildId)
        .maybeSingle<SbRow>();
    if (error) return { ok: false as const, reason: error.message, data: null, updatedAt: null };
    return { ok: true as const, reason: 'ok', data: (data?.mappings ?? {}) as RouteMappingDict, updatedAt: data?.updated_at ?? null };
}

async function sbSaveMappings(userId: string, guildId: string, mappings: RouteMappingDict) {
    const sb = createSb();
    if (!sb) return { ok: false as const, reason: 'no-supabase' };
    const { error } = await sb
        .from('route_mappings')
        .upsert(
            { user_id: userId, guild_id: guildId, mappings, updated_at: new Date().toISOString() },
            { onConflict: 'user_id,guild_id' }
        );
    if (error) return { ok: false as const, reason: error.message };
    return { ok: true as const, reason: 'ok' };
}

// Small debounce hook
function useDebouncedCallback<T extends (...args: any[]) => void>(fn: T, delay = 200) {
    const ref = React.useRef<number | undefined>(undefined);
    return React.useCallback((...args: any[]) => {
        if (ref.current) window.clearTimeout(ref.current);
        ref.current = window.setTimeout(() => { fn(...args); }, delay);
    }, [fn, delay]) as T;
}

// Utility: channel type → default path suggestion
function defaultPathForType(t: number) {
    // Discord text = 0, announcement = 5, forum = 15, voice/thread ignored for routing
    if (t === 5) return '/alerts';
    if (t === 0) return '/signals';
    if (t === 15) return '/forum/:threadId'; // example
    return '/signals';
}

export default function RoutingPage() {
    const userId = (process.env.NEXT_PUBLIC_DEV_PROFILE_ID as string) || 'demo-user';

    // === cfg state (local fallback) ===
    const [cfg, setCfg] = React.useState<any>(() => getConfig(userId));
    const [dirty, setDirty] = React.useState(false);
    const markDirty = () => setDirty(true);
    const doSaveLocal = () => { saveConfig(userId, cfg); setDirty(false); };

    // Keep "last saved" snapshot for rollback
    const [lastSaved, setLastSaved] = React.useState<RouteMappingDict>({});

    // 🔔 Toast
    const [toast, setToast] = React.useState<{ kind: 'success' | 'warn' | 'error'; msg: string } | null>(null);
    const showToast = (kind: 'success' | 'warn' | 'error', msg: string) => {
        setToast({ kind, msg });
        window.setTimeout(() => setToast(null), 2400);
    };

    // === guilds (dropdown) ===
    const [guilds, setGuilds] = React.useState<Guild[]>([]);
    const [loadingGuilds, setLoadingGuilds] = React.useState(true);
    const [errGuilds, setErrGuilds] = React.useState<string | null>(null);
    React.useEffect(() => {
        (async () => {
            try {
                setLoadingGuilds(true);
                setErrGuilds(null);
                const r = await fetch('/api/discord/guilds', { cache: 'no-store' });
                if (!r.ok) throw new Error('Kunne ikke hente dine Discord-servere');
                const data = await r.json();
                setGuilds(data.guilds || []);
            } catch (e: any) { setErrGuilds(e?.message || 'Uventet fejl'); }
            finally { setLoadingGuilds(false); }
        })();
    }, []);

    // === current guild selection (shared with Channels) ===
    const [guildId, setGuildId] = React.useState<string>('');
    React.useEffect(() => {
        const v = sessionStorage.getItem('tt_active_guild') || '';
        setGuildId(v);
        const onEvt = (e: any) => { if (e?.detail?.guildId !== undefined) setGuildId(e.detail.guildId || ''); };
        window.addEventListener('tt:guildChange', onEvt as any);
        return () => window.removeEventListener('tt:guildChange', onEvt as any);
    }, []);
    const onGuildChange = (newId: string) => {
        setGuildId(newId);
        sessionStorage.setItem('tt_active_guild', newId);
        window.dispatchEvent(new CustomEvent('tt:guildChange', { detail: { guildId: newId } }));
    };

    // Ensure containers in cfg (once)
    React.useEffect(() => {
        setCfg((prev: any) => {
            const integrations = prev.integrations ?? {};
            const discord = integrations.discord ?? {};
            return {
                ...prev,
                integrations: {
                    ...integrations,
                    discord: {
                        ...discord,
                        routeMappingsByGuild: discord.routeMappingsByGuild ?? {},
                        savedByGuild: discord.savedByGuild ?? {},
                        connectedGuildIds: discord.connectedGuildIds ?? [],
                    },
                },
            };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Connected filter
    const connectedGuildIds: string[] = React.useMemo(
        () => cfg?.integrations?.discord?.connectedGuildIds ?? [],
        [cfg?.integrations?.discord?.connectedGuildIds]
    );
    const selectableGuilds = React.useMemo(() => {
        if (!guilds.length) return [];
        if (!connectedGuildIds?.length) return guilds;
        const set = new Set(connectedGuildIds);
        const filtered = guilds.filter((g) => set.has(g.id));
        return filtered.length ? filtered : guilds;
    }, [guilds, connectedGuildIds]);

    // saved channels + mappings
    const savedByGuild: Record<string, SavedChannel[]> = React.useMemo(
        () => cfg?.integrations?.discord?.savedByGuild ?? {},
        [cfg?.integrations?.discord?.savedByGuild]
    );
    const savedChannels: SavedChannel[] = React.useMemo(
        () => (guildId ? savedByGuild[guildId] ?? [] : []),
        [savedByGuild, guildId]
    );
    const routeMappingsByGuild: Record<string, RouteMappingDict> = React.useMemo(
        () => cfg?.integrations?.discord?.routeMappingsByGuild ?? {},
        [cfg?.integrations?.discord?.routeMappingsByGuild]
    );
    const mappingsForGuild: RouteMappingDict = React.useMemo(
        () => (guildId ? routeMappingsByGuild[guildId] ?? {} : {}),
        [routeMappingsByGuild, guildId]
    );

    // ===== Load Discord channels for type info (defaults & pattern rules) =====
    const [discordChannels, setDiscordChannels] = React.useState<DiscordChannel[]>([]);
    React.useEffect(() => {
        (async () => {
            if (!guildId) { setDiscordChannels([]); return; }
            try {
                const r = await fetch(`/api/discord/channels?guildId=${guildId}`, { cache: 'no-store' });
                const j = await r.json();
                setDiscordChannels(j.channels || []);
            } catch {
                setDiscordChannels([]);
            }
        })();
    }, [guildId]);

    // Build a map id -> type
    const typeById = React.useMemo(() => {
        const m = new Map<string, number>();
        discordChannels.forEach(c => m.set(c.id, c.type));
        return m;
    }, [discordChannels]);

    // ===== Validation & helpers =====
    const pathOk = (p: string) => {
        if (!p) return true;
        if (!/^\/[A-Za-z0-9:_\/\-]*$/.test(p)) return false;
        if (p.includes('//')) return false;
        if (p.length > 1 && p.endsWith('/')) return false;
        return true;
    };
    const normalizePath = (value: string) => {
        const t = value.trim();
        if (!t) return '';
        return t.startsWith('/') ? t : '/' + t;
    };

    const duplicatePaths = React.useMemo(() => {
        const m = mappingsForGuild || {};
        const seen = new Map<string, number>();
        Object.values(m).forEach((p) => {
            const val = (p || '').trim();
            if (!val) return;
            seen.set(val, (seen.get(val) || 0) + 1);
        });
        return new Set(Array.from(seen.entries()).filter(([, n]) => n > 1).map(([p]) => p));
    }, [mappingsForGuild]);
    const [allowOverlap, setAllowOverlap] = React.useState(false);

    const safeMergeMappings = (prev: any, updater: (current: RouteMappingDict) => RouteMappingDict) => {
        const integrations = prev.integrations ?? {};
        const discord = integrations.discord ?? {};
        const byGuild = discord.routeMappingsByGuild ?? {};
        const current = (guildId ? byGuild[guildId] ?? {} : {}) as RouteMappingDict;
        const nextForGuild = updater(current);
        return {
            ...prev,
            integrations: {
                ...integrations,
                discord: {
                    ...discord,
                    routeMappingsByGuild: {
                        ...byGuild,
                        [guildId]: nextForGuild,
                    },
                },
            },
        };
    };

    const debouncedSetPath = useDebouncedCallback((discordChannelId: string, normalized: string) => {
        setCfg((prev: any) => safeMergeMappings(prev, (current) => ({ ...current, [discordChannelId]: normalized })));
        markDirty();
    }, 200);

    const setPath = (discordChannelId: string, value: string) => {
        const normalized = normalizePath(value);
        debouncedSetPath(discordChannelId, normalized);
    };

    // ===== Supabase readiness & sync =====
    const [sbStatus, setSbStatus] = React.useState<'off' | 'ready' | 'loading' | 'error'>('off');
    const [sbError, setSbError] = React.useState<string>('');
    const [sbUpdatedAt, setSbUpdatedAt] = React.useState<string | null>(null);
    React.useEffect(() => {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
        setSbStatus(url && key && url.length > 10 && key.length > 10 ? 'ready' : 'off');
    }, []);

    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            if (sbStatus !== 'ready' || !guildId) return;
            try {
                setSbStatus('loading');
                setSbError('');
                const res = await sbLoadMappings(userId, guildId);
                if (cancelled) return;
                if (!res.ok) {
                    setSbStatus(res.reason === 'no-supabase' ? 'off' : 'error');
                    setSbError(res.reason);
                    return;
                }
                setCfg((prev: any) => safeMergeMappings(prev, () => res.data ?? {}));
                setLastSaved(res.data ?? {});
                setSbUpdatedAt(res.updatedAt || null);
                setSbStatus('ready');
            } catch (e: any) {
                if (cancelled) return;
                setSbStatus('error');
                setSbError(e?.message || 'Uventet fejl');
            }
        })();
        return () => { cancelled = true; };
    }, [guildId, userId]); // avoid sbStatus in deps to prevent loops

    async function saveAll() {
        // Validate
        const invalidIds: string[] = [];
        const dupeIds: string[] = [];
        Object.entries(mappingsForGuild || {}).forEach(([id, p]) => {
            if (p && !pathOk(p)) invalidIds.push(id);
            if (p && duplicatePaths.has(p) && !allowOverlap) dupeIds.push(id);
        });
        if (invalidIds.length || dupeIds.length) {
            setShowValidation(true);
            setValidationData({ invalidIds, dupeIds });
            showToast('warn', 'Ret felter — se liste ovenfor');
            return;
        }

        // Always save local
        doSaveLocal();
        setLastSaved({ ...mappingsForGuild }); // snapshot for rollback

        // Try supabase
        if (sbStatus === 'ready' && guildId) {
            try {
                setSbStatus('loading');
                const res = await sbSaveMappings(userId, guildId, mappingsForGuild);
                if (res.ok) {
                    setSbStatus('ready');
                    setSbUpdatedAt(new Date().toISOString());
                    showToast('success', `Gemt (Supabase) ✅ — ${Object.keys(mappingsForGuild).length} rækker`);
                } else {
                    setSbStatus('error'); setSbError(res.reason);
                    showToast('error', 'Supabase-fejl — lokale ændringer er gemt');
                }
            } catch (e: any) {
                setSbStatus('error'); setSbError(e?.message || 'Uventet fejl');
                showToast('error', 'Supabase-fejl — lokale ændringer er gemt');
            }
        } else {
            showToast('success', `Gemt lokalt ✅ — ${Object.keys(mappingsForGuild).length} rækker`);
        }
    }

    // Rollback
    function rollbackToLastSaved() {
        if (!guildId) return;
        setCfg((prev: any) => safeMergeMappings(prev, () => ({ ...lastSaved })));
        setDirty(true);
        showToast('success', 'Rullet tilbage til sidste gem');
    }

    // Local audit-log (session)
    const [audit, setAudit] = React.useState<{ id: string; before: string; after: string }[]>([]);
    const trackChange = (id: string, before: string, after: string) => {
        if (before === after) return;
        setAudit((prev) => [...prev, { id, before, after }]);
    };

    // ===== Keyboard shortcuts =====
    const searchRef = React.useRef<HTMLInputElement>(null);
    React.useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                saveAll();
            } else if (e.ctrlKey && (e.key === 'f' || e.key === 'F')) {
                e.preventDefault();
                searchRef.current?.focus();
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [saveAll]);

    // ===== Beforeunload guard =====
    React.useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!dirty) return;
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [dirty]);

    // ===== NEW: søg + sortering + filtre =====
    const [search, setSearch] = React.useState('');
    const [emptiesFirst, setEmptiesFirst] = React.useState(true);
    const [onlyInvalid, setOnlyInvalid] = React.useState(false);
    const [onlyDupes, setOnlyDupes] = React.useState(false);
    const [onlyEmpties, setOnlyEmpties] = React.useState(false);

    // Selection for bulk operations
    const [selected, setSelected] = React.useState<Set<string>>(new Set());
    const toggleSelect = (id: string) => setSelected((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });
    const clearSelection = () => setSelected(new Set());

    // Build rows
    const rowsAll = React.useMemo(() => {
        const m = savedChannels.map((ch) => {
            const current = mappingsForGuild?.[ch.discordChannelId] ?? '';
            const bad = !!current && !pathOk(current);
            const dup = !!current && duplicatePaths.has(current);
            const empty = !current;
            const type = typeById.get(ch.discordChannelId) ?? 0;
            const hay = `${ch.name} ${ch.discordChannelId} ${current}`.toLowerCase();
            return { ch, current, bad, dup, empty, type, hay };
        });
        return m;
    }, [savedChannels, mappingsForGuild, duplicatePaths, typeById]);

    // Filter/sort
    const channelRows = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        let filtered = q ? rowsAll.filter((r) => r.hay.includes(q)) : rowsAll;
        if (onlyInvalid) filtered = filtered.filter((r) => r.bad);
        if (onlyDupes) filtered = filtered.filter((r) => r.dup);
        if (onlyEmpties) filtered = filtered.filter((r) => r.empty);
        if (emptiesFirst && !onlyEmpties) {
            filtered = [...filtered].sort((a, b) => {
                const aEmpty = a.empty ? 0 : 1;
                const bEmpty = b.empty ? 0 : 1;
                return aEmpty - bEmpty;
            });
        }
        return filtered;
    }, [rowsAll, search, emptiesFirst, onlyInvalid, onlyDupes, onlyEmpties]);

    // ===== Virtualized list (simple windowing) =====
    const rowHeight = 88; // approx px height per row
    const viewportRef = React.useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = React.useState(0);
    const [viewportHeight, setViewportHeight] = React.useState(600);
    React.useEffect(() => {
        const el = viewportRef.current;
        if (!el) return;
        const onScroll = () => setScrollTop(el.scrollTop);
        el.addEventListener('scroll', onScroll);
        const resizeObs = new ResizeObserver(() => setViewportHeight(el.clientHeight));
        resizeObs.observe(el);
        setViewportHeight(el.clientHeight);
        return () => { el.removeEventListener('scroll', onScroll); resizeObs.disconnect(); };
    }, []);
    const total = channelRows.length;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 4);
    const endIndex = Math.min(total, Math.ceil((scrollTop + viewportHeight) / rowHeight) + 4);
    const windowed = channelRows.slice(startIndex, endIndex);
    const topPad = startIndex * rowHeight;
    const bottomPad = (total - endIndex) * rowHeight;

    // ===== Tooltip / popover =====
    function ChannelInfo({ g, ch }: { g: Guild | null; ch: SavedChannel }) {
        const [open, setOpen] = React.useState(false);
        const icon = g?.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128` : null;
        return (
            <span className="relative inline-block">
        <button
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            className="w-5 h-5 rounded-full border text-xs flex items-center justify-center"
            style={{ borderColor: '#D4AF37', color: '#D4AF37' }}
            title="Kanal-info"
        >i</button>
                {open && (
                    <div
                        className="absolute z-10 mt-2 rounded-xl shadow-lg p-3 w-64"
                        style={{ backgroundColor: '#211d1d', border: '1px solid #D4AF37' }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border" style={{ borderColor: '#D4AF37' }}>
                                {icon ? <img src={icon} alt={g?.name || 'Guild'} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: '#211d1d', background: '#f0e68c' }}>{(g?.name || '??').slice(0,2).toUpperCase()}</div>}
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-medium truncate" style={{ color: '#E9CC6A' }}>{g?.name || 'Ukendt server'}</div>
                                <div className="text-xs truncate" style={{ color: '#D4AF37' }}>{ch.name} <span className="opacity-70">({ch.discordChannelId})</span></div>
                            </div>
                        </div>
                        <div className="mt-2 text-xs" style={{ color: '#D4AF37' }}>
                            Brug inputfeltet til at sætte path for denne kanal. Tip: <strong>/signals</strong> eller <strong>/alerts</strong> er gode starts.
                        </div>
                    </div>
                )}
      </span>
        );
    }

    const activeGuildObj = React.useMemo(() => guilds.find((g) => g.id === guildId) || null, [guilds, guildId]);

    // ===== Validation summary modal =====
    const [showValidation, setShowValidation] = React.useState(false);
    const [validationData, setValidationData] = React.useState<{ invalidIds: string[]; dupeIds: string[] }>({ invalidIds: [], dupeIds: [] });

    function ValidationModal() {
        if (!showValidation) return null;
        const { invalidIds, dupeIds } = validationData;
        const byId = new Map(savedChannels.map((ch) => [ch.discordChannelId, ch]));
        const items = [
            ...invalidIds.map((id) => ({ id, type: 'Ugyldig', ch: byId.get(id) })),
            ...dupeIds.map((id) => ({ id, type: 'Dublet', ch: byId.get(id) })),
        ];
        return (
            <div className="fixed inset-0 z-40 flex items-center justify-center">
                <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowValidation(false)} />
                <div className="relative z-50 w-full max-w-lg rounded-2xl p-5" style={{ backgroundColor: '#1a1717', border: '1px solid #D4AF37' }}>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: '#E9CC6A' }}>Tjek disse felter</h3>
                    <p className="text-sm mb-3" style={{ color: '#D4AF37' }}>
                        Klik på en linje for at filtrere til kanalen, eller slå “Kun ugyldige / Kun dubletter” til i toolbaren.
                    </p>
                    <ul className="max-h-64 overflow-auto space-y-2">
                        {items.map((it, idx) => (
                            <li key={idx} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ border: '1px solid #D4AF37', backgroundColor: '#211d1d' }}>
                <span style={{ color: '#D4AF37' }}>
                  <strong style={{ color: it.type === 'Ugyldig' ? '#ff7676' : '#ffb84d' }}>{it.type}</strong>
                    {' '}• {it.ch?.name || 'Kanal'} <span className="opacity-70">({it.id})</span>
                </span>
                                <button
                                    onClick={() => {
                                        const needle = mappingsForGuild[it.id] ?? '';
                                        setSearch(needle || (it.ch?.name || ''));
                                        setOnlyInvalid(it.type === 'Ugyldig');
                                        setOnlyDupes(it.type === 'Dublet');
                                        setShowValidation(false);
                                    }}
                                    className="text-xs rounded-md px-2 py-1"
                                    style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}
                                >
                                    Filtrér
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 flex justify-end gap-2">
                        <button onClick={() => setShowValidation(false)} className="rounded-md px-3 py-1.5" style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}>
                            Luk
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ===== Bulk mapping & pattern rules modals =====
    const [showBulk, setShowBulk] = React.useState(false);
    const [bulkPrefix, setBulkPrefix] = React.useState('/signals/');
    const [showPattern, setShowPattern] = React.useState(false);
    const [patternText, setPatternText] = React.useState('signals-*');
    const [patternPath, setPatternPath] = React.useState('/signals/:name');

    function applyBulkPrefix() {
        if (!guildId || selected.size === 0) { showToast('warn', 'Vælg mindst én kanal'); return; }
        setCfg((prev: any) => safeMergeMappings(prev, (current) => {
            const next = { ...current };
            selected.forEach((id) => {
                const ch = savedChannels.find((c) => c.discordChannelId === id);
                const slug = (ch?.name || '').replace(/^#/, '').replace(/\s+/g, '-').toLowerCase();
                next[id] = normalizePath(bulkPrefix + slug);
            });
            return next;
        }));
        setDirty(true);
        setShowBulk(false);
        showToast('success', 'Prefix sat på valgte kanaler');
    }

    function applyPatternRule() {
        if (!guildId) return;
        const [prefix, wildcard] = patternText.split('*'); // simple matcher "foo-*"
        const pfx = (prefix || '').toLowerCase();
        const pathTpl = patternPath;
        let count = 0;
        setCfg((prev: any) => safeMergeMappings(prev, (current) => {
            const next = { ...current };
            savedChannels.forEach((c) => {
                const raw = c.name.replace(/^#/, '');
                if (raw.toLowerCase().startsWith(pfx)) {
                    const name = raw.slice(pfx.length);
                    next[c.discordChannelId] = normalizePath(pathTpl.replace(':name', name));
                    count++;
                }
            });
            return next;
        }));
        setDirty(true);
        setShowPattern(false);
        showToast('success', `Regel anvendt på ${count} kanal(er)`);
    }

    // ===== Mini wizard (first-time quick setup) =====
    const [showWizard, setShowWizard] = React.useState(false);
    React.useEffect(() => {
        if (!guildId) return;
        // show wizard if most channels are empty
        const values = Object.values(mappingsForGuild || {});
        const nonEmpty = values.filter(Boolean).length;
        if (savedChannels.length > 0 && nonEmpty === 0) setShowWizard(true);
        else setShowWizard(false);
    }, [guildId, savedChannels.length]); // not tracking mappings to avoid flicker

    function Wizard() {
        if (!showWizard) return null;
        // find likely signals/alerts channels by name
        const byName = (needle: string) => savedChannels.find(c => c.name.toLowerCase().includes(needle));
        const signals = byName('signal') || byName('trade');
        const alerts = byName('alert') || byName('warn') || byName('warning');
        return (
            <div className="rounded-2xl p-5" style={{ border: '1px solid #D4AF37', backgroundColor: '#1a1717' }}>
                <div className="flex items-center gap-2 mb-2">
                    <span>🧭</span>
                    <h3 className="text-lg font-medium" style={{ color: '#E9CC6A' }}>Hurtig opsætning</h3>
                </div>
                <p className="text-sm mb-3" style={{ color: '#D4AF37' }}>Vi kan hurtigt sætte de vigtigste ruter:</p>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => {
                            if (!signals) return showToast('warn', 'Ingen “signals” kanal fundet');
                            setPath(signals.discordChannelId, '/signals');
                        }}
                        className="rounded-md px-3 py-2 text-sm"
                        style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}
                    >
                        ⚡ Map “signals” → /signals
                    </button>
                    <button
                        onClick={() => {
                            if (!alerts) return showToast('warn', 'Ingen “alerts” kanal fundet');
                            setPath(alerts.discordChannelId, '/alerts');
                        }}
                        className="rounded-md px-3 py-2 text-sm"
                        style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}
                    >
                        🚨 Map “alerts” → /alerts
                    </button>
                    <button onClick={() => setShowWizard(false)} className="rounded-md px-3 py-2 text-sm" style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}>
                        Luk
                    </button>
                </div>
            </div>
        );
    }

    // ===== UI =====
    // (removed duplicate)

    // ===== Validation summary modal =====

    // (removed duplicate ValidationModal)


    // (removed duplicate showValidation state)
    // (removed duplicate validationData state)

    return (
        <main className="mx-auto max-w-6xl p-6 space-y-6">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold" style={{ color: '#E9CC6A' }}>Config → Channels Routing</h1>
                <p className="text-sm" style={{ color: '#D4AF37' }}>
                    Map Discord-kanaler → URL-ruter i appen (fx #signals → /signals).
                    <span title="Sæt en route/path per kanal. Senere kan vi vise indhold pr. route." className="ml-2 cursor-help" style={{ color: '#CDBA5E' }}>?</span>
                </p>
            </header>

            {/* Card: Server & status (sticky) */}
            <section className="rounded-2xl p-5 sticky top-16 z-10" style={{ border: '1px solid #D4AF37', backgroundColor: '#1a1717' }}>
                <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm" style={{ color: '#D4AF37' }}>Server:</label>
                    <select
                        value={guildId}
                        onChange={(e) => onGuildChange(e.target.value)}
                        disabled={loadingGuilds || selectableGuilds.length === 0}
                        className="rounded-lg px-3 py-2"
                        style={{ backgroundColor: '#1a1717', color: '#D4AF37', border: '1px solid #D4AF37', outline: 'none' }}
                    >
                        <option value="" style={{ color: '#D4AF37', backgroundColor: '#1a1717' }}>— vælg —</option>
                        {selectableGuilds.map((g) => (
                            <option key={g.id} value={g.id} style={{ color: '#D4AF37', backgroundColor: '#1a1717' }}>{g.name}</option>
                        ))}
                    </select>

                    {loadingGuilds ? (
                        <span className="text-xs" style={{ color: '#D4AF37' }}>Henter…</span>
                    ) : selectableGuilds.length > 0 ? null : errGuilds ? (
                        <span className="text-xs" style={{ color: '#ff4d4d' }}>{errGuilds}</span>
                    ) : (
                        <span className="text-xs" style={{ color: '#ff4d4d' }}>Ingen servere fundet</span>
                    )}

                    <span className="ml-auto text-xs px-2 py-1 rounded-md" style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}
                          title={
                              sbStatus === 'off' ? 'Supabase ikke konfigureret (gemmer lokalt)'
                                  : sbStatus === 'loading' ? 'Synkroniserer...'
                                      : sbStatus === 'error' ? sbError
                                          : 'Supabase klar'
                          }>
            {sbStatus === 'off' ? 'Supabase: Off' : sbStatus === 'loading' ? 'Supabase: Sync…' : sbStatus === 'error' ? 'Supabase: Fejl' : 'Supabase: Klar'}
          </span>
                    {sbUpdatedAt && (
                        <span className="text-xs opacity-80" style={{ color: '#D4AF37' }}>
              Senest gemt: {new Date(sbUpdatedAt).toLocaleString()}
            </span>
                    )}

                    {dirty && (
                        <span className="text-xs rounded-md px-2 py-1" style={{ border: '1px solid #D4AF37', color: '#D4AF37' }} title="Ugemte ændringer">
              Ugemte ændringer
            </span>
                    )}

                    <button onClick={() => window.location.reload()} className="rounded-xl px-3 py-1.5 text-sm" style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}>
                        🔄 Opdater
                    </button>
                    <button onClick={saveAll} className="rounded-xl px-3 py-1.5 text-sm" style={{ backgroundColor: '#f0e68c', color: '#211d1d', border: '1px solid #D4AF37' }} disabled={!dirty}>
                        💾 Gem
                    </button>
                    <button onClick={rollbackToLastSaved} className="rounded-xl px-3 py-1.5 text-sm" style={{ border: '1px solid #D4AF37', color: '#D4AF37' }} disabled={!guildId}>
                        ↩️ Fortryd til sidste gem
                    </button>
                </div>
            </section>

            {/* Card: Filters & Presets */}
            <section className="rounded-2xl p-5" style={{ border: '1px solid #D4AF37', backgroundColor: '#1a1717' }}>
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        ref={searchRef}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="🔎 Søg (navn / ID / path)…  (Ctrl+F)"
                        className="rounded-lg px-3 py-2 text-sm"
                        style={{ backgroundColor: '#1a1717', color: '#D4AF37', border: '1px solid #D4AF37', outline: 'none' }}
                        disabled={!guildId}
                    />
                    <label className="text-xs inline-flex items-center gap-2 px-2 py-1 rounded-md"
                           style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}
                           title="Vis kanaler uden path øverst">
                        <input type="checkbox" checked={emptiesFirst} onChange={(e) => setEmptiesFirst(e.target.checked)} className="accent-[#D4AF37]" disabled={!guildId} />
                        Tomme øverst
                    </label>
                    <label className="text-xs inline-flex items-center gap-2 px-2 py-1 rounded-md"
                           style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}
                           title="Skjul alt undtagen kanaler uden path">
                        <input type="checkbox" checked={onlyEmpties} onChange={(e) => setOnlyEmpties(e.target.checked)} className="accent-[#D4AF37]" disabled={!guildId} />
                        Vis kun tomme
                    </label>
                    <label className="text-xs inline-flex items-center gap-2 px-2 py-1 rounded-md"
                           style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}
                           title="Vis kun felter med ugyldig path">
                        <input type="checkbox" checked={onlyInvalid} onChange={(e) => setOnlyInvalid(e.target.checked)} className="accent-[#D4AF37]" disabled={!guildId} />
                        Kun ugyldige
                    </label>
                    <label className="text-xs inline-flex items-center gap-2 px-2 py-1 rounded-md"
                           style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}
                           title="Vis kun dubletter (samme path flere gange)">
                        <input type="checkbox" checked={onlyDupes} onChange={(e) => setOnlyDupes(e.target.checked)} className="accent-[#D4AF37]" disabled={!guildId} />
                        Kun dubletter
                    </label>

                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs opacity-80" style={{ color: '#D4AF37' }}>Presets:</span>
                        {['/signals','/alerts','/banana/:id','/news','/trades/:id'].map((p) => (
                            <button key={p} onClick={() => {
                                if (!guildId) return;
                                const firstEmpty = savedChannels.find((ch) => !(mappingsForGuild?.[ch.discordChannelId] ?? ''));
                                if (!firstEmpty) return showToast('warn', 'Ingen tomme felter');
                                setPath(firstEmpty.discordChannelId, p);
                            }} className="rounded-md px-2 py-1 text-xs" style={{ border: '1px solid #D4AF37', color: '#D4AF37' }} disabled={!guildId}>{p}</button>
                        ))}
                        <button onClick={() => {
                            if (!guildId) return;
                            const payload = JSON.stringify(mappingsForGuild, null, 2);
                            try { navigator.clipboard.writeText(payload); showToast('success', 'Eksporteret til clipboard'); }
                            catch { showToast('success', 'Kopiér fra dialogen'); alert(payload); }
                        }} className="rounded-md px-2 py-1 text-xs" style={{ border: '1px solid #D4AF37', color: '#D4AF37' }} disabled={!guildId}>Export JSON</button>
                        <button onClick={() => {
                            if (!guildId) return;
                            const raw = prompt('Indsæt JSON for mappings (channelId -> path):', '{}');
                            if (!raw) return;
                            try {
                                const obj = JSON.parse(raw) as RouteMappingDict;
                                setCfg((prev: any) => safeMergeMappings(prev, () => obj));
                                setDirty(true);
                                showToast('success', 'Importeret');
                            } catch { showToast('error', 'Ugyldigt JSON'); }
                        }} className="rounded-md px-2 py-1 text-xs" style={{ border: '1px solid #D4AF37', color: '#D4AF37' }} disabled={!guildId}>Import JSON</button>
                        <button onClick={() => {
                            if (!guildId) return;
                            Object.keys(mappingsForGuild || {}).forEach((id) => setPath(id, ''));
                        }} className="rounded-md px-2 py-1 text-xs" style={{ border: '1px solid #D4AF37', color: '#D4AF37' }} disabled={!guildId}>Ryd alle</button>
                    </div>
                </div>

                {/* Bulk & Pattern */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button onClick={() => setShowBulk(true)} className="rounded-md px-3 py-2 text-sm" style={{ border: '1px solid #D4AF37', color: '#D4AF37' }} disabled={!guildId || selected.size === 0}>
                        🧩 Bulk: tilføj prefix til valgte
                    </button>
                    <button onClick={() => setShowPattern(true)} className="rounded-md px-3 py-2 text-sm" style={{ border: '1px solid #D4AF37', color: '#D4AF37' }} disabled={!guildId}>
                        ✨ Regel: “navn-*” → path
                    </button>
                    <button onClick={rollbackToLastSaved} className="rounded-md px-3 py-2 text-sm" style={{ border: '1px solid #D4AF37', color: '#D4AF37' }} disabled={!guildId}>
                        ↩️ Fortryd til sidste gem
                    </button>
                    {selected.size > 0 && (
                        <button onClick={clearSelection} className="rounded-md px-3 py-2 text-sm" style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}>
                            Ryd valg ({selected.size})
                        </button>
                    )}
                </div>
            </section>

            {/* Card: Empty state help */}
            {guildId && savedChannels.length === 0 && (
                <section className="rounded-2xl p-5" style={{ border: '1px solid #D4AF37', backgroundColor: '#1a1717' }}>
                    <h3 className="text-lg font-medium mb-2" style={{ color: '#E9CC6A' }}>Ingen kanaler endnu</h3>
                    <p className="text-sm" style={{ color: '#D4AF37' }}>
                        Du har ikke gemt kanaler for den valgte server. Gå først til{' '}
                        <a href="/config/channels-routing?view=channels" className="underline">Config → Channels</a>, vælg serveren og tilføj nogle kanaler.
                        De dukker automatisk op her bagefter.
                    </p>
                </section>
            )}

            {/* Card: Channels list (virtualized) */}
            {guildId && savedChannels.length > 0 && (
                <section className="rounded-2xl p-0" style={{ border: '1px solid #D4AF37', backgroundColor: '#1a1717' }}>
                    <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                        <div className="text-lg font-medium" style={{ color: '#E9CC6A' }}>Routing pr. kanal</div>
                        <div className="text-sm" style={{ color: '#D4AF37' }}>{channelRows.length}/{savedChannels.length} viste</div>
                    </div>

                    <div ref={viewportRef} style={{ maxHeight: 560, overflow: 'auto' }}>
                        <div style={{ height: topPad }} />
                        <ul className="space-y-3 px-5 pb-5">
                            {windowed.map(({ ch, current, bad, dup, empty, type }) => {
                                const testOk = !!current && pathOk(current) && (!dup || allowOverlap);
                                const status = empty ? 'Tom' : bad ? 'Ugyldig' : dup && !allowOverlap ? 'Dublet' : 'OK';
                                const statusColor = empty ? '#ffb84d' : bad ? '#ff7676' : dup && !allowOverlap ? '#ffb84d' : '#76ed77';
                                const suggestion = empty ? defaultPathForType(type) : '';

                                return (
                                    <li key={ch.id} className="rounded-xl p-3 grid md:grid-cols-[auto,1fr] gap-3" style={{ border: '1px solid #D4AF37', backgroundColor: '#211d1d' }}>
                                        {/* Left: select + label */}
                                        <div className="min-w-0 flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(ch.discordChannelId)}
                                                onChange={() => toggleSelect(ch.discordChannelId)}
                                                className="accent-[#D4AF37]"
                                                title="Vælg til bulk-handling"
                                            />
                                            <span className="font-medium truncate" style={{ color: '#E9CC6A' }}>{ch.name}</span>
                                            <span className="text-xs shrink-0" style={{ color: '#D4AF37' }}>({ch.discordChannelId})</span>
                                            <ChannelInfo g={activeGuildObj} ch={ch} />
                                            <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: statusColor, color: '#211d1d' }}>{status}</span>
                                            {dup && !allowOverlap && current && (
                                                <button
                                                    onClick={() => { setSearch(current); setOnlyDupes(true); }}
                                                    className="text-[11px] px-2 py-0.5 rounded-full shrink-0"
                                                    style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}
                                                    title="Vis alle kanaler med denne path"
                                                >
                                                    Vis alle “{current}”
                                                </button>
                                            )}
                                        </div>

                                        {/* Right: input + actions */}
                                        <div className="flex items-center gap-2">
                                            <input
                                                value={current}
                                                onChange={(e) => { const val = e.target.value; trackChange(ch.discordChannelId, current, val); setPath(ch.discordChannelId, val); }}
                                                onBlur={(e) => setPath(ch.discordChannelId, e.target.value)}
                                                placeholder={suggestion || '/news eller /banana/:id'}
                                                className="w-full rounded-xl px-3 py-2 outline-none focus:ring"
                                                style={{ border: `1px solid ${bad ? '#ff7676' : dup && !allowOverlap ? '#ffb84d' : '#D4AF37'}`, backgroundColor: '#1a1717', color: '#D4AF37' }}
                                                aria-invalid={bad || (dup && !allowOverlap) ? true : undefined}
                                                onKeyDown={(e) => { if (e.key === 'Escape') { (e.target as HTMLInputElement).value=''; setPath(ch.discordChannelId, ''); } }}
                                            />
                                            {empty && (
                                                <button onClick={() => setPath(ch.discordChannelId, suggestion)} className="rounded-md px-2 py-1 text-xs"
                                                        style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}
                                                        title="Brug foreslået standard for denne kanaltype">
                                                    💡 Brug forslag
                                                </button>
                                            )}
                                            <button onClick={() => { try { navigator.clipboard.writeText(current || ''); showToast('success', 'Kopieret'); } catch { showToast('error', 'Kunne ikke kopiere'); } }} className="rounded-md px-2 py-1 text-xs" style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}>🔗 Copy</button>
                                            <button onClick={() => setPath(ch.discordChannelId, '')} className="rounded-md px-2 py-1 text-xs" style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}>🧹 Ryd</button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        <div style={{ height: bottomPad }} />
                    </div>

                    {/* Session audit */}
                    {audit.length > 0 && (
                        <div className="m-5 rounded-xl p-3" style={{ border: '1px solid #D4AF37' }}>
                            <div className="text-sm font-medium mb-2" style={{ color: '#E9CC6A' }}>Ændringer i denne session</div>
                            <ul className="text-xs space-y-1" style={{ color: '#D4AF37' }}>
                                {audit.slice(-20).map((a, i) => (
                                    <li key={i}>
                                        <span className="opacity-80">{a.id}</span>: “{a.before || '∅'}” → “{a.after || '∅'}”
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            )}

            {/* Wizard */}
            <Wizard />

            {/* Validation modal */}
            <ValidationModal />

            {/* Bulk modal */}
            {showBulk && (
                <div className="fixed inset-0 z-40 flex items-center justify-center">
                    <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowBulk(false)} />
                    <div className="relative z-50 w-full max-w-md rounded-2xl p-5" style={{ backgroundColor: '#1a1717', border: '1px solid #D4AF37' }}>
                        <h3 className="text-lg font-semibold mb-3" style={{ color: '#E9CC6A' }}>Bulk: prefix til valgte</h3>
                        <label className="block text-sm mb-1" style={{ color: '#D4AF37' }}>Prefix</label>
                        <input value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value)} className="w-full rounded-lg px-3 py-2"
                               style={{ border: '1px solid #D4AF37', backgroundColor: '#1a1717', color: '#D4AF37' }} placeholder="/signals/" />
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setShowBulk(false)} className="rounded-md px-3 py-1.5" style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}>Annullér</button>
                            <button onClick={applyBulkPrefix} className="rounded-md px-3 py-1.5" style={{ backgroundColor: '#f0e68c', color: '#211d1d', border: '1px solid #D4AF37' }}>Anvend</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pattern modal */}
            {showPattern && (
                <div className="fixed inset-0 z-40 flex items-center justify-center">
                    <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowPattern(false)} />
                    <div className="relative z-50 w-full max-w-md rounded-2xl p-5" style={{ backgroundColor: '#1a1717', border: '1px solid #D4AF37' }}>
                        <h3 className="text-lg font-semibold mb-3" style={{ color: '#E9CC6A' }}>Regel: navn-* → path</h3>
                        <label className="block text-sm mb-1" style={{ color: '#D4AF37' }}>Mønster (fx signals-*)</label>
                        <input value={patternText} onChange={(e) => setPatternText(e.target.value)} className="w-full rounded-lg px-3 py-2"
                               style={{ border: '1px solid #D4AF37', backgroundColor: '#1a1717', color: '#D4AF37' }} placeholder="signals-*" />
                        <label className="block text-sm mt-3 mb-1" style={{ color: '#D4AF37' }}>Path-skabelon (brug :name)</label>
                        <input value={patternPath} onChange={(e) => setPatternPath(e.target.value)} className="w-full rounded-lg px-3 py-2"
                               style={{ border: '1px solid #D4AF37', backgroundColor: '#1a1717', color: '#D4AF37' }} placeholder="/signals/:name" />
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setShowPattern(false)} className="rounded-md px-3 py-1.5" style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}>Annullér</button>
                            <button onClick={applyPatternRule} className="rounded-md px-3 py-1.5" style={{ backgroundColor: '#f0e68c', color: '#211d1d', border: '1px solid #D4AF37' }}>Anvend</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div
                    className="fixed left-1/2 -translate-x-1/2 bottom-6 px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
                    style={{ backgroundColor: toast.kind === 'success' ? '#76ed77' : toast.kind === 'warn' ? '#ffb84d' : '#ff7676', color: '#211d1d', border: '1px solid rgba(0,0,0,0.2)' }}
                    role="status"
                    aria-live="polite"
                >
                    {toast.msg}
                </div>
            )}
        </main>
    );
}