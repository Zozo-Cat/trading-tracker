// app/dashboard/_components/CustomizeLayoutModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import GridLayout, { Layout, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { widgetRegistry } from "./widgetRegistry";
import { widgetSizes, WidgetSlug } from "./widgetSizes";

/* ===== RGL wrapper ===== */
const RGL = WidthProvider(GridLayout);

/* ===== Types (matcher page.tsx) ===== */
export type DashboardLayout = {
    i: string; x: number; y: number; w: number; h: number; static?: boolean;
};
type WidgetInstance = { id: string; type: WidgetSlug; title?: string };

/* ===== LocalStorage keys ===== */
const LS_ACTIVE_LAYOUT = "tt.dashboard.v2.layout";
const LS_ACTIVE_WIDGETS = "tt.dashboard.v2.widgets";
const LS_DRAFT_LAYOUT  = "tt.dashboard.v2.customize.draft.layout";
const LS_DRAFT_WIDGETS = "tt.dashboard.v2.customize.draft.widgets";

/* ===== Grid constants (skal matche RGL props) ===== */
const COLS = 12;
const ROW_HEIGHT = 72;
const MARGIN_X = 16;
/* luft mellem rækker */
const MARGIN_Y = 12;
const CONTAINER_PADDING_X = 0;

/* ===== Utils ===== */
const uid = () => Math.random().toString(36).slice(2, 10);

function loadActiveFromLS(): { instances: WidgetInstance[]; layout: Layout[] } | null {
    try {
        const l = localStorage.getItem(LS_ACTIVE_LAYOUT);
        const w = localStorage.getItem(LS_ACTIVE_WIDGETS);
        if (!l || !w) return null;
        const layout = JSON.parse(l) as Layout[];
        const inst   = JSON.parse(w) as WidgetInstance[];
        if (!Array.isArray(layout) || !Array.isArray(inst)) return null;
        const ids = new Set(inst.map(i => i.id));
        if (!layout.every(x => ids.has(x.i))) return null;
        return { instances: inst, layout };
    } catch { return null; }
}
function loadDraftFromLS(): { instances: WidgetInstance[]; layout: Layout[] } | null {
    try {
        const l = localStorage.getItem(LS_DRAFT_LAYOUT);
        const w = localStorage.getItem(LS_DRAFT_WIDGETS);
        if (!l || !w) return null;
        const layout = JSON.parse(l) as Layout[];
        const inst   = JSON.parse(w) as WidgetInstance[];
        if (!Array.isArray(layout) || !Array.isArray(inst)) return null;
        const ids = new Set(inst.map(i => i.id));
        if (!layout.every(x => ids.has(x.i))) return null;
        return { instances: inst, layout };
    } catch { return null; }
}
function saveDraftToLS(instances: WidgetInstance[], layout: Layout[]) {
    localStorage.setItem(LS_DRAFT_WIDGETS, JSON.stringify(instances));
    localStorage.setItem(LS_DRAFT_LAYOUT, JSON.stringify(layout));
}

/* ====== DEFAULT SEED (samme som i live-dashboard) ====== */
/** En “row” er et array af “stacks”; hver stack er 1..n widgets ovenpå hinanden i samme kolonne. */
type Row = WidgetSlug[][];
function packRowsWithStacks(rows: Row[]): { instances: WidgetInstance[]; layout: Layout[] } {
    let y = 0;
    const instances: WidgetInstance[] = [];
    const layout: Layout[] = [];

    for (const stacks of rows) {
        let x = 0;
        let rowMaxH = 0;

        for (const stack of stacks) {
            const colW = Math.max(...stack.map((s) => widgetSizes[s].w));
            let yOffsetInCol = 0;

            for (const slug of stack) {
                const size = widgetSizes[slug];
                const id = `w-${slug}-${instances.length}`;

                layout.push({
                    i: id,
                    x,
                    y: y + yOffsetInCol,
                    w: size.w,
                    h: size.h,
                    static: false, // i editoren skal de være flytbare
                });

                instances.push({
                    id,
                    type: slug,
                    title: widgetRegistry[slug]?.title,
                });

                yOffsetInCol += size.h;
            }

            const stackHeight = stack.reduce((sum, s) => sum + widgetSizes[s].h, 0);
            rowMaxH = Math.max(rowMaxH, stackHeight);
            x += colW;
        }

        y += rowMaxH;
    }

    return { instances, layout };
}

