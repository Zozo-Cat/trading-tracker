'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Member = {
    team_id: string;
    profile_id: string;
    role: string;
    joined_at: string | null;
    name: string | null;
    avatar_url: string | null;
    plan: string | null;
};

export default function TeamPage({ params }: { params: { id: string } }) {
    const teamId = params.id;
    const router = useRouter();

    // DEV: brug din egen profil-UUID indtil login er på plads
    const DEV_PROFILE_ID = '31abe9ad-e1c5-4e72-8f9c-0e551b6adc75';

    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isManager, setIsManager] = useState(false);

    async function load() {
        setLoading(true);
        setMsg(null);
        setError(null);
        try {
            const res = await fetch(`/api/teams/${teamId}/members`, { cache: 'no-store' });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error ?? 'Ukendt fejl');
            setMembers(Array.isArray(json.members) ? json.members : []);
        } catch (e: any) {
            setError(e?.message ?? 'Ukendt fejl');
        } finally {
            setLoading(false);
        }
    }

    async function leaveTeam() {
        setLoading(true);
        setMsg(null);
        setError(null);
        try {
            const res = await fetch('/api/teams/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, profileId: DEV_PROFILE_ID }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error ?? 'Ukendt fejl');

            setMsg('Forlod teamet. Sender dig til Join…');
            router.push('/join');
            return;
        } catch (e: any) {
            setError(e?.message ?? 'Ukendt fejl');
        } finally {
            setLoading(false);
        }
    }

    async function copyJoinLink() {
        setMsg(null);
        setError(null);
        try {
            const res = await fetch(`/api/teams/${teamId}/join-link`, { cache: 'no-store' });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error ?? 'Ukendt fejl');
            await navigator.clipboard.writeText(json.link);
            setMsg('Join link kopieret til udklipsholder.');
        } catch (e: any) {
            setError(e?.message ?? 'Ukendt fejl');
        }
    }

    useEffect(() => { load(); }, [teamId]);

    // Tjek rolle (team_lead/community_lead) → viser Copy-knap kun for ledere
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(
                    `/api/teams/${teamId}/my-role?profileId=${DEV_PROFILE_ID}`,
                    { cache: 'no-store' }
                );
                const json = await res.json();
                setIsManager(!!json?.is_manager);
            } catch {
                // ignore
            }
        })();
    }, [teamId]);

    return (
        <main style={{ maxWidth: 720, margin: '40px auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>Team</h1>
            <div style={{ opacity: 0.8, marginBottom: 16 }}><b>ID:</b> {teamId}</div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button onClick={load} disabled={loading} style={{ padding: '8px 12px' }}>
                    {loading ? 'Henter…' : 'Reload'}
                </button>
                <button onClick={leaveTeam} disabled={loading} style={{ padding: '8px 12px', background: '#fee', border: '1px solid #f99' }}>
                    {loading ? 'Arbejder…' : 'Leave team'}
                </button>
                {isManager && (
                    <button onClick={copyJoinLink} disabled={loading} style={{ padding: '8px 12px' }}>
                        Copy join link
                    </button>
                )}
            </div>

            {msg && <div style={{ padding: 10, background: '#e9f9ee', color: '#0b6b2f', borderRadius: 8, marginBottom: 12 }}>{msg}</div>}
            {error && <div style={{ padding: 10, background: '#ffeaea', color: '#8a1010', borderRadius: 8, marginBottom: 12 }}>{error}</div>}

            <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#fafafa' }}>
                    <tr>
                        <th style={{ textAlign: 'left', padding: 8 }}>Profile</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Role</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Plan</th>
                        <th style={{ textAlign: 'left', padding: 8 }}>Joined</th>
                    </tr>
                    </thead>
                    <tbody>
                    {members.map((m) => (
                        <tr key={m.profile_id}>
                            <td style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                {m.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={m.avatar_url} alt="" width={28} height={28} style={{ borderRadius: '50%' }} />
                                ) : (
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eee' }} />
                                )}
                                <span>{m.name ?? m.profile_id.slice(0, 8)}</span>
                            </td>
                            <td style={{ padding: 8 }}>{m.role}</td>
                            <td style={{ padding: 8 }}>{m.plan ?? '-'}</td>
                            <td style={{ padding: 8 }}>{m.joined_at ? new Date(m.joined_at).toLocaleString() : '-'}</td>
                        </tr>
                    ))}
                    {members.length === 0 && (
                        <tr><td colSpan={4} style={{ padding: 12 }}>Ingen medlemmer.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
