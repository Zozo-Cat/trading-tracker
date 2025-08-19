'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

/* Supabase (browser) */
function createSb() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
    if (!url || !key) return null;
    try { return createClient(url, key); } catch { return null; }
}
const sb = createSb();

/* Theme */
const gold = '#D4AF37';
const gold2 = '#E9CC6A';
const dark = '#1a1717';

/* Helpers */
function isExpired(iso: string | null) {
    if (!iso) return false;
    return new Date(iso).getTime() < Date.now();
}

// ⬇️ Var: `export default function JoinPage()`
// ⬆️ Nu: gør den ikke-default og kald den JoinPageInner
function JoinPageInner() {
    const sp = useSearchParams();
    const devProfileId = (process.env.NEXT_PUBLIC_DEV_PROFILE_ID as string) || 'demo-user';

    const [tab, setTab] = React.useState<'invite' | 'team'>('invite');

    // ===== Invite-kode flow =====
    const [inviteCode, setInviteCode] = React.useState(sp.get('code') || '');
    const [invite, setInvite] = React.useState<any | null>(null);
    const [inviteLoading, setInviteLoading] = React.useState(false);
    const [toast, setToast] = React.useState<{ kind: 'success' | 'warn' | 'error'; msg: string } | null>(null);
    const showToast = (kind: 'success' | 'warn' | 'error', msg: string) => { setToast({ kind, msg }); window.setTimeout(()=>setToast(null), 2200); };

    async function findInvite() {
        if (!sb) return showToast('error','Supabase ikke sat op');
        if (!inviteCode.trim()) return showToast('warn','Skriv en invite-kode');
        setInviteLoading(true);
        const { data, error } = await sb.from('invites').select('*').eq('code', inviteCode.trim()).maybeSingle();
        setInviteLoading(false);
        if (error) { setInvite(null); return showToast('error', error.message); }
        if (!data) { setInvite(null); return showToast('warn','Ingen invite fundet'); }
        setInvite(data);
    }

    async function acceptInvite() {
        if (!sb || !invite) return;
        if (isExpired(invite.expires_at)) return showToast('warn','Invite er udløbet');
        if (invite.max_uses != null && invite.uses >= invite.max_uses) return showToast('warn','Invite er opbrugt');

        try {
            if (invite.team_id) {
                const { error: mErr } = await sb.from('team_members').insert({ team_id: invite.team_id, profile_id: devProfileId } as any);
                if (mErr) throw mErr;
            }
            const { error: uErr } = await sb.from('invites').update({ uses: (invite.uses || 0) + 1 }).eq('id', invite.id);
            if (uErr) throw uErr;

            showToast('success','Du er nu tilmeldt!');
            await findInvite(); // refresh state
        } catch (e: any) {
            showToast('error', e?.message || 'Kunne ikke tilmelde');
        }
    }

    // ===== Team ID + kode (dit eksisterende flow via API) =====
    const [teamId, setTeamId] = React.useState(sp.get('team') || '');
    const [teamJoinCode, setTeamJoinCode] = React.useState('');
    const [joining, setJoining] = React.useState(false);
    const [result, setResult] = React.useState<{ ok?: boolean; message?: string; team_id?: string; error?: string } | null>(null);

    async function submitTeamJoin(e: React.FormEvent) {
        e.preventDefault();
        setJoining(true);
        setResult(null);
        try {
            const res = await fetch('/api/teams/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, code: teamJoinCode, profileId: devProfileId }),
            });
            const json = await res.json();
            if (!res.ok) {
                setResult({ ok: false, error: json?.error ?? 'Ukendt fejl' });
                showToast('error', json?.error ?? 'Ukendt fejl');
            } else {
                setResult({ ok: true, message: json?.message, team_id: json?.team_id });
                showToast('success', json?.message ?? 'Joined');
            }
        } catch (e: any) {
            setResult({ ok: false, error: e?.message ?? 'Ukendt fejl' });
            showToast('error', e?.message ?? 'Ukendt fejl');
        } finally {
            setJoining(false);
        }
    }

    return (
        <main className="mx-auto max-w-xl p-6 space-y-6">
            <h1 className="text-2xl font-semibold" style={{ color: gold2 }}>Join</h1>

            {/* Tabs */}
            <div className="flex items-center gap-2">
                <button onClick={()=>setTab('invite')} className={`px-3 py-1.5 rounded-lg text-sm ${tab==='invite'?'border':''}`}
                        style={tab==='invite'?{border:`1px solid ${gold}`, color:'#211d1d', background:'#fffacd'}:{color:gold}}>
                    Invite-kode
                </button>
                <button onClick={()=>setTab('team')} className={`px-3 py-1.5 rounded-lg text-sm ${tab==='team'?'border':''}`}
                        style={tab==='team'?{border:`1px solid ${gold}`, color:'#211d1d', background:'#fffacd'}:{color:gold}}>
                    Team ID + kode
                </button>
            </div>

            {/* Panel: Invite-kode */}
            {tab==='invite' && (
                <section className="rounded-2xl p-4 space-y-3" style={{ border:`1px solid ${gold}`, background: dark }}>
                    <label className="block text-sm" style={{ color: gold2 }}>Invite-kode</label>
                    <div className="flex gap-2">
                        <input
                            value={inviteCode}
                            onChange={(e)=>setInviteCode(e.target.value)}
                            placeholder="INV-XXXXXX"
                            className="flex-1 rounded-lg px-3 py-2"
                            style={{ border:`1px solid ${gold}`, background: dark, color: gold }}
                        />
                        <button onClick={findInvite} disabled={inviteLoading}
                                className="rounded-lg px-3 py-2 text-sm"
                                style={{ border:`1px solid ${gold}`, color:gold }}>
                            {inviteLoading ? 'Søger…' : 'Slå op'}
                        </button>
                    </div>

                    {invite && (
                        <div className="mt-2 space-y-1 text-sm" style={{ color: gold }}>
                            <div>Kode: <code className="px-2 py-0.5 rounded-md" style={{ border:`1px solid ${gold}`, color:gold }}>{invite.code}</code></div>
                            <div>Type: {invite.team_id ? 'Team invite' : 'Community invite'}</div>
                            <div>Gyldig til: {invite.expires_at ? new Date(invite.expires_at).toLocaleString() : 'aldrig'}</div>
                            <div>Brug: {invite.max_uses == null ? '∞' : `${invite.uses || 0}/${invite.max_uses}`}</div>
                            <button onClick={acceptInvite}
                                    className="mt-2 rounded-lg px-3 py-2 text-sm"
                                    style={{ border:`1px solid ${gold}`, color:gold }}>
                                Tilføj mig
                            </button>
                        </div>
                    )}
                </section>
            )}

            {/* Panel: Team ID + kode */}
            {tab==='team' && (
                <section className="rounded-2xl p-4 space-y-3" style={{ border:`1px solid ${gold}`, background: dark }}>
                    <form onSubmit={submitTeamJoin} className="space-y-3">
                        <label className="block text-sm" style={{ color: gold2 }}>
                            Team ID
                            <input
                                value={teamId}
                                onChange={(e)=>setTeamId(e.target.value)}
                                placeholder="fx 07399fc8-7173-4e86-8155-b9be0c9d9e42"
                                required
                                className="mt-1 w-full rounded-lg px-3 py-2"
                                style={{ border:`1px solid ${gold}`, background: dark, color: gold }}
                            />
                        </label>

                        <label className="block text-sm" style={{ color: gold2 }}>
                            Join kode
                            <input
                                value={teamJoinCode}
                                onChange={(e)=>setTeamJoinCode(e.target.value)}
                                placeholder="fx TEST-TEAM-1"
                                required
                                className="mt-1 w-full rounded-lg px-3 py-2"
                                style={{ border:`1px solid ${gold}`, background: dark, color: gold }}
                            />
                        </label>

                        <button type="submit" disabled={joining || !teamId || !teamJoinCode}
                                className="rounded-lg px-3 py-2 text-sm"
                                style={{ border:`1px solid ${gold}`, color:gold }}>
                            {joining ? 'Arbejder…' : 'Join'}
                        </button>
                    </form>

                    {result && (
                        <div className="mt-2 rounded-lg px-3 py-2 text-sm"
                             style={{ background: result.ok ? '#2e4' : '#e66', color:'#211d1d' }}>
                            {result.ok ? (
                                <>
                                    <div><b>OK:</b> {result.message ?? 'joined'}</div>
                                    <div><b>Team ID:</b> {result.team_id}</div>
                                </>
                            ) : (
                                <div><b>Fejl:</b> {result.error}</div>
                            )}
                        </div>
                    )}
                </section>
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed left-1/2 -translate-x-1/2 bottom-6 px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
                     style={{ backgroundColor: toast.kind==='success' ? '#76ed77' : toast.kind==='warn' ? '#ffb84d' : '#ff7676', color:'#211d1d' }}>
                    {toast.msg}
                </div>
            )}
        </main>
    );
}

// ⬇️ Ny default export: wrapper i Suspense
export default function Page() {
    return (
        <Suspense fallback={null}>
            <JoinPageInner />
        </Suspense>
    );
}
