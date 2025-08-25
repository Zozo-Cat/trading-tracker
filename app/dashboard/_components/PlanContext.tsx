"use client";
import { createContext, useContext } from "react";

export type Plan = "free" | "premium" | "pro";
const ORDER: Plan[] = ["free", "premium", "pro"];

export function hasAccess(userPlan: Plan, required: Plan) {
    return ORDER.indexOf(userPlan) >= ORDER.indexOf(required);
}

const PlanCtx = createContext<Plan>("free");
export const usePlan = () => useContext(PlanCtx);

export function PlanProvider({ plan, children }: { plan: Plan; children: React.ReactNode }) {
    return <PlanCtx.Provider value={plan}>{children}</PlanCtx.Provider>;
}
