// lib/dummyData.ts
export type Plan = "free" | "premium" | "pro";
export type Role = "member" | "admin";

export type DummyUser = {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    plan: Plan;        // free | premium | pro
    role: Role;        // admin = global admin (til test)
};

export const dummyUsers: DummyUser[] = [
    {
        id: "u_pro",
        name: "Pro Bruger",
        email: "pro@demo.local",
        avatar_url: "/images/default-avatar.png",
        plan: "pro",
        role: "member",
    },
    {
        id: "u_premium",
        name: "Premium Bruger",
        email: "premium@demo.local",
        avatar_url: "/images/default-avatar.png",
        plan: "premium",
        role: "member",
    },
    {
        id: "u_free",
        name: "Gratis Bruger",
        email: "gratis@demo.local",
        avatar_url: "/images/default-avatar.png",
        plan: "free",
        role: "member",
    },
    {
        id: "u_admin",
        name: "Admin Bruger",
        email: "admin@demo.local",
        avatar_url: "/images/default-avatar.png",
        plan: "pro",    // admin har også pro i testen, hvis du vil
        role: "admin",
    },
];

export function isPaid(plan: Plan) {
    return plan === "premium" || plan === "pro";
}
