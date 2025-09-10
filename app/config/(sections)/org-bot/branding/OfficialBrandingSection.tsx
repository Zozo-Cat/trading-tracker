// app/config/(sections)/org-bot/branding/OfficialBrandingSection.tsx
"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";

function sb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

type OfficialMeta = {
    community_id: string;
    community_name: string | null;
    slug: string | null;
    is_official: boolean;
    support_url: string | null;
    short_bio: string | null;
    promote_on_homepage: boolean | null;
    partner_since: string | null;
    partner_logo_url: string | null;
    assets_manifest: any | null;
    embed_snippet: string | null;
    homepage_sort: number | null;
    active_discount_code: string | null;
    active_discount_desc: string | null;
    active_discount_percent: number | null;
    active_discount_valid_to: string | null;
};

function Info({ children }: { children: React.ReactNode }) {
    return <span className="opacity-70">{children}</span>;
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block text-sm mb-3" style={{ color: "var(--tt-accent)" }}>
            <div className="mb-1">{label}</div>
            {children}
        </label>
    );
}
function SectionBox({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section
            className="rounded-2xl p-6 mb-6"
            style={{ backgroundColor: "#1a1717", border: "1px solid var(--tt-accent)" }}
        >
            <h3 className="text-base font-semibold mb-3" style={{ color: "#E9CC6A" }}>
                {title}
            </h3>
            {children}
        </section>
    );
}

/** Wrapper med Suspense (ændrer ikke layout eller styling) */
export default function OfficialBrandingSection(props: { communityId?: string }) {
    return (
        <Suspense
            fallback={
                <SectionBox title="Official community branding">
                    <div style={{ color: "var(--tt-accent)" }}>Henter…</div>
                </SectionBox>
            }
        >
            <OfficialBrandingSectionInner {...props} />
        </Suspense>
    );
}

