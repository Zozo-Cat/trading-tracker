// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
    // Skal bruges af Supabase til at kunne skrive/fornye session-cookies
    const res = NextResponse.next();

    const supabase = createMiddlewareClient({ req, res });
    const {
        data: { session },
    } = await supabase.auth.getSession();

    const { pathname } = req.nextUrl;

    // /login → allerede logget ind? Send til /dashboard
    if (pathname === "/login" && session) {
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard";
        // vigtig: medtag res.headers så Set-Cookie fra Supabase ikke smides væk
        return NextResponse.redirect(url, { headers: res.headers });
    }

    // root → vælg login/dashboard afhængigt af session
    if (pathname === "/") {
        const url = req.nextUrl.clone();
        url.pathname = session ? "/dashboard" : "/login";
        return NextResponse.redirect(url, { headers: res.headers });
    }

    // beskyt /dashboard/*
    if (pathname.startsWith("/dashboard") && !session) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("callbackUrl", req.nextUrl.href);
        return NextResponse.redirect(loginUrl, { headers: res.headers });
    }

    // default — lad requesten fortsætte
    return res;
}

export const config = {
    matcher: ["/", "/login", "/dashboard/:path*"],
};
