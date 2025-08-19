'use client';

import { useEffect, useState } from 'react';

type Member = {
    team_id: string;
    profile_id: string;
    role: string;
    joined_at: string | null;
    name: string | null;
    avatar_url: string | null;
    plan: string | null;
};

export default function TeamTestPage() {
    // DEV: brug dine egne værdier (fra tidligere svar)
    const TEAM_ID = '07399fc8-7173-4e86-8155-b9be0c9d9e42';
    const DEV_PROFILE_ID = '31abe9ad-e1c5-4e72-8f9c-0e551b6adc75';

    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState('TEST-TEAM-1');
    const [message, setMessage] = useState<string | null>(null);

    async function loadMembers() {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch(`/api/teams/${TEAM_ID}/members`, { cache: 'no-store' });
            const json = await res.json();
            setMembers(Array.isArray(json.members) ? json.members : []);
        } catch (e: any) {
            setMessage(`Fejl ved hentning: ${e?.message ?? 'ukendt'}`);
        } finally {
            setLoading(false);
        }
    }

    async function joinTeam() {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch('/api/teams/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // DEV: sender profileId eksplicit (hvis du ikke er logget ind endnu)
                body: JSON.stringify({ code, profileId: DEV_PROFILE_ID }),
            });
            const json = await res.json();
            if (!res.ok) {
                setMessage(json?.error ?? 'Fejl');
            } else {
                setMessage(`OK: ${json.message ?? 'joined'}`);
                await loadMembers();
            }
        } catch (e: any) {
            setMessage(`Fejl ved join: ${e?.message ?? 'ukendt'}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadMembers();
    }, []);

    return (
        <main style={{ maxWidth: 720, margin: '40px auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <h1 style={{ fontSize: 28, marginBottom: 12 }}>Team test</h1>
            <div style={{ marginBottom: 16, opacity: 0.8 }}>
                <div><b>TEAM_ID:</b> {TEAM_ID}</div>
                <div><b>DEV_PROFILE_ID:</b> {DEV_PROFILE_ID}</div>
            </div>

            <section style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
                <label>
                    Join code:
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        style={{ marginLeft: 8, padding: '6px 8px', width: 200 }}
                    />
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={joinTeam} disabled={loading} style={{ padding: '8px 12px' }}>
                        {loading ? 'Arbejder…' : 'Join team'}
                    </button>
                    <button onClick={loadMembers} disabled={loading} style={{ padding: '8px 12px' }}>
                        Reload members
                    </button>
                </div>
                {message && <div style={{ color: message.startsWith('OK') ? 'green' : 'crimson' }}>{message}</div>}
            </section>

            <h2 style={{ fontSize: 20, margin: '16px 0' }}>Medlemmer</h2>
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
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: '#eee', display: 'inline-block'
                                    }} />
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
