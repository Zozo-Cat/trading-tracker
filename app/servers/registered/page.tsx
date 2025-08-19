// app/servers/registered/page.tsx — liste over dine gemte servere (fra DB)
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/db";
import Link from "next/link";
import CopyButton from "../CopyButton";

export default async function RegisteredServersPage() {
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).discordUserId) {
        return (
            <main style={{ color: "#D4AF37", background: "#211d1d", minHeight: "100vh", display: "grid", placeItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <h1>Gemte servere</h1>
                    <p>Du skal være logget ind for at se denne side.</p>
                    <Link href="/" style={{ color: "#D4AF37", textDecoration: "underline" }}>Til forsiden</Link>
                </div>
            </main>
        );
    }

    const discordUserId = (session as any).discordUserId as string;

    const servers = await prisma.server.findMany({
        where: {
            OR: [
                { ownerDiscordId: discordUserId },
                { memberships: { some: { userDiscordId: discordUserId } } }
            ]
        },
        select: {
            name: true,
            serverId: true,
            joinCode: true,
            discordGuildId: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" }
    });

    return (
        <main style={{ color: "#D4AF37", background: "#211d1d", minHeight: "100vh", padding: 24 }}>
            <h1 style={{ marginBottom: 12 }}>Dine gemte servere</h1>

            {!servers.length ? (
                <p>Du har endnu ikke tilknyttet nogen servere. Gå til <Link href="/servers" style={{ color: "#D4AF37", textDecoration: "underline" }}>/servers</Link> for at tilknytte.</p>
            ) : (
                <ul style={{ display: "grid", gap: 12, listStyle: "none", padding: 0 }}>
                    {servers.map((s) => (
                        <li key={s.serverId} style={{ border: "1px solid #D4AF37", borderRadius: 8, padding: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                                    <div style={{ fontSize: 12, opacity: 0.9 }}>SERVER_ID: {s.serverId}</div>
                                    <div style={{ fontSize: 12, opacity: 0.9 }}>Kode: {s.joinCode}</div>
                                    {s.discordGuildId && (
                                        <div style={{ fontSize: 12, opacity: 0.9 }}>Discord Guild: {s.discordGuildId}</div>
                                    )}
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <CopyButton label="Kopier SERVER_ID" value={s.serverId} />
                                    <CopyButton label="Kopier Kode" value={s.joinCode} />
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <div style={{ marginTop: 16 }}>
                <Link href="/servers" style={{ color: "#D4AF37", textDecoration: "underline" }}>Til /servers</Link>
            </div>
        </main>
    );
}