/** Samme default-layout som på /dashboard/page.tsx */
function seedDefaultFree(): { instances: WidgetInstance[]; layout: Layout[] } {
    const rows: Row[] = [
        // Række 1 (≈5 høj)
        [
            ["successRate", "profitLoss"],           // 2 + 3
            ["riskReward", "tradesCount"],           // 2 + 3
            ["accountGrowth", "sessionPerformance"], // 2 + 3
            ["upcomingNews"],                        // 5
        ],
        // Række 2 (8 høj)
        [
            ["discipline"],                          // 8
            ["marketSessions", "unnamedTrades"],     // 4 + 4
            ["challenges", "tradingGoals"],          // 4 + 4
        ],
    ];
    return packRowsWithStacks(rows);
}

/* ===== Dine kategorier ===== */
type WantedItem = { slug: WidgetSlug; label: string };
type WantedSection = { title: string; items: WantedItem[] };

const WANTED: WantedSection[] = [
    { title: "Stats", items: [
            { slug: "successRate", label: "Succesrate / Hit rate" },
            { slug: "profitLoss", label: "P/L (Profit / Loss)" },
            { slug: "tradesCount", label: "Antal handler" },
            { slug: "riskReward", label: "R/R (gennemsnit)" },
            { slug: "expectancy", label: "Expectancy (EV)" },
            { slug: "drawdown", label: "Drawdown" },
            { slug: "streaks", label: "Streaks (W/L badges)" },
            { slug: "accountGrowth", label: "Kontovækst %" },
            { slug: "sessionPerformance", label: "Session performance (segmenteret bar)" },
            { slug: "sharpeSortino", label: "Sharpe / Sortino" },
            { slug: "setupDistribution", label: "Setup-distribution" },
            { slug: "newsVsNoNews", label: "News vs. no-news" },
            { slug: "customKpi", label: "Custom KPI" },
        ]},
    { title: "Kerne", items: [
            { slug: "discipline", label: "Dicipline" },
            { slug: "checklist", label: "Checklist" },
            { slug: "todaysTrades", label: "Dagens trades" },
            { slug: "unnamedTrades", label: "Unavngivne trades" },
            { slug: "tradingJournalShortcut", label: "Trading Journal Shortcut" },
        ]},
    { title: "Konti & Risiko", items: [
            { slug: "accounts", label: "Mine konti" },
            { slug: "challenges", label: "Challenges" },
        ]},
    { title: "Nyheder & Kalender", items: [
            { slug: "newsList", label: "News (seneste 5)" },
            { slug: "upcomingNews", label: "Upcoming High-Impact News (6–7 events)" },
        ]},
    { title: "Mål & Fremdrift", items: [{ slug: "tradingGoals", label: "Trading Goals" }]},
    { title: "Mentor & Community", items: [
            { slug: "mentorFeedback", label: "Mentor feedback" },
            { slug: "notificationsCenter", label: "Notifikationscenter" },
        ]},
    { title: "Personligt", items: [
            { slug: "welcome", label: "Velkomsthilsen" },
            { slug: "gamification", label: "Gamification (streaks + badges)" },
            { slug: "dailyReminder", label: "Daily Reminder / Råd" },
            { slug: "dailyFocus", label: "Daily Focus (dagens fokuspunkt)" },
            { slug: "autoInsights", label: "Automatiske Insights" },
        ]},
    { title: "Community / Team", items: [
            { slug: "teamGoals", label: "Team Goals (readonly)" },
            { slug: "teamChallenges", label: "Team Challenges (fælles progress)" },
            { slug: "leaderboard", label: "Leaderboard Snapshot (top 3–5)" },
            { slug: "myTeamRank", label: "My Rank in Team" },
            { slug: "teamAnnouncements", label: "Team Announcements" },
            { slug: "teamStreaks", label: "Team Streaks (antal i win-streak)" },
            { slug: "badgesEarnedByTeam", label: "Badges Earned by Team (feed)" },
            { slug: "communitySignals", label: "Community Signals (seneste signaler)" },
        ]},
    { title: "Bonus", items: [
            { slug: "signalPerformance", label: "Signal Performance Snapshot" },
            { slug: "riskAlerts", label: "Risk Alerts" },
            { slug: "portfolioValue", label: "Portfolio Value (aggregated)" },
            { slug: "pinnedResources", label: "Pinned Resources" },
            { slug: "upcomingSessions", label: "Upcoming Sessions (community call / mentor)" },
        ]},
];

