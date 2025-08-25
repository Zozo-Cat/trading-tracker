"use client";
import React from "react";

const GOLD = "#D4AF37";

export default function DashboardCard({
                                          title,
                                          subtitle,
                                          right,
                                          children,
                                          className,
                                          style,
                                      }: {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    right?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <div
            className={`
        rounded-2xl p-3 md:p-4
        bg-[#1a1717]
        border
        ${className || ""}
      `}
            style={{ borderColor: GOLD, ...style }}
        >
            {/* header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                    <div className="text-white text-sm md:text-base font-semibold leading-tight">{title}</div>
                    {subtitle ? (
                        <div className="text-[11px] md:text-[12px] text-neutral-400 mt-0.5">{subtitle}</div>
                    ) : null}
                </div>
                {right ? (
                    <div className="shrink-0 pt-0.5 text-right">{right}</div>
                ) : null}
            </div>

            {/* body – ingen indre scroll */}
            <div className="text-white">{children}</div>
        </div>
    );
}
