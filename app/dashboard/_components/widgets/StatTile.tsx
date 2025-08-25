"use client";
import { useEffect, useMemo, useState } from "react";
import { usePlan, hasAccess, type Plan } from "../PlanContext";
import LockNotice from "../LockNotice";

export type Timeframe = "daily" | "weekly" | "monthly";
export type KPIKey =
    | "winrate" | "hitrate" | "accountGrowth"
    | "pl" | "trades" | "rr" | "expectancy" | "drawdown" | "streaks"
    | "sessionPerf" | "sharpe" | "sortino"
    | "setupDistribution" | "newsVsNoNews" | "customKPI";

type Visual =
    | "donut"
    | "spark"           // linje
    | "sparkArea"       // linje + area
    | "sparkBars"       // kolonne-sparkline
    | "textTrend"       // tal + pil op/ned
    | "segments3"       // 3 segmenter i én bar
    | "stack3"          // stacked bar (A/B/C)
    | "doubleBars";     // to bars side-by-side

type Meta = {
    label: string;
    visual: Visual;
    fmt: (v:number)=>string;
    percent?: boolean;
    required?: Plan;
    target?: number;     // til sharpe/sortino mål
    hintBase?: string;   // grundtekst til hint (uden "i perioden" / "pr. periode")
    perPeriod?: boolean; // hvis true -> "… pr. dag/uge/måned", ellers "… i perioden"
};

const KPI_META: Record<KPIKey, Meta> = {
    // Donuts (centreret, stor)
    winrate:       { label: "Succesrate",    visual:"donut",    fmt:v=>`${v.toFixed(0)}%`, percent:true, hintBase:"Succesrate" },
    hitrate:       { label: "Hit rate",      visual:"donut",    fmt:v=>`${v.toFixed(0)}%`, percent:true, hintBase:"Andel handler som rammer TP1" },
    accountGrowth: { label: "Kontovækst",    visual:"donut",    fmt:v=>`${v.toFixed(0)}%`, percent:true, required:"premium", hintBase:"Balancevækst" },

    // P/L (area‑sparkline) + Antal trades (kolonner = forrige perioder)
    pl:            { label: "P/L",           visual:"sparkArea", fmt:v=>(v>=0?"+":"")+v.toFixed(1), hintBase:"Profit/tab" },
    trades:        { label: "Trades",        visual:"sparkBars", fmt:v=>v.toFixed(0), hintBase:"Antal handler", perPeriod:true },

    // R/R + Drawdown = tekst + trendpil
    rr:            { label: "R/R",           visual:"textTrend", fmt:v=>v.toFixed(2), hintBase:"Gennemsnitligt risk/reward-forhold" },
    drawdown:      { label: "Drawdown",      visual:"textTrend", fmt:v=>`-${v.toFixed(0)}%`, required:"premium", hintBase:"Største træk tilbage" },

    // Expectancy = sparkline
    expectancy:    { label: "Expectancy",    visual:"spark",     fmt:v=>v.toFixed(2), required:"premium", hintBase:"Forventet afkast pr. trade (EV)" },

    // Streaks = tekst + pil (kan skiftes til badges senere)
    streaks:       { label: "Streaks",       visual:"textTrend", fmt:v=>v.toFixed(0), required:"premium", hintBase:"Længste win/lose-streak" },

    // Session performance = 3 segmenter
    sessionPerf:   { label: "Session perf.", visual:"segments3", fmt:v=>`${v.toFixed(0)}%`, required:"premium", hintBase:"Andel/fordeling pr. session (Asia/London/NY)" },

    // Sharpe/Sortino = spark + targetlinje
    sharpe:        { label: "Sharpe",        visual:"spark",     fmt:v=>v.toFixed(2), required:"pro", target:1.0, hintBase:"Sharpe ratio" },
    sortino:       { label: "Sortino",       visual:"spark",     fmt:v=>v.toFixed(2), required:"pro", target:1.0, hintBase:"Sortino ratio" },

    // Setup distribution = stacked bar
    setupDistribution:{ label: "Setup dist.",visual:"stack3",    fmt:v=>`${v.toFixed(0)}%`, required:"pro", hintBase:"Fordeling af setup‑typer (A/B/C)" },

    // News vs no news = double bars
    newsVsNoNews:  { label: "News vs no‑news", visual:"doubleBars", fmt:v=>`${v.toFixed(0)}%`, required:"pro", hintBase:"Performance med vs. uden nyheder" },

    // Custom KPI = fallback visual
    customKPI:     { label: "Custom KPI",    visual:"spark",     fmt:v=>v.toFixed(2), required:"pro", hintBase:"Brugerdefineret nøgletal" },
};

