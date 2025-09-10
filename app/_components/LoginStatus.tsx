"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, useSupabaseClient } from "@/app/_components/Providers";

export default function LoginStatus() {
    const router = useRouter();
    const session = useSession();
    const supabase = useSupabaseClient();

    const [status, setStatus] = useState("Checker login...");

    useEffect(() => {
        if (session) {
            setStatus(`Logget ind som ${session.user.email}`);
        } else {
            setStatus("Ikke logget ind");
        }
    }, [session]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <div className="p-2 text-sm text-gray-300">
            {status}
            {session && (
                <button
                    onClick={handleLogout}
                    className="ml-2 px-2 py-1 rounded bg-red-600 text-white"
                >
                    Log ud
                </button>
            )}
        </div>
    );
}
