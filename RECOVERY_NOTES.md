
**Indhold:**
```markdown
# Trading Tracker — RECOVERY_NOTES.md

> Denne fil er kun til internt brug: hjælper mig (ChatGPT) med at “catche op”, hvis en chat crasher. Kopiér hele filen ind i en ny chat, så jeg hurtigt er back on track.

---

## Seneste status

- **Auth:** NextAuth + Discord virker, admin flags sat korrekt.  
- **Dashboard:** Loader, 3 stat-cards + MentorOverview vises.  
- **Mentees:** Dummy-liste fungerer, filter/søgning/stars virker. TODO: Supabase endpoint.  
- **Signals:** Admin adgang virker, signaler kan oprettes/redigeres/annulleres. Preview & notifikationer på plads.  
- **Config:** API-routes til Discord (`guilds`, `roles`, `channels`, `bot-memberships`) er skrevet. `getSession` bug blev fixet → bruger nu `getServerSession(authOptions)`.  

---

## Kendte fejl

- `useSearchParams()` skal wrappes i `<Suspense>` på sider som `/join` og `/mentees`.  
- Prisma build-fejl på Vercel blev fixet ved `postinstall: prisma generate`.  

---

## TODOs (næste skridt)

1. Erstat `dummyAuth.tsx` helt med NextAuth.  
2. Implementér `app/api/mentees/route.ts` → Supabase-data i stedet for hardkodet liste.  
3. Oprydning i `config/…` så alle sider bruger `lib/discord.ts` i stedet for gamle helpers.  
4. (Senere) Tilføj Supabase tabeller til invites, teams, mentees.  

---

## Husk

- **ENV:**  
  - `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` → Bot creds.  
  - `ADMIN_DISCORD_IDS` → dit snowflake.  
  - `NEXTAUTH_SECRET` → random 32 chars.  
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.  
- **Images:** Hvis avatar ikke loader, whitelist `cdn.discordapp.com` i `next.config.mjs`.  