export type StatTileConfig = { kpi: KPIKey; tf: Timeframe };

const REQUIRED_TF: Record<Timeframe, Plan> = { daily:"free", weekly:"premium", monthly:"pro" };

/* -------------------- MOCK DATA (erstattes senere) -------------------- */
function rand(min:number,max:number){return min+Math.random()*(max-min);}
function clamp01(x:number){return Math.max(0, Math.min(1, x));}

function mockSeries(kpi: KPIKey, tf: Timeframe, len: number) {
    const baseMult = tf === "daily" ? 0.5 : tf === "weekly" ? 1 : 1.8;
    return Array.from({length: len}, (_,i)=>{
        const wobble = 0.92 + Math.sin(i*0.6)*0.06 + Math.random()*0.05;
        switch (kpi) {
            case "winrate": return 65*baseMult*wobble;
            case "hitrate": return 68*baseMult*wobble;
            case "accountGrowth": return 3*baseMult*wobble;
            case "pl": return 200*baseMult*wobble*(Math.random()<0.35?-1:1);
            case "trades": return (tf==="daily"?5:tf==="weekly"?22:80)*wobble; // ⇐ tidligere dage/uger/måneder
            case "rr": return 1.6*wobble;
            case "expectancy": return 0.25*baseMult*wobble;
            case "drawdown": return 12*baseMult*wobble;
            case "streaks": return (tf==="daily"?2:tf==="weekly"?4:6)*wobble;
            case "sessionPerf": return 60*baseMult*wobble;
            case "sharpe": return 1.2*wobble;
            case "sortino": return 1.4*wobble;
            case "setupDistribution": return 40*baseMult*wobble;
            case "newsVsNoNews": return 55*baseMult*wobble;
            case "customKPI": return 0.8*wobble;
        }
    });
}

function mockSegments3(){ // Asia/London/NY
    const a = rand(0.2,0.35), l = rand(0.3,0.45), n = rand(0.2,0.4);
    const sum = a+l+n; return [a/sum,l/sum,n/sum];
}
function mockSetupStack(){ const a=rand(0.3,0.5), b=rand(0.2,0.4), c=Math.max(0,1-a-b); return [a,b,c]; }
function mockNewsVsNoNews(){ return [rand(0.45,0.65), rand(0.55,0.75)]; }
/* -------------------------------------------------------------------- */

