# Trading Tracker — PROJECT_MAP.md

> **Formål:** Hurtigt overblik til dig (og nye hjælpere) over struktur, auth, miljøvariabler, og hvad der er klar vs. TODO.  
> Brug dette dokument, når du åbner en ny chat: link/indsæt filen først.

---

## 0) Beslutninger (kort)
- **Auth:** Vi bruger **Supabase Auth** til alt (Email + Discord).
    - **NextAuth er fjernet** (ruter, config, adapters).
    - Discord OAuth er slået til i Supabase med redirect **`/auth/v1/callback`**.
- **DB:** Supabase (Postgres). Prisma bruges til vores egne tabeller (fx `Server`, `Team` …).
- **App Router:** Next.js `app/` struktur.
- **Mål:** Alle brugere (email + Discord) skal ses i **Supabase → Authentication → Users**.

---

## 1) Mappestruktur (nøglefiler)

app/
login/page.tsx ← UI bruger Supabase (Email + Discord)
dashboard/page.tsx ← kræver login (beskyttet af middleware)
servers/page.tsx ← henter Discord guilds via Discord OAuth token
servers/registered/page.tsx ← viser gemte servere (DB) pr. Discord ID
api/
discord/
channels/route.ts ← Supabase session ✅
guilds/route.ts ← Supabase session ✅
roles/route.ts ← Supabase session ✅
test-send/route.ts ← Supabase session ✅
servers/
register/route.ts ← Supabase session + Prisma ✅
teams/
route.ts ← GET/POST Supabase session + Admin client ✅
join/route.ts ← Supabase session + RPC ✅
[id]/my-role/route.ts ← Supabase session + Admin client ✅
whoami/route.ts ← Supabase session ✅

lib/
supabaseClient.ts ← public klient
supabaseAdmin.ts ← server-side (service role) klient
db.ts ← Prisma klient

middleware.ts ← Beskytter /dashboard/* → uloggede sendes til /login

markdown
Copy code

> **Slettet:**  
> `app/api/auth/[...nextauth]/route.ts`, `lib/auth.ts` (og øvrige NextAuth-imports).

---

## 2) Auth (Supabase)
- **Login-side** (`/login`):
    - Email + password: `supabase.auth.signInWithPassword()`
    - Sign up: `supabase.auth.signUp()`
    - Discord: `supabase.auth.signInWithOAuth({ provider: "discord", options: { redirectTo: <origin>/dashboard }})`
- **Session (client):** `@supabase/auth-helpers-react` → `useSession()`
- **Session (server):** `@supabase/auth-helpers-nextjs` → `createServerComponentClient({ cookies })`
- **Discord data i session:**
    - User metadata: `session.user.user_metadata`
        - `provider`: `"discord"`
        - `provider_id`: `<discord snowflake>` (bruges som `discordUserId`)
    - OAuth access token: `session.provider_token` (bruges til `/users/@me/guilds`)

**Discord scopes:** I Supabase → Auth → Providers → Discord → Scopes:  
`identify email guilds` (for at hente brugerens guilds)

---

## 3) Routing & Redirects
- **/dashboard**: beskyttes af `middleware.ts`.
    - Uden login → redirect til **/login?callbackUrl=...**
- **Efter login:** knapper/flow redirecter til **/dashboard**.
- (Valgfrit) Root → /dashboard for loggede brugere kan tilføjes senere hvis ønsket.

---

## 4) API-routes (konverteret til Supabase)
- `/api/discord/channels` ✅
- `/api/discord/guilds` ✅
- `/api/discord/roles` ✅
- `/api/discord/test-send` ✅
- `/api/servers/register` ✅
- `/api/teams` (GET/POST) ✅
- `/api/teams/join` ✅
- `/api/teams/[id]/my-role` ✅
- `/api/whoami` ✅

**Fælles mønster:**
```ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

const supabase = createRouteHandlerClient({ cookies });
const { data: { session } } = await supabase.auth.getSession();
if (!session) return new Response("Unauthorized", { status: 401 });
5) DB-felter (Discord)
Vi bruger Discord ID fra session.user.user_metadata.provider_id som discordUserId.

Tabeller der refererer Discord ID i jeres Prisma-model:

Server.ownerDiscordId, ServerMembership.userDiscordId, osv.

Email-only brugere har ikke et Discord ID → vis hjælpetekst om at logge ind med Discord for de features, der kræver det.

6) Miljøvariabler (lokalt + Vercel)
Supabase (public):

ini
Copy code
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
Supabase (server/admin):

ini
Copy code
SUPABASE_SERVICE_ROLE_KEY=...   # bruges i supabaseAdmin (server-side only)
Discord (OAuth via Supabase):

ini
Copy code
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
Discord Bot (valgfri – til bot-kald):

ini
Copy code
DISCORD_BOT_TOKEN=...
Fjern gamle NextAuth-vars (NEXTAUTH_*, @next-auth/prisma-adapter, nodemailer) hvis de stadig ligger i projektet.

7) Testtjekliste
/login:

Email + password → lander på /dashboard

“Login med Discord” → Discord consent → lander på /dashboard

/api/whoami:

Uden login → { "session": null }

Med login → { "session": { user: ... } }

/servers:

Viser kun guilds, hvor botten også er medlem

Hvis tom: check bot-token og guilds-scope

/servers/registered:

Viser servere for din discordUserId (metadata provider_id)

Middleware:

Gå til /dashboard uden login → sendes til /login

8) Backlog (senere)
Glemt kodeord (reset flow via resetPasswordForEmail + /reset-password UI)

Oprydning: slet evt. resterende imports af next-auth (skal være 0 resultater)

Evt. støtte “teams/servers” for email-only brugere (uden Discord)

Centraliser Discord-helpers i lib/discord.ts (getUserGuilds, getGuildRoles, …)

9) Change-log (denne migration)
Fjernet NextAuth-rute og lib/auth.ts

Opdateret middleware til Supabase session

Konverteret alle app/api/* routes til Supabase session

Opdateret /servers til at bruge session.provider_token for Discord API

Opdateret /servers/registered til at bruge user_metadata.provider_id

/login bruger nu Supabase (email/password + Discord OAuth)

markdown
Copy code

Hvis du vil, kan jeg også lægge **logout-knap** (Supabase `auth.signOut()`) ind i din header, så hele flowet er komplet.
::contentReference[oaicite:0]{index=0}