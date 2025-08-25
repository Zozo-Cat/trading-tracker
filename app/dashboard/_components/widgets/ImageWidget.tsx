"use client";
import { useState } from "react";
import DashboardCard from "../DashboardCard";

export default function ImageWidget() {
    const [url, setUrl] = useState("https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop");
    return (
        <DashboardCard title="Banner / Billede" right={<span className="text-[11px] text-neutral-400">URL</span>}>
            <div className="h-full flex flex-col gap-2">
                <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://…"
                    className="w-full rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-sm text-neutral-200"
                />
                <div className="flex-1 rounded-lg overflow-hidden border border-neutral-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="banner" className="w-full h-full object-cover" />
                </div>
            </div>
        </DashboardCard>
    );
}
