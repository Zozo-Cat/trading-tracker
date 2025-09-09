"use client";

import { useState } from "react";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";

export default function Providers({ children }: { children: React.ReactNode }) {
    const [supabase] = useState(() => createBrowserSupabaseClient());
    return <SessionContextProvider supabaseClient={supabase}>{children}</SessionContextProvider>;
}
