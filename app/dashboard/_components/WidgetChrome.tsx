"use client";

import { ReactNode } from "react";

type Props = {
    title?: string;
    helpText?: string;
    isLocked?: boolean;
    onRemove?: () => void;
    onToggleLock?: () => void;
    /** default = normal chrome; bare = render children only (no header/border) */
    variant?: "default" | "bare";
    children: ReactNode;
};

// Small dot for the section title (kept as-is)
const TitleDot = () => (
    <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2 align-middle" />
);

export default function WidgetChrome({
                                         title,
                                         helpText,
                                         isLocked,
                                         onRemove,
                                         onToggleLock,
                                         variant = "default",
                                         children,
                                     }: Props) {
    if (variant === "bare") {
        // No header, no outer panel — just render the body
        return <>{children}</>;
    }

    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TitleDot />
                    <h3 className="font-medium">{title}</h3>
                    {helpText ? (
                        <span className="text-xs text-neutral-400">{helpText}</span>
                    ) : null}
                </div>

                {/* Actions on hover (as you already have) */}
                <div className="flex items-center gap-2 opacity-70 hover:opacity-100 transition">
                    {onToggleLock && (
                        <button
                            type="button"
                            className="p-1 rounded hover:bg-neutral-700"
                            title={isLocked ? "Lås op" : "Lås"}
                            onClick={onToggleLock}
                        >
                            {isLocked ? "🔒" : "🔓"}
                        </button>
                    )}
                    {onRemove && (
                        <button
                            type="button"
                            className="p-1 rounded hover:bg-neutral-700"
                            title="Fjern"
                            onClick={onRemove}
                        >
                            ✖
                        </button>
                    )}
                </div>
            </div>

            {/* Body */}
            {children}
        </div>
    );
}
