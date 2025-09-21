"use client";

import { ReactNode } from "react";
import HelpTip from "./HelpTip";

type Props = {
    title: string;
    helpText?: string;
    children: ReactNode;

    // Live-dashboard: lad være med at sende disse => ingen lås/X vises.
    // Customize: send dem, eller sæt showActions=true.
    showActions?: boolean;
    isLocked?: boolean;
    onRemove?: () => void;
    onToggleLock?: () => void;
};


export default function WidgetChrome({
                                         title,
                                         helpText,
                                         children,
                                         showActions = false,
                                         isLocked,
                                         onRemove,
                                         onToggleLock,
                                     }: Props) {
    return (
        <div className="rounded-xl p-4 bg-neutral-900/60 dark:bg-neutral-800/60 border border-neutral-800 relative">
            <div className="tt-widget-header mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="font-medium">{title}</div>
                    {helpText ? <HelpTip text={helpText} /> : null}
                </div>

                {showActions && (onRemove || onToggleLock) ? (
                    <div className="flex items-center gap-2">
                        {typeof onToggleLock === "function" ? (
                            <button
                                type="button"
                                onClick={onToggleLock}
                                className="px-2 py-1 rounded-md text-xs border border-neutral-600 text-neutral-200 hover:bg-neutral-800"
                                title={isLocked ? "Lås op" : "Lås"}
                            >
                                {isLocked ? "🔒" : "🔓"}
                            </button>
                        ) : null}

                        {typeof onRemove === "function" ? (
                            <button
                                type="button"
                                onClick={onRemove}
                                className="px-2 py-1 rounded-md text-xs border border-red-600 text-red-200 hover:bg-red-900/40"
                                title="Fjern widget"
                            >
                                ✕
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </div>

            {children}
        </div>
    );
}
