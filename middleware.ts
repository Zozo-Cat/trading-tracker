// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name) {
                    return req.cookies.get(name)?.value;
                },
                set(name, value, options) {
                    res.cookies.set({ name, value, ...options });
                },
                remove(name, options) {
                    res.cookies.set({ name, value: "", ...options });
                },
            },
        }
    );

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const url = req.nextUrl;
    const { pathname } = url;

    // Public pages (synlige uden login)
    const publicPaths = new Set<string>([
        "/",               // forside skal være synlig uden login
        "/nyheder",
        "/partnere",
        "/planer",
        "/saadan-virker-det",
        "/signup",
        "/auth/callback",  // OAuth landingsside
        "/age-check",
    ]);

    // Hvis allerede logget ind og man går til "/" eller "/login" → send til /dashboard
    if ((pathname === "/" || pathname === "/login") && session) {
        const target = url.clone();
        target.pathname = "/dashboard";
        target.search = "";
        return NextResponse.redirect(target);
    }

    // Beskyt /dashboard/*
    if (pathname.startsWith("/dashboard")) {
        if (!session) {
            const loginUrl = url.clone();
            loginUrl.pathname = "/login";
            loginUrl.searchParams.set("callbackUrl", url.href);
            return NextResponse.redirect(loginUrl);
        }
        return res; // har session → adgang
    }

    // Offentlige ruter: altid tilladt
    if (publicPaths.has(pathname)) {
        return res;
    }

    // Alle andre ruter: bare kør videre (ingen tvangs-redirects)
    return res;
}

export const config = {
    matcher: ["/", "/login", "/dashboard/:path*", "/auth/callback", "/age-check", "/(nyheder|partnere|planer|saadan-virker-det|signup)"],
};