/** Al din eksisterende logik/funktionalitet bor her (uændret) */
function OfficialBrandingSectionInner({
                                          communityId: propCommunityId,
                                      }: {
    /** valgfri – hvis ikke sat, læser vi ?communityId= fra URL */
    communityId?: string;
}) {
    const search = useSearchParams();

    const [toast, setToast] = useState<{ kind: "success" | "error"; msg: string } | null>(null);
    const showToast = (kind: "success" | "error", msg: string) => {
        setToast({ kind, msg });
        window.clearTimeout((showToast as any)._t);
        (showToast as any)._t = window.setTimeout(() => setToast(null), 2600);
    };

    // communityId fra prop → ellers URL (?communityId=…)
    const qsCommunityId = useMemo(() => {
        if (propCommunityId) return propCommunityId;
        return search.get("communityId") || "";
    }, [propCommunityId, search]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [meta, setMeta] = useState<OfficialMeta | null>(null);

    // lokalt edit-state
    const [slug, setSlug] = useState("");
    const [supportUrl, setSupportUrl] = useState("");
    const [shortBio, setShortBio] = useState("");
    const [promote, setPromote] = useState(false);
    const [partnerLogoUrl, setPartnerLogoUrl] = useState("");

    // slug check
    const [slugStatus, setSlugStatus] =
        useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle");
    const slugDebounce = useRef<number | null>(null);

    // Reset state når community skifter
    useEffect(() => {
        setMeta(null);
        setSlug("");
        setSupportUrl("");
        setShortBio("");
        setPromote(false);
        setPartnerLogoUrl("");
        setSlugStatus("idle");
    }, [qsCommunityId]);

    // 🚀 Hvis der ikke er valgt community → tom state + CTA til “Opret”
    if (!qsCommunityId) {
        return (
            <SectionBox title="Official community branding">
                <div className="text-sm mb-4" style={{ color: "var(--tt-accent)" }}>
                    Du har endnu ikke oprettet et community eller team.
                </div>
                <a
                    href="/config/org-bot/create"
                    className="inline-block rounded-lg px-4 py-2 text-sm font-medium"
                    style={{ backgroundColor: "#76ed77", color: "#211d1d" }}
                >
                    🚀 Opret dit første community
                </a>
            </SectionBox>
        );
    }

    // Hent official meta (view) + communities.is_official
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);

                // 1) Hent is_official + (eksisterende) slug fra communities
                const { data: comm, error: commErr } = await sb()
                    .from("communities")
                    .select("id,name,is_official,slug")
                    .eq("id", qsCommunityId)
                    .single();
                if (commErr) throw commErr;

                if (!comm?.is_official) {
                    // Ikke official → vis besked og stop
                    setMeta({
                        community_id: comm.id,
                        community_name: comm.name,
                        slug: comm.slug,
                        is_official: false,
                        support_url: null,
                        short_bio: null,
                        promote_on_homepage: null,
                        partner_since: null,
                        partner_logo_url: null,
                        assets_manifest: null,
                        embed_snippet: null,
                        homepage_sort: 0,
                        active_discount_code: null,
                        active_discount_desc: null,
                        active_discount_percent: null,
                        active_discount_valid_to: null,
                    });
                    setSlug(comm.slug || "");
                    setSupportUrl("");
                    setShortBio("");
                    setPromote(false);
                    setPartnerLogoUrl("");
                    return;
                }

                // 2) Hent samlet meta fra view (giver også aktiv rabatkode)
                const { data: viewData, error: viewErr } = await sb()
                    .from("official_meta_with_active_discount")
                    .select("*")
                    .eq("community_id", qsCommunityId)
                    .maybeSingle();
                if (viewErr) throw viewErr;

                const merged: OfficialMeta = viewData || {
                    community_id: comm.id,
                    community_name: comm.name,
                    slug: comm.slug,
                    is_official: true,
                    support_url: null,
                    short_bio: null,
                    promote_on_homepage: false,
                    partner_since: null,
                    partner_logo_url: null,
                    assets_manifest: null,
                    embed_snippet: null,
                    homepage_sort: 0,
                    active_discount_code: null,
                    active_discount_desc: null,
                    active_discount_percent: null,
                    active_discount_valid_to: null,
                };

                setMeta(merged);
                setSlug(merged.slug || "");
                setSupportUrl(merged.support_url || "");
                setShortBio(merged.short_bio || "");
                setPromote(Boolean(merged.promote_on_homepage));
                setPartnerLogoUrl(merged.partner_logo_url || "");
            } catch (e: any) {
                showToast("error", e.message || "Kunne ikke hente official-branding");
            } finally {
                setLoading(false);
            }
        })();
    }, [qsCommunityId]);

    // slug validering (debounced)
    useEffect(() => {
        if (!meta?.is_official) return; // kun officials må sætte slug
        if (!slug?.trim()) {
            setSlugStatus("idle");
            return;
        }
        // simple syntax check
        const s = slug.trim();
        const valid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && s.length >= 3 && s.length <= 40;
        if (!valid) {
            setSlugStatus("invalid");
            return;
        }
        setSlugStatus("checking");
        if (slugDebounce.current) window.clearTimeout(slugDebounce.current);
        slugDebounce.current = window.setTimeout(async () => {
            try {
                const { data, error } = await sb()
                    .from("communities")
                    .select("id")
                    .neq("id", qsCommunityId)
                    .eq("is_official", true)
                    .ilike("slug", s); // case-insensitive
                if (error) throw error;
                setSlugStatus((data || []).length === 0 ? "ok" : "taken");
            } catch {
                setSlugStatus("invalid");
            }
        }, 350) as unknown as number;
    }, [slug, meta?.is_official, qsCommunityId]);

    async function saveOfficialBranding() {
        if (!qsCommunityId) return;
        setSaving(true);
        try {
            // 1) gem slug (kun hvis official)
            if (meta?.is_official) {
                const trimmed = slug.trim() || null;
                const { error: cErr } = await sb()
                    .from("communities")
                    .update({ slug: trimmed })
                    .eq("id", qsCommunityId);
                if (cErr) throw cErr;
            }

            // 2) gem partner meta (upsert)
            const up = {
                community_id: qsCommunityId,
                support_url: supportUrl?.trim() || null,
                short_bio: shortBio?.trim() || null,
                promote_on_homepage: promote,
                partner_logo_url: partnerLogoUrl?.trim() || null,
            };
            const { error: mErr } = await sb()
                .from("official_partner_meta")
                .upsert(up, { onConflict: "community_id" });
            if (mErr) throw mErr;

            showToast("success", "Official branding gemt");
            (window as any).ttSetDirty?.(false);
        } catch (e: any) {
            showToast("error", e.message || "Kunne ikke gemme");
        } finally {
            setSaving(false);
        }
    }

    // 🔗 Registrér sektionens save-funktion til global “Gem”-knap
    useEffect(() => {
        const hook = async () => {
            await saveOfficialBranding();
        };
        (window as any).ttSaveHooks = (window as any).ttSaveHooks || [];
        (window as any).ttSaveHooks.push(hook);
        return () => {
            try {
                const arr: any[] = (window as any).ttSaveHooks || [];
                const idx = arr.indexOf(hook);
                if (idx >= 0) arr.splice(idx, 1);
            } catch {}
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [qsCommunityId, slug, supportUrl, shortBio, promote, partnerLogoUrl]);

    // simple embed baseret på slug (hvis sat)
    const generatedEmbed = useMemo(() => {
        if (!slug) return "";
        const origin =
            typeof window !== "undefined" && window.location?.origin
                ? window.location.origin
                : "";
        return `<a href="${origin}/c/${slug}" target="_blank" rel="noopener">Official Partner of Trading Tracker</a>`;
    }, [slug]);

    if (loading) {
        return (
            <SectionBox title="Official community branding">
                <div style={{ color: "var(--tt-accent)" }}>Henter…</div>
            </SectionBox>
        );
    }

    // Ikke official → info
    if (meta && !meta.is_official) {
        return (
            <SectionBox title="Official community branding">
                <div className="text-sm" style={{ color: "var(--tt-accent)" }}>
                    Dit community er endnu ikke <b>Official</b>. Når status sættes til official, får du:
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                        <li>Slug & verificeret badge</li>
                        <li>Support-link, kort bio og forside-promotion</li>
                        <li>Partner assets + embed</li>
                        <li>Medlemsrabat (vises kun hvis aktiv kode findes)</li>
                    </ul>
                </div>
            </SectionBox>
        );
    }

    // Official visning
    return (
        <>
            <SectionBox title="Official community branding">
                {/* 🔔 Medlemsrabat */}
                {meta?.active_discount_code && (
                    <div
                        className="rounded-lg p-4 mb-4"
                        style={{
                            border: "2px solid #76ed77",
                            background: "#1f2b1f",
                            color: "#76ed77",
                        }}
                    >
                        🎉 <b>Medlemsrabat!</b>
                        <br />
                        Kode: <code>{meta.active_discount_code}</code>
                        {typeof meta.active_discount_percent === "number" && <> — {meta.active_discount_percent}%</>}
                        {meta.active_discount_desc && <div className="text-sm mt-1">{meta.active_discount_desc}</div>}
                        {meta.active_discount_valid_to && (
                            <div className="text-xs mt-1 opacity-80">
                                Gyldig til: {new Date(meta.active_discount_valid_to).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                )}

                {/* SLUG */}
                <Row label="Slug">
                    <input
                        value={slug}
                        onChange={(e) => {
                            setSlug(e.target.value.toLowerCase());
                            (window as any).ttSetDirty?.(true);
                        }}
                        placeholder="fx epic-traders"
                        className="w-full rounded-lg px-3 py-2"
                        style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "#fff" }}
                    />
                    <div className="mt-1 text-xs flex items-center gap-2">
                        {slugStatus === "idle" && <Info>Min. 3 tegn, kun små bogstaver, tal og bindestreg.</Info>}
                        {slugStatus === "checking" && <Info>Tjekker tilgængelighed…</Info>}
                        {slugStatus === "ok" && <span style={{ color: "#76ed77" }}>✔ Slug er ledig</span>}
                        {slugStatus === "taken" && <span style={{ color: "#ff7676" }}>✖ Slug er optaget</span>}
                        {slugStatus === "invalid" && <span style={{ color: "#ff7676" }}>✖ Ugyldigt format</span>}
                    </div>
                </Row>

                {/* SUPPORT + BIO */}
                <Row label="Support-link">
                    <input
                        value={supportUrl}
                        onChange={(e) => {
                            setSupportUrl(e.target.value);
                            (window as any).ttSetDirty?.(true);
                        }}
                        placeholder="https://discord.gg/ditlink eller https://dinside.dk/support"
                        className="w-full rounded-lg px-3 py-2"
                        style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "#fff" }}
                    />
                </Row>

                <Row label="Kort beskrivelse (vises i showcase / discover)">
          <textarea
              value={shortBio}
              onChange={(e) => {
                  setShortBio(e.target.value);
                  (window as any).ttSetDirty?.(true);
              }}
              placeholder="Signals & mentorship for day traders…"
              className="w-full rounded-lg px-3 py-2"
              rows={3}
              style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "#fff" }}
          />
                </Row>

                {/* PROMOTION */}
                <div className="flex items-center gap-3 mb-4">
                    <input
                        id="promote_home"
                        type="checkbox"
                        checked={promote}
                        onChange={(e) => {
                            setPromote(e.target.checked);
                            (window as any).ttSetDirty?.(true);
                        }}
                    />
                    <label htmlFor="promote_home" className="text-sm" style={{ color: "var(--tt-accent)" }}>
                        Vis som officiel partner på forsiden
                    </label>
                </div>

                {/* PARTNER LOGO */}
                <Row label="Partner-logo (kvadratisk URL – valgfrit)">
                    <input
                        value={partnerLogoUrl}
                        onChange={(e) => {
                            setPartnerLogoUrl(e.target.value);
                            (window as any).ttSetDirty?.(true);
                        }}
                        placeholder="https://…/logo-square.png"
                        className="w-full rounded-lg px-3 py-2"
                        style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "#fff" }}
                    />
                    {partnerLogoUrl && (
                        <div className="mt-2">
                            <img src={partnerLogoUrl} alt="Partner logo preview" className="w-16 h-16 object-cover rounded" />
                        </div>
                    )}
                </Row>
            </SectionBox>

            {/* Assets & Embed (placeholder – download kommer senere) */}
            <SectionBox title="Official partner assets">
                <div className="text-sm mb-3" style={{ color: "var(--tt-accent)" }}>
                    Download badges og brug på din egen hjemmeside / SoMe, eller indsæt embed-snippet.
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                    <button
                        className="px-3 py-1.5 rounded-lg text-sm"
                        style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                        title="Kommer snart"
                        disabled
                    >
                        Download PNG (kommer)
                    </button>
                    <button
                        className="px-3 py-1.5 rounded-lg text-sm"
                        style={{ border: "1px solid var(--tt-accent)", color: "var(--tt-accent)" }}
                        title="Kommer snart"
                        disabled
                    >
                        Download SVG (kommer)
                    </button>
                </div>

                <Row label="Embed-snippet (copy/paste)">
          <textarea
              value={generatedEmbed}
              readOnly
              className="w-full rounded-lg px-3 py-2"
              rows={2}
              style={{ border: "1px solid var(--tt-accent)", background: "#211d1d", color: "#fff" }}
          />
                </Row>
            </SectionBox>

            {toast && (
                <div
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
                    style={{
                        backgroundColor: toast.kind === "success" ? "#76ed77" : "#ff7676",
                        color: "#211d1d",
                    }}
                >
                    {toast.msg}
                </div>
            )}
        </>
    );
}
