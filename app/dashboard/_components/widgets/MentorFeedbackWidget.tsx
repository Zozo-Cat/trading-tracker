"use client";
import DashboardCard from "../DashboardCard";

type FB = { id: string; mentor: string; when: string; text: string };

export default function MentorFeedbackWidget() {
    const items: FB[] = [
        { id: "m1", mentor: "Signe K.", when: "i dag 09:12", text: "Flot tålmodighed — godt exit ved 1.8R." },
        { id: "m2", mentor: "Lars Ø.",  when: "i går 14:41", text: "Husk ingen news‑trades. Ellers stærk plan." },
        { id: "m3", mentor: "Amalie N.",when: "i går 10:05", text: "God journaling. Prøv BE ved +1R konsekvent." },
    ];

    return (
        <DashboardCard title="Mentor feedback" subtitle={<span className="text-[11px] text-neutral-400">Seneste 3</span>}>
            <div className="space-y-2">
                {items.map(f => (
                    <div key={f.id} className="rounded border border-neutral-800 bg-neutral-900/60 p-3">
                        <div className="flex items-center justify-between">
                            <div className="text-white text-sm">{f.mentor}</div>
                            <div className="text-[11px] text-neutral-400">{f.when}</div>
                        </div>
                        <div className="mt-1 text-sm text-neutral-200">{f.text}</div>
                    </div>
                ))}
            </div>
        </DashboardCard>
    );
}