/* ===== Korte fallback-beskrivelser ===== */
const FALLBACK_DESC: Partial<Record<WidgetSlug, string>> = {
    successRate: "Andel af vindende handler i perioden.",
    profitLoss: "Samlet P/L og P/L pr. trade.",
    tradesCount: "Antal registrerede handler.",
    riskReward: "Gennemsnitligt risiko/afkast (R/R).",
    expectancy: "Forventet værdi pr. trade (EV).",
    drawdown: "Maks. og aktuel tilbagegang fra peak.",
    streaks: "Aktuelle win/lose-streaks.",
    accountGrowth: "Kontoudvikling i % over tid.",
    sessionPerformance: "Performance pr. session (segmenteret bar).",
    sharpeSortino: "Sharpe/Sortino-ratio.",
    setupDistribution: "Fordeling af setups og hit rate.",
    newsVsNoNews: "Handler med/uden nyheder sammenlignet.",
    customKpi: "Egen KPI med valgfri beregning.",
    discipline: "Selvvurderet disciplin-score og noter.",
    checklist: "Daglig tjekliste før/efter handel.",
    todaysTrades: "Dagens åbne og lukkede handler.",
    unnamedTrades: "Handler uden navn/tag klar til tagging.",
    tradingJournalShortcut: "Genvej til journal-siden.",
    accounts: "Overblik over konti og saldo.",
    challenges: "Status og fremdrift i challenges.",
    newsList: "Seneste markedsnyheder (top 5).",
    upcomingNews: "Kommende high-impact events (6–7).",
    tradingGoals: "Mål og milepæle med fremdrift.",
    mentorFeedback: "Kommentarer og opgaver fra mentor.",
    notificationsCenter: "System- og community-notifikationer.",
    welcome: "Velkomstmodul.",
    gamification: "Streaks, badges og niveauer.",
    dailyReminder: "Kort dagligt råd/fokus.",
    dailyFocus: "Dagens vigtigste fokuspunkt.",
    autoInsights: "Automatisk genererede indsigter.",
    teamGoals: "Teamets mål (read-only).",
    teamChallenges: "Fælles udfordringer og progress.",
    leaderboard: "Top 3–5 på leaderboardet.",
    myTeamRank: "Din placering i teamet.",
    teamAnnouncements: "Seneste team-opslag.",
    teamStreaks: "Antal i win-streak.",
    badgesEarnedByTeam: "Live feed af optjente badges.",
    communitySignals: "Seneste signaler fra community.",
    signalPerformance: "Snapshot af signalers performance.",
    riskAlerts: "Varsler ved for høj risiko.",
    portfolioValue: "Samlet portefølje-værdi.",
    pinnedResources: "Fastgjorte links/ressourcer.",
    upcomingSessions: "Kommende sessions/calls.",
};

/* ===== Katalog (kun widgets der findes i registry + sizes) ===== */
type CatalogItem = { slug: WidgetSlug; label: string; description: string; w: number; h: number };
type CatalogSection = { title: string; items: CatalogItem[] };

function buildCatalogFromWanted(): CatalogSection[] {
    const sections: CatalogSection[] = [];
    for (const sec of WANTED) {
        const items: CatalogItem[] = [];
        for (const it of sec.items) {
            const spec = widgetRegistry[it.slug];
            const size = widgetSizes[it.slug];
            if (!spec || !size) continue;
            const desc = spec.description ?? FALLBACK_DESC[it.slug] ?? "";
            items.push({
                slug: it.slug,
                label: it.label || spec.title || it.slug,
                description: desc,
                w: size.w ?? 3,
                h: size.h ?? 2,
            });
        }
        if (items.length) sections.push({ title: sec.title, items });
    }
    return sections;
}

