# Trading Tracker — PROJECT_MAP.md

> **Formål:** Hurtigt overblik til dig (og nye chats/medhjælpere) over hvor ting bor, hvordan auth/Discord-data hentes, og hvad der er klar til test vs. TODO. Brug dette dokument når du åbner en ny chat: copy/paste hele filen først.

---

## 0) Struktur (vigtigste mapper)

app/
_components/
CommunityPicker.tsx
Header.tsx ← NextAuth-baseret header (ikke dummy)
MentorOverview.tsx
QuickMessage.tsx
SendTrade.tsx
dashboard/page.tsx ← Klar (NextAuth)
dev/login/page.tsx ← Klar (NextAuth, viser session JSON)
mentees/page.tsx ← Klar (NextAuth) + DUMMY fallback
signals/page.tsx ← Klar (NextAuth) + admin gate
config/… ← (tjek efter dummy, se To-Do)

lib/
auth.ts ← NextAuth konfiguration + admin-rolle
discord.ts ← (fælles datalag til Discord – planlagt/under indførsel)
supabaseClient.ts ← Supabase client
supabaseAdmin.ts ← (server-side hvis brugt)
configStore.ts ← Lokal state (hvis i brug)
dummyAuth.tsx ← (midlertidig shim – bør fjernes, se To-Do)

public/images/
trading.png ← Logo i Header

app/api/
discord/
guilds/route.ts
bot-memberships/route.ts
channels/route.ts
roles/route.ts
test-send/route.ts
mentees/route.ts ← (foreslået endpoint til rigtige mentees — TODO når klar)

markdown
Kopiér
Rediger

---

## 1) Auth (NextAuth + Discord)

- **Fil:** `lib/auth.ts`
- **Nøglepunkter:**
    - Gemmer `discordAccessToken`, `discordUserId`, `discordId` (snowflake) i token/session.
    - Admin-allowlist via ENV → `session.user.role = "admin"` + sætter `isTeamLead`, `isCommunityLead`, `isPro` = `true` for admin.
- **ENV (lokalt & prod):**
  ```env
  DISCORD_CLIENT_ID=...
  DISCORD_CLIENT_SECRET=...
  ADMIN_DISCORD_IDS=701105379311878174     # din snowflake (komma-separeret liste)
  ADMIN_EMAILS=serenitygamingsrg@gmail.com # valgfrit fallback (komma-separeret)
  NEXTAUTH_URL=http://localhost:3000       # Vercel sætter selv i prod
  NEXTAUTH_SECRET=...                      # kør: openssl rand -base64 32
Provider-lag: app/_components/Providers.tsx bruger kun SessionProvider.

Test: /dev/login skal vise user.role = "admin" og flags isTeamLead/isCommunityLead/isPro = true for dig.

2) Header og globale krav
   Fil: app/_components/Header.tsx (layout bevaret; auth via useSession).

Billeder: Discord-avatar loader via <img> for at undgå Next/Image-domænekrav.

(Anbefalet) Tilføj senere i next.config.js:

js
Kopiér
Rediger
module.exports = {
images: { domains: ["cdn.discordapp.com", "media.discordapp.net"] },
};
3) Sider
   Dashboard: app/dashboard/page.tsx ✅

Mentees: app/mentees/page.tsx (dummy fallback, Supabase senere) ✅

Signals (admin): app/signals/page.tsx ✅

Dev / Login: app/dev/login/page.tsx ✅

Config/Teams: mangler oprydning i dummy-auth ❌

4) Discord data — fælles datalag (mål)
   Fil: lib/discord.ts

Funktioner: getUserGuilds, getBotMemberships, getGuildChannels, getGuildRoles, filterInstalled.

5) API-routes
   Placering: app/api/discord/*

Channels, roles, guilds, bot-memberships, test-send.

Ekstra endpoint: app/api/mentees/route.ts (TODO til Supabase).

6) Deploy til Vercel
   Push til GitHub.

Importér repo i Vercel.

Opsæt ENV i Vercel.

Test /dev/login, /dashboard, /mentees, /signals.

7) Kendte TODOs
   Fjerne dummyAuth.tsx.

Implementere api/mentees til Supabase.

Oprydning i config-sektioner.

8) Noter
   Dummy-data bevidst bevaret for pæn demo.

Admin får altid fulde flags.

Start ny chat med at copy/paste denne fil.

yaml
Kopiér
Rediger

---

### 📁 Fil 2 — **`RECOVERY_NOTES.md`**
**Sti:**  