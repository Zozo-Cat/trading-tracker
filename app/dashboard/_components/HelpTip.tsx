"use client";

import { useId } from "react";

type Props = {
    text: string;
    className?: string;
};

export default function HelpTip({ text, className = "" }: Props) {
    const id = useId();
    return (
        <span className={`relative inline-flex items-center group ${className}`}>
      {/* “?” knop */}
            <button
                type="button"
                aria-describedby={id}
                className="w-5 h-5 inline-flex items-center justify-center rounded-full border text-xs
                   border-neutral-500 text-neutral-400 hover:text-neutral-200 hover:border-neutral-400
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400"
            >
        ?
      </button>

            {/* Tooltip */}
            <span
                id={id}
                role="tooltip"
                className="pointer-events-none absolute -top-2 left-6 z-20 hidden min-w-[200px]
                   rounded-md border border-neutral-700 bg-neutral-900 text-neutral-100 text-xs
                   px-3 py-2 shadow-lg group-hover:block group-focus-within:block"
            >
        {text}
      </span>
    </span>
    );
}
