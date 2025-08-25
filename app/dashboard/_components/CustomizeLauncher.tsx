"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Layout } from "react-grid-layout";

const CustomizeLayoutModal = dynamic(
    () => import("./CustomizeLayoutModal"),
    { ssr: false }
);

export default function CustomizeLauncher({ initialLayout }: { initialLayout: Layout[] }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="rounded-lg border border-yellow-700/40 px-3 py-1.5 text-sm text-yellow-200 hover:bg-yellow-700/10"
                title="Tilpas layout"
            >
                Tilpas layout
            </button>

            {open && (
                <CustomizeLayoutModal
                    isOpen={open}
                    onClose={() => setOpen(false)}
                    initialLayout={initialLayout}
                />
            )}
        </>
    );
}