/* ===== UI helpers ===== */
function AccordionSection({ title, count, open, onToggle, children }:{
    title: string; count?: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
    return (
        <section className="rounded-lg border border-neutral-800">
            <button type="button" onClick={onToggle}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-[#1a1717] transition"
                    aria-expanded={open}>
                <div className="text-sm font-medium">{title}</div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                    {count ? <span>{count}</span> : null}
                    <span className={`transition transform ${open ? "rotate-90" : ""}`}>›</span>
                </div>
            </button>
            <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">{children}</div>
            </div>
        </section>
    );
}

function WidgetTile({
                        item, onAdd, onDragStart, onDragEnd,
                    }:{
    item: CatalogItem;
    onAdd: () => void;
    onDragStart: (e: React.DragEvent, slug: WidgetSlug) => void;
    onDragEnd: () => void;
}) {
    const { slug, label, description, w, h } = item;
    return (
        <div
            draggable
            onDragStart={(e) => { onDragStart(e, slug); }}
            onDragEnd={onDragEnd}
            className="group rounded-lg border border-neutral-800 bg-[#1a1818] px-3 py-2 flex items-start justify-between gap-3 hover:border-amber-600/40 hover:bg-[#1d1919] transition"
            title="Træk til preview eller klik +"
        >
            <div className="min-w-0">
                <div className="text-sm text-neutral-200 truncate">
                    {label} <span className="text-[11px] text-neutral-500 align-middle">({w}×{h})</span>
                </div>
                <div className="text-[11px] text-neutral-500 line-clamp-2">{description || "—"}</div>
            </div>
            <button
                type="button"
                onClick={onAdd}
                className="ml-3 px-2 py-1 rounded-md text-xs border border-amber-500/60 text-amber-300 hover:bg-amber-500/10"
                aria-label={`Tilføj ${label}`}
            >
                +
            </button>
        </div>
    );
}

/* ===== Modal-komponent ===== */
export default function CustomizeLayoutModal({
                                                 open, onClose, onSave,
                                             }:{
    open: boolean;
    onClose: () => void;
    onSave: (instances: WidgetInstance[], layout: Layout[]) => void;
}) {
    const [stagedInstances, setStagedInstances] = useState<WidgetInstance[]>([]);
    const [stagedLayout, setStagedLayout] = useState<Layout[]>([]);
    const [openSection, setOpenSection] = useState<string | null>(null);

    // Drag state
    const dragSlugRef = useRef<WidgetSlug | null>(null);
    const [droppingWH, setDroppingWH] = useState<{ w: number; h: number }>({ w: 3, h: 2 });

    // Canvas ref (DOM element vi måler fra)
    const canvasRef = useRef<HTMLDivElement>(null);

    // Katalog
    const sections = useMemo(() => buildCatalogFromWanted(), []);

    // Init: tom editor, medmindre draft findes
    useEffect(() => {
        if (!open) return;
        const draft = loadDraftFromLS();
        if (draft) {
            setStagedInstances(draft.instances);
            setStagedLayout(draft.layout);
        } else {
            setStagedInstances([]);
            setStagedLayout([]);
        }
        setOpenSection(null);
        dragSlugRef.current = null;
    }, [open]);

    // Map id -> instance
    const instById = useMemo(() => {
        const m = new Map<string, WidgetInstance>();
        for (const w of stagedInstances) m.set(w.id, w);
        return m;
    }, [stagedInstances]);

    /* ---- Helpers ---- */
    const addWidget = (slug: WidgetSlug, initial?: { x?: number; y?: number; w?: number; h?: number }) => {
        const size = widgetSizes[slug] ?? { w: 3, h: 2 };
        const id = uid();
        const w = initial?.w ?? size.w;
        const h = initial?.h ?? size.h;
        const x = Math.max(0, Math.min(COLS - w, initial?.x ?? 0));
        const y = initial?.y ?? Infinity;

        setStagedInstances(prev => [...prev, { id, type: slug, title: widgetRegistry[slug]?.title ?? slug }]);
        setStagedLayout(prev => [...prev, { i: id, x, y, w, h, static: false }]);
    };

    const removeWidget = (id: string) => {
        setStagedInstances(prev => prev.filter(w => w.id !== id));
        setStagedLayout(prev => prev.filter(l => l.i !== id));
    };
    const toggleLock = (id: string) => {
        setStagedLayout(prev => prev.map(l => (l.i === id ? { ...l, static: !l.static } : l)));
    };
    const handleLayoutChange = (next: Layout[]) => setStagedLayout(next);

    const loadActive = () => {
        const act = loadActiveFromLS();
        if (act) { setStagedInstances(act.instances); setStagedLayout(act.layout); }
        else { setStagedInstances([]); setStagedLayout([]); }
    };
    const loadDefaultSeed = () => {
        const seed = seedDefaultFree();
        setStagedInstances(seed.instances);
        setStagedLayout(seed.layout);
    };
    const resetToBlank = () => { setStagedInstances([]); setStagedLayout([]); };

    // Drag fra venstre (start/slut)
    const handleTileDragStart = (e: React.DragEvent, slug: WidgetSlug) => {
        dragSlugRef.current = slug;
        const size = widgetSizes[slug] ?? { w: 3, h: 2 };
        setDroppingWH({ w: size.w, h: size.h });
        e.dataTransfer.setData("text/plain", slug);
        e.dataTransfer.effectAllowed = "copy";
    };
    const handleTileDragEnd = () => { dragSlugRef.current = null; };

    // Canvas DnD (manuel drop, så kompaktering ikke flytter elementer)
    const handleCanvasDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };

    const handleCanvasDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const slug = dragSlugRef.current ?? ((e.dataTransfer?.getData("text/plain") as WidgetSlug | "") || null);
        if (!slug) return;

        const root = canvasRef.current;
        if (!root) return;

        const gridChild = root.querySelector(".react-grid-layout") as HTMLElement | null;
        const rectEl: HTMLElement = gridChild ?? root;
        if (!rectEl || typeof rectEl.getBoundingClientRect !== "function") return;

        const rect = rectEl.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top;

        // Grid-matematik
        const colWidth = (rect.width - CONTAINER_PADDING_X * 2 - MARGIN_X * (COLS - 1)) / COLS;
        const cellW = colWidth + MARGIN_X;
        const cellH = ROW_HEIGHT + MARGIN_Y;

        let x = Math.floor(relX / cellW);
        let y = Math.floor(relY / cellH);

        const w = Math.min(droppingWH.w, COLS);
        const h = droppingWH.h;

        x = Math.max(0, Math.min(COLS - w, x));
        y = Math.max(0, y);

        addWidget(slug, { x, y, w, h });
        dragSlugRef.current = null;
    };

    if (!open) return null;

    return createPortal(
        <div className="tt-customize fixed inset-0 z-50">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
            {/* Modal */}
            <div className="relative z-10 h-full w-full flex">
                {/* Venstre panel */}
                <aside className="w-[340px] max-w-[40vw] h-full bg-[#141212] border-r border-neutral-800 p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Tilpas layout</h2>
                        <button onClick={onClose} className="px-2 py-1 rounded-md text-xs border border-neutral-700 text-neutral-200 hover:bg-neutral-800">Luk</button>
                    </div>
                    <p className="text-xs text-neutral-400 mb-3">Træk widgets over i preview, eller brug <span className="text-neutral-200">+</span>.</p>

                    <div className="space-y-3">
                        {sections.map((sec) => {
                            const isOpen = openSection === sec.title;
                            return (
                                <AccordionSection key={sec.title} title={sec.title} count={`(${sec.items.length})`} open={!!isOpen} onToggle={() => setOpenSection(isOpen ? null : sec.title)}>
                                    <div className="px-2 pb-2 grid gap-2">
                                        {sec.items.map((item) => (
                                            <WidgetTile
                                                key={item.slug}
                                                item={item}
                                                onAdd={() => addWidget(item.slug)}
                                                onDragStart={handleTileDragStart}
                                                onDragEnd={handleTileDragEnd}
                                            />
                                        ))}
                                    </div>
                                </AccordionSection>
                            );
                        })}
                    </div>
                </aside>

                {/* Højre panel (preview/puzzle) */}
                <main className="flex-1 h-full bg-[#0f0d0d] p-4 overflow-hidden">
                    {/* Sticky topbar med actions */}
                    <div className="sticky top-0 z-10 -mt-4 -mx-4 px-4 py-2 bg-[#0f0d0d] border-b border-neutral-900 flex items-center justify-between">
                        <div className="text-xs text-neutral-400">
                            <strong className="text-neutral-200">Preview:</strong> Flyt/resize i preview. Ændringer træder først i kraft ved <em>Gem</em>.
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={onClose} className="px-2 py-1 rounded-md text-xs border border-neutral-700 text-neutral-200 hover:bg-neutral-800">Annuller</button>
                            <button onClick={loadDefaultSeed} className="px-2 py-1 rounded-md text-xs border border-neutral-700 text-neutral-200 hover:bg-neutral-800" title="Vis Trading Tracker standard-dashboard i editoren">Default</button>
                            <button onClick={loadActive} className="px-2 py-1 rounded-md text-xs border border-neutral-700 text-neutral-200 hover:bg-neutral-800" title="Indlæs dit nuværende gemte dashboard i editoren">Aktuelt</button>
                            <button onClick={resetToBlank} className="px-2 py-1 rounded-md text-xs border border-neutral-700 text-neutral-200 hover:bg-neutral-800">Nulstil</button>
                            <button
                                onClick={() => { saveDraftToLS(stagedInstances, stagedLayout); onSave(stagedInstances, stagedLayout); }}
                                className="px-3 py-1.5 rounded-md text-xs border border-amber-500 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                            >
                                Gem
                            </button>
                        </div>
                    </div>

                    {/* Canvas */}
                    <div className="h-[calc(100%-56px)] rounded-xl border border-neutral-800 bg-[#151313] p-4 overflow-auto mt-3">
                        <div
                            ref={canvasRef}
                            className="h-full w-full rounded-lg"
                            onDragOver={handleCanvasDragOver}
                            onDrop={handleCanvasDrop}
                        >
                            <RGL
                                className="layout"
                                cols={COLS}
                                rowHeight={ROW_HEIGHT}
                                margin={[MARGIN_X, MARGIN_Y] as [number, number]}
                                containerPadding={[CONTAINER_PADDING_X, 16] as [number, number]}
                                /* ingen kompaktering → kan slippe i tomme områder */
                                compactType={null}
                                isBounded={false}
                                preventCollision
                                layout={stagedLayout}
                                onLayoutChange={handleLayoutChange}
                                /* stor drag-zone i headerens venstre side */
                                draggableHandle=".tt-drag-region"
                                /* knapper må klikkes frit */
                                draggableCancel="a, input, textarea, select, button"
                            >
                                {stagedLayout.map((l) => {
                                    const inst = instById.get(l.i);
                                    const slug = inst?.type;
                                    if (!slug) {
                                        return <div key={l.i} className="rounded-md border border-neutral-800 bg-[#1c1a1a] p-4 text-xs text-neutral-400">Ukendt widget</div>;
                                    }
                                    const spec = widgetRegistry[slug];
                                    const Comp = spec?.component;
                                    const title = spec?.title ?? slug;

                                    return (
                                        <div key={l.i}>
                                            <EditorChrome title={title} isLocked={!!l.static} onRemove={() => removeWidget(l.i)} onToggleLock={() => toggleLock(l.i)}>
                                                {Comp ? <Comp instanceId={l.i} /> : null}
                                            </EditorChrome>
                                        </div>
                                    );
                                })}
                            </RGL>
                        </div>
                    </div>

                    {/* (beholder også bund-knapper hvis du vil – men topbaren er den vigtigste) */}
                    <div className="mt-4 flex items-center justify-end gap-2">
                        <button onClick={onClose} className="px-3 py-1.5 rounded-md text-xs border border-neutral-700 text-neutral-200 hover:bg-neutral-800">Annuller</button>
                        <button onClick={loadDefaultSeed} className="px-2 py-1 rounded-md text-xs border border-neutral-700 text-neutral-200 hover:bg-neutral-800">Default</button>
                        <button onClick={loadActive} className="px-2 py-1 rounded-md text-xs border border-neutral-700 text-neutral-200 hover:bg-neutral-800">Aktuelt</button>
                        <button onClick={resetToBlank} className="px-2 py-1 rounded-md text-xs border border-neutral-700 text-neutral-200 hover:bg-neutral-800">Nulstil</button>
                        <button
                            onClick={() => { saveDraftToLS(stagedInstances, stagedLayout); onSave(stagedInstances, stagedLayout); }}
                            className="px-3 py-1.5 rounded-md text-xs border border-amber-500 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                        >
                            Gem
                        </button>
                    </div>
                </main>
            </div>
        </div>,
        document.body
    );
}

/* ===== Editor-chrome (bred drag-region i header) ===== */
function EditorChrome({
                          title, isLocked, onRemove, onToggleLock, children,
                      }:{
    title: string; isLocked: boolean; onRemove: () => void; onToggleLock: () => void; children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-neutral-800 bg-[#191717] overflow-hidden">
            <div className="flex items-center justify-between px-2 py-1 border-b border-neutral-800">
                {/* stor drag-region: hele venstre side af headeren */}
                <div className="tt-drag-region flex-1 min-w-0 cursor-move select-none py-0.5 pr-2">
                    <div className="text-xs font-medium truncate">{title}</div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={onToggleLock}
                        className="px-1 py-0.5 text-[11px] rounded border border-neutral-700 hover:bg-neutral-800"
                        title={isLocked ? "Lås op" : "Lås"}
                        aria-label={isLocked ? "Lås op" : "Lås"}
                    >
                        {isLocked ? "🔒" : "🔓"}
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="px-1 py-0.5 text-[11px] rounded border border-neutral-700 hover:bg-neutral-800"
                        title="Fjern"
                        aria-label="Fjern"
                    >
                        ✕
                    </button>
                </div>
            </div>
            <div className="p-2">{children}</div>
        </div>
    );
}
