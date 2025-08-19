// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    const body = (await req.json().catch(() => null)) as
        | { email?: string; password?: string; name?: string }
        | null;

    const email = body?.email?.toLowerCase().trim();
    const password = body?.password?.trim();
    const name = (body?.name ?? "").trim();

    if (!email || !password) {
        return NextResponse.json({ ok: false, error: "Email og kodeord er påkrævet" }, { status: 400 });
    }

    // findes allerede?
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return NextResponse.json({ ok: false, error: "Email er allerede i brug" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
        data: {
            email,
            name: name || null,
            passwordHash,
        },
        select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ ok: true, user });
}

// Valgfri GET for at se at ruten findes
export async function GET() {
    return NextResponse.json({ ok: true, route: "/api/auth/signup" });
}
