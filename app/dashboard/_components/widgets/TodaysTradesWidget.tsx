"use client";

type Trade = {
    id: string;
    symbol: string;
    time: string;
    setup: string;
    pnl?: string;
};

type Props = { instanceId: string };

export default function TodaysTradesWidget({ instanceId }: Props) {
    const open: Trade[] = [
        { id: "t1", symbol: "US100", time: "09:26Z", setup: "Reversal", pnl: "+9" },
        { id: "t2", symbol: "XAUUSD", time: "11:07Z", setup: "Pullback", pnl: "-18" },
        { id: "t3", symbol: "SPX500", time: "15:23Z", setup: "Pullback", pnl: "+5" },
    ];
    const closed: Trade[] = [
        { id: "c1", symbol: "GBPUSD", time: "23:19Z", setup: "Unavngivet", pnl: "-108" },
        { id: "c2", symbol: "GBPUSD", time: "20:46Z", setup: "Breakout", pnl: "+93" },
        { id: "c3", symbol: "XAUUSD", time: "18:16Z", setup: "Unavngivet", pnl: "+59" },
    ];

    const unnamedCount = closed.filter((t) => t.setup === "Unavngivet").length;

    return (
        <div className="h-full flex flex-col gap-3">
            {/* Kun action-link, ingen titel – titel kommer fra WidgetChrome */}
            <div className="flex justify-end">
                <a className="text-xs border border-neutral-700 rounded-md px-2 py-1 hover:bg-neutral-800" href="/journal">
                    Hurtig navngivning
                </a>
            </div>

            <div className="grid grid-cols-2 gap-3 min-h-0">
                <Col title="Åbne" items={open.slice(0, 3)} />
                <Col title="Senest lukkede" items={closed.slice(0, 3)} />
            </div>

            <p className="text-xs text-neutral-500">
                Du har {unnamedCount} trades uden noter.{" "}
                <a className="underline" href="/journal?filter=missing-notes">
                    Se alle her
                </a>
                .
            </p>
        </div>
    );
}

function Col({ title, items }: { title: string; items: Trade[] }) {
    return (
        <div className="rounded-md border border-neutral-800 p-2 overflow-auto">
            <div className="text-xs text-neutral-400 mb-2">{title}</div>
            <div className="space-y-2">
                {items.map((t) => (
                    <div key={t.id} className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">{t.symbol}</div>
                            <div className="text-xs text-neutral-400">
                                {t.time} · {t.setup}
                            </div>
                        </div>
                        <div className={t.pnl?.startsWith("-") ? "text-red-400" : "text-emerald-400"}>{t.pnl}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