export default function StatTile({ config, accountId = "acc-main" }: { config: StatTileConfig; accountId?: string | null; }) {
    const plan = usePlan();
    const [tf, setTf] = useState<Timeframe>(config.tf);
    useEffect(() => setTf(config.tf), [config.tf]);

    const gold = "#D4AF37";
    const meta = KPI_META[config.kpi];

    const len = tf === "daily" ? 14 : 12;
    const series = useMemo(()=>mockSeries(config.kpi, tf, len), [config.kpi, tf, len]);
    const latest = series[series.length-1] ?? 0;
    const prev   = series[series.length-2] ?? latest;
    const delta  = latest - prev;

    const tfAllowed  = hasAccess(plan, REQUIRED_TF[tf]);
    const kpiAllowed = hasAccess(plan, meta.required ?? "free");

    const [toast, setToast] = useState<string | null>(null);
    useEffect(()=>{ if(!toast) return; const t=setTimeout(()=>setToast(null),2400); return ()=>clearTimeout(t);},[toast]);

    function trySetTimeframe(next: Timeframe){
        if (hasAccess(plan, REQUIRED_TF[next])) setTf(next);
        else setToast(`🔒 ${next[0].toUpperCase()+next.slice(1)} kræver ${REQUIRED_TF[next]==="pro"?"Pro":"Premium"}.`);
    }

    // ---------- “siden sidst” og hint ----------
    const tfLabel = tf === "daily" ? "i går" : tf === "weekly" ? "sidste uge" : "sidste måned";
    function deltaText(kpi: KPIKey, d: number){
        const sign = d>=0?"+":"";
        switch (kpi) {
            case "winrate":
            case "hitrate":
            case "accountGrowth":
                return `${sign}${Math.abs(d).toFixed(0)}%`;
            case "trades":
                return `${sign}${Math.round(Math.abs(d))}`;
            case "pl":
                return `${sign}${Math.abs(d).toFixed(1)}`;
            case "rr":
            case "expectancy":
            case "sharpe":
            case "sortino":
            case "customKPI":
                return `${sign}${Math.abs(d).toFixed(2)}`;
            case "drawdown":
                return `${sign}${Math.abs(d).toFixed(0)}%`;
            case "sessionPerf":
            case "setupDistribution":
            case "newsVsNoNews":
                return `${sign}${Math.abs(d).toFixed(0)}%`;
            case "streaks":
                return `${sign}${Math.round(Math.abs(d))}`;
        }
    }
    const sinceText = `${deltaText(config.kpi, delta)} vs. ${tfLabel}`;

    const periodLabel = (t: Timeframe) => t === "daily" ? "dag" : t === "weekly" ? "uge" : "måned";
    const hintText = meta.hintBase
        ? meta.perPeriod
            ? `${meta.hintBase} pr. ${periodLabel(tf)}`
            : `${meta.hintBase} i perioden`
        : undefined;

    // ---------- tegnehjælpere ----------
    function Spark({ area=false, target }: { area?: boolean; target?: number }) {
        const w=120,h=36;
        if (series.length<=1) return null;
        const min=Math.min(...series), max=Math.max(...series);
        const norm=(v:number)=> h - ((v-min)/(max-min||1))*h;
        const step=w/(series.length-1);
        const path = series.map((v,i)=>`${i===0?"M":"L"} ${i*step},${norm(v)}`).join(" ");
        const areaPath = `M 0,${h} ${series.map((v,i)=>`L ${i*step},${norm(v)}`).join(" ")} L ${w},${h} Z`;
        return (
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9 mt-1">
                {area && <path d={areaPath} fill="rgba(212,175,55,0.12)" />}
                <path d={path} fill="none" stroke={gold} strokeWidth="2" />
                {typeof target === "number" && (
                    <line x1="0" x2={w} y1={norm(target)} y2={norm(target)} stroke="#666" strokeDasharray="3 3" />
                )}
            </svg>
        );
    }

    function SparkBars() {
        const w=120,h=36;
        const max=Math.max(...series, 1);
        const bars = series.map(v => (v/max)*h);
        const bw = Math.max(3, Math.floor(w / (bars.length*1.4)));
        const gap = bw*0.4;
        return (
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9 mt-1">
                {bars.map((bh,i)=>(
                    <rect key={i} x={i*(bw+gap)} y={h-bh} width={bw} height={bh} fill={gold} opacity={0.75}/>
                ))}
            </svg>
        );
    }

    function Donut({ value }: { value: number }) {
        // STOR, CENTRERET DONUT
        const pct = meta.percent ? Math.max(0, Math.min(100, value)) : value;
        const r=32, c=2*Math.PI*r, off=c*(1-(meta.percent? pct/100 : clamp01(pct)));
        return (
            <div className="relative">
                <svg viewBox="0 0 96 96" className="w-24 h-24">
                    <circle cx="48" cy="48" r={r} stroke="#262626" strokeWidth="8" fill="none"/>
                    <circle cx="48" cy="48" r={r} stroke={gold} strokeWidth="8" fill="none"
                            strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 48 48)"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">{meta.fmt(value)}</span>
                </div>
            </div>
        );
    }

    function Segments3() {
        const [a,l,n] = mockSegments3(); // Asia/London/NY
        const w=120,h=14;
        const aw=w*a, lw=w*l, nw=w*n;
        return (
            <div className="mt-2">
                <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-3 rounded overflow-hidden">
                    <rect x="0"   y="0" width={aw} height={h} fill="#444"/>
                    <rect x={aw}  y="0" width={lw} height={h} fill={gold}/>
                    <rect x={aw+lw} y="0" width={nw} height={h} fill="#666"/>
                </svg>
                <div className="mt-1 text-[10px] text-neutral-300 flex justify-between">
                    <span>Asia</span><span>London</span><span>NY</span>
                </div>
            </div>
        );
    }

    function Stack3() {
        const [a,b,c] = mockSetupStack();
        const w=120,h=12;
        const aw=w*a, bw=w*b, cw=w*c;
        return (
            <div className="mt-2">
                <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-3 rounded overflow-hidden">
                    <rect x="0"    y="0" width={aw} height={h} fill="#7a7a7a"/>
                    <rect x={aw}   y="0" width={bw} height={h} fill={gold}/>
                    <rect x={aw+bw} y="0" width={cw} height={h} fill="#474747"/>
                </svg>
                <div className="mt-1 text-[10px] text-neutral-300 flex justify-between">
                    <span>A</span><span>B</span><span>C</span>
                </div>
            </div>
        );
    }

    function DoubleBars() {
        const [withNews, noNews] = mockNewsVsNoNews();
        const w=120,h=36,max=1;
        const barW=22,gap=10;
        const y = (v:number)=> h - (v/max)*h;
        return (
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9 mt-1">
                <rect x={w/2 - gap - barW} y={y(withNews)} width={barW} height={h - y(withNews)} fill={gold} />
                <rect x={w/2 + gap}       y={y(noNews)}   width={barW} height={h - y(noNews)}   fill="#666" />
                <text x={w/2 - gap - barW/2} y={y(withNews)-2} textAnchor="middle" className="fill-white" fontSize="9">{Math.round(withNews*100)}%</text>
                <text x={w/2 + gap + barW/2} y={y(noNews)-2}   textAnchor="middle" className="fill-white" fontSize="9">{Math.round(noNews*100)}%</text>
            </svg>
        );
    }

    const showLock = !(tfAllowed && kpiAllowed);
    const deltaUp = delta >= 0;
    const trendClr = deltaUp ? "text-green-400" : "text-red-400";
    const trendIcon = deltaUp ? "▲" : "▼";

    return (
        <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-3 relative outline outline-1 outline-[#D4AF37]/30 min-h-[190px] flex flex-col">
            {/* Header (titel + timeframe tabs) */}
            <div className="flex items-center justify-between gap-2">
                <div className="text-neutral-300 text-xs">
                    {KPI_META[config.kpi].label}{meta.required ? ` · ${meta.required.toUpperCase()}` : ""}
                </div>

                <div className="flex items-center gap-1">
                    {(["daily","weekly","monthly"] as Timeframe[]).map((t) => {
                        const can = hasAccess(plan, REQUIRED_TF[t]);
                        const active = tf === t;
                        return (
                            <button
                                key={t}
                                onClick={() => {
                                    if (can) setTf(t);
                                    else setToast(`🔒 ${t[0].toUpperCase()+t.slice(1)} kræver ${REQUIRED_TF[t]==="pro"?"Pro":"Premium"}.`);
                                }}
                                className={`px-2 py-0.5 rounded-md text-[11px] uppercase tracking-wide border ${active ? "text-black border-neutral-200" : "text-neutral-300 border-neutral-700"} ${!can ? "opacity-60" : ""}`}
                                style={active ? { backgroundColor: "#D4AF37" } : {}}
                                title={can ? t : `Kræver ${REQUIRED_TF[t] === "pro" ? "Pro" : "Premium"}`}
                            >
                                {t[0].toUpperCase()+t.slice(1)} {!can && "🔒"}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className={`mt-2 ${showLock ? "blur-[2px] opacity-70" : ""} flex-1 flex flex-col items-center justify-center`}>
                {meta.visual==="donut" ? (
                    <Donut value={meta.percent ? Math.max(0,Math.min(100,latest)) : latest} />
                ) : (
                    <div className="w-full">
                        <div className="text-white text-2xl font-semibold flex items-center gap-2">
                            {meta.visual==="textTrend" ? (
                                <>
                                    <span>{meta.fmt(latest)}</span>
                                    <span className={`${trendClr} text-sm`}>{trendIcon}</span>
                                </>
                            ) : (
                                <span>{meta.fmt(latest)}</span>
                            )}
                        </div>

                        {meta.visual==="spark"      && <Spark area={false} target={meta.target} />}
                        {meta.visual==="sparkArea"  && <Spark area={true} />}
                        {meta.visual==="sparkBars"  && <SparkBars />}
                        {meta.visual==="segments3"  && <Segments3 />}
                        {meta.visual==="stack3"     && <Stack3 />}
                        {meta.visual==="doubleBars" && <DoubleBars />}
                    </div>
                )}
            </div>

            {/* “Siden sidst” + dynamisk hint */}
            <div className="mt-1 text-[11px] text-neutral-400">
                {sinceText}
            </div>
            {hintText && (
                <div className="text-[11px] italic text-neutral-400">{hintText}</div>
            )}

            {/* Lås */}
            {showLock && (
                <LockNotice label={`Kræver ${(!tfAllowed && REQUIRED_TF[tf]==="pro") || (!kpiAllowed && (meta.required==="pro")) ? "Pro" : "Premium"}`} />
            )}

            {/* Toast */}
            {toast && (
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 translate-y-full bg-neutral-900 border border-neutral-700 text-neutral-100 text-xs px-3 py-1 rounded-lg shadow">
                    {toast}
                </div>
            )}
        </div>
    );
}
