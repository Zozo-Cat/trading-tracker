"use client";

import { ReactNode } from "react";

type WidgetChromeProps = {
    title: string;
    helpText?: string;
    isLocked?: boolean;
    onRemove?: () => void;
    onToggleLock?: () => void;
    /** Valgfrit: lille badge i headeren, fx "3×2" i Tilpas-views */
    meta?: string;
    children?: ReactNode;
};

export default function WidgetChrome({
                                         title,
                                         helpText,
                                         isLocked,
                                         onRemove,
                                         onToggleLock,
                                         meta,
                                         children,
                                     }: WidgetChromeProps) {
    return (
        <div className="tt-widget chrome border border-neutral-700/70 rounded-xl overflow-hidden flex flex-col bg-neutral-900/60 shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
            {/* Header */}
            <div className="tt-widget-header flex items-center justify-between px-3 py-2 border-b border-neutral-800/70 bg-[rgba(25,22,22,0.75)]">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="h-2 w-2 rounded-full bg-amber-500/70 shrink-0" aria-hidden />
                    <h3 className="text-[13px] font-medium text-neutral-100 truncate">{title}</h3>
                    {meta ? (
                        <span className="ml-1 inline-flex items-center rounded-md border border-neutral-700/70 px-1.5 py-0.5 text-[10px] leading-none text-neutral-300">
              {meta}
            </span>
                    ) : null}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {/* Help */}
                    <button
                        type="button"
                        className="px-1.5 py-1 rounded-md text-neutral-300/80 hover:text-white hover:bg-neutral-800/70 transition"
                        title={helpText || "Hjælp"}
                        aria-label="Hjælp"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-90">
                            <path
                                d="M12 2a10 10 0 100 20 10 10 0 000-20Zm0 15a1.25 1.25 0 110 2.5A1.25 1.25 0 01112 17Zm1.2-8.9c1.3.5 2.1 1.6 2.1 2.9 0 1.8-1.4 2.9-2.2 3.4-.4.3-.6.6-.6 1v.2h-1.8v-.3c0-1 .5-1.8 1.4-2.4.8-.5 1.5-1.1 1.5-1.9 0-.6-.4-1.1-1-1.3-.9-.3-1.9.2-2.2 1.1l-1.7-.6c.5-1.6 2.4-2.6 4.5-2.1Z"
                                fill="currentColor"
                            />
                        </svg>
                    </button>

                    {/* Lock/Unlock */}
                    <button
                        type="button"
                        className="px-1.5 py-1 rounded-md text-neutral-300/80 hover:text-white hover:bg-neutral-800/70 transition"
                        onClick={onToggleLock}
                        title={isLocked ? "Lås op" : "Lås widget"}
                        aria-label={isLocked ? "Lås op" : "Lås widget"}
                    >
                        {isLocked ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-90">
                                <path d="M17 9h-1V7a4 4 0 10-8 0v2H7a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2Zm-7 0V7a2 2 0 114 0v2h-4Z" fill="currentColor"/>
                            </svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-90">
                                <path d="M17 9h-1.1A4 4 0 009 7v-.1h2A2 2 0 0113 9h4a2 2 0 012 2v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7a2 2 0 012-2h1" fill="currentColor"/>
                            </svg>
                        )}
                    </button>

                    {/* Remove */}
                    <button
                        type="button"
                        className="px-1.5 py-1 rounded-md text-neutral-300/80 hover:text-white hover:bg-red-600/20 hover:border-red-600/40 transition"
                        onClick={onRemove}
                        title="Fjern widget"
                        aria-label="Fjern widget"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-90">
                            <path d="M9 3h6l.7 2H21v2h-2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7H3V5h5.3L9 3Zm0 4H7v12h10V7h-2H9Zm2 2h2v8h-2V9Z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="tt-widget-body p-3">
                {children ?? (
                    <div className="text-sm text-neutral-300">
                        (Tom widget – indhold kommer senere)
                    </div>
                )}
            </div>
        </div>
    );
}
