"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export type Mode = "personal" | "leader";

export default function DashboardSwitcher({ isLeader }: { isLeader: boolean }) {
    const sp = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (!isLeader) {
            const current = sp.get("mode");
            if (current === "leader") {
                const params = new URLSearchParams(sp);
                params.set("mode", "personal");
                router.replace(`?${params.toString()}`);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLeader]);

    if (!isLeader) return null;

    const mode = (sp.get("mode") as Mode) || "leader";
    const setMode = (next: Mode) => {
        const params = new URLSearchParams(sp);
        params.set("mode", next);
        router.replace(`?${params.toString()}`);
    };

    const gold = "#D4AF37";

    const baseBtn = "px-4 py-1.5 rounded-xl text-sm transition";
    const inactive = "text-neutral-300 hover:text-white bg-neutral-800/40";

    return (
        <div className="w-full flex items-center justify-center">
            <div className="inline-flex rounded-2xl bg-neutral-900 border border-neutral-700 p-1.5 shadow-sm" role="tablist" aria-label="Dashboard mode">
                <button
                    role="tab"
                    aria-selected={mode === "personal"}
                    onClick={() => setMode("personal")}
                    className={`${baseBtn} ${mode === "personal" ? "text-black" : inactive}`}
                    style={mode === "personal" ? { backgroundColor: gold } : {}}
                >
                    Personligt
                </button>
                <button
                    role="tab"
                    aria-selected={mode === "leader"}
                    onClick={() => setMode("leader")}
                    className={`${baseBtn} ${mode === "leader" ? "text-black" : inactive}`}
                    style={mode === "leader" ? { backgroundColor: gold } : {}}
                >
                    Leder
                </button>
            </div>
        </div>
    );
}
