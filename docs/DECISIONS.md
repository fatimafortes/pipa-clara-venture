# Pipa Clara — Decisions log

Every decision, bug and fix, in the order they happened. Newest session at the bottom.

---

## Session 1 — 2026-11-01

### F1 — Skeleton and public pages

- **Scaffold:** `create-next-app` (Next.js 16.4, TypeScript, Tailwind v4, App Router, ESLint). Generated in a temp folder and copied in, so `docs/` and the existing `.git` were never at risk.
- **Next 16 has breaking changes** (the scaffold ships `AGENTS.md` warning about it). Read the bundled docs in `node_modules/next/dist/docs/` before writing pages; layouts, pages, `Link` and `metadata` work as expected. Kept the default `cacheComponents` / `partialPrefetching` config.
- **Design follows `docs/mockup.png`:** teal `#12707a`, light grey page, white rounded cards, amber for "faltante". Inter font, base size 18 px (`html { font-size: 112.5% }`) because the primary user is 55.
- **Header** (`components/Header.tsx`): logo + "Pipa Clara", links "Cómo funciona" / "Por qué", button "Entrar". On phones the links wrap to a second row so nothing is cramped at 390 px.
- **`/app` placeholder:** "Entrar" points to `/app`, which only becomes real in F2. A "Muy pronto" page avoids a 404 and lets the live-URL check load `/app` from day one.
- **"DATOS DE EJEMPLO"** badge (`components/ExampleBadge.tsx`) on every block with invented numbers (the home example card).
- **The 10:1 case** is not spelled out in CHARTER or PACKET; first version derived it from the packet's example: $234 lost on a 1,300 L short load vs. a $24 fee per delivery → "≈ 10 measured deliveries". **Corrected, see below.**
- **Persona quote on `/about`** is labeled as a composite persona with an invented name, not presented as a real testimonial.
- **`npm audit` warnings** (minimatch via ESLint) affect dev tooling only, never shipped to the browser; the suggested `--force` fix would downgrade ESLint and break linting. Left as is.
- Removed template assets (Next/Vercel SVGs, `favicon.ico`); favicon is now `app/icon.svg` (water drop).
- Verified: `npm run lint` clean, `npm run build` prerenders `/`, `/product`, `/about`, `/app` as static pages. Founder checked the pages in the browser.

### F1 — Deploy

- **Vercel project:** `pipa-clara-venture` (created with `vercel --prod` from the CLI). Production URL: https://pipa-clara-venture.vercel.app; `/`, `/product`, `/about`, `/app` all return 200.
- **Bug:** `vercel git connect` failed ("Failed to connect … make sure you have access to the repository"). Cause: the Vercel GitHub App had no access to this repo. Fix: founder added the repo under github.com/apps/vercel → Configure → Repository access; retried and it connected. From now on every push to `main` deploys to production.
- An older Vercel project `pipa-clara` (2026-10-22) exists with no domain; left untouched, not used.

### F1 — Correction: the 10:1 case on `/about`

- **What was wrong:** the first `/about` compared $234 lost on one short load against the $24 fee on *every* delivery. Short loads are rare, so if one happens in 1 of 10 deliveries the two sides are roughly equal: the comparison doesn't hold up. It was my derivation, not the founder's case.
- **The founder's actual case (Verdict, gate 2):** today proving a short load is impossible (the driver's word vs. a suspicion, the fight lands between neighbors, the complaint to the company is ignored); with Pipa Clara a tape measure and two timestamped photos turn that into evidence both sides witnessed, at almost no cost. On normal deliveries a "consistente" verdict tells neighbors that water running out early is consumption, not the driver, which ends the fight.
- **Fix:** rewrote the section as Hoy / Con Pipa Clara / pipas normales. It has no invented numbers (only the $2 pilot price from the CHARTER), so it no longer carries the "DATOS DE EJEMPLO" badge.
- **Lesson:** don't fill a gap in the docs with my own reasoning on a page of record; ask the founder first.

### F1 — Real domain

- **First decision (2026-11-01):** the founder chose to keep building and connect the domain later, with the risk logged (assignment scores 0 if the domain doesn't load; DNS can take hours).
- **Then resolved the same day:** the founder bought **pipa-clara.site** in Vercel (registrar and nameservers: Vercel) and attached it to the `pipa-clara-venture` project with `pipa-clara.site` → 308 redirect → **`www.pipa-clara.site`** (the canonical URL).
- Vercel's dashboard still showed "Pending Nameserver Propagation", but public DNS already answered with `ns1/ns2.vercel-dns.com`. Checked with `curl`: `/`, `/product`, `/about`, `/app` return 200 on `www.pipa-clara.site`, and the apex redirects with 308. The dashboard status just lags behind.
- **F1 accepted:** the three pages load locally, on Vercel and on the real domain.
- **For F2:** OAuth redirects must cover localhost, `pipa-clara-venture.vercel.app`, `pipa-clara.site` and `www.pipa-clara.site`.

### F2 — Sign in with Google (code)

- **Libraries:** `@supabase/ssr` (session in cookies, so the server can read it) + `@supabase/supabase-js`; `server-only` so server code can never be bundled for the browser.
- **Next 16 renamed `middleware` to `proxy`.** `proxy.ts` runs only on `/app/*`: refreshes the session cookie (`getClaims()`) and redirects to `/login` if there is none. It is an optimistic first filter (Next docs say not to rely on it for authorization), so `/app` checks again on the server with `getUser()`, which validates the session with Supabase.
- **`cacheComponents` rule:** reading cookies outside `<Suspense>` is a build error. `/app` reads the session inside a Suspense boundary; it builds as a partial prerender (static shell + streamed user content). `/login` reads `?error` in a client component, also behind Suspense.
- **`setAll(cookies, headers)`:** current `@supabase/ssr` passes cache headers along with refreshed cookies; the proxy copies them so a response carrying session cookies is never cached.
- **OAuth return URL** is built from `window.location.origin`, so the same code works on localhost, the Vercel URL, `pipa-clara.site` and `www.pipa-clara.site`. `/auth/callback` swaps the one-time code for a session and always goes to `/app` (no `?next=` parameter, so nobody can use it to redirect elsewhere).
- **Keys:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the publishable key, or the legacy anon key; both are safe in the browser because RLS protects the data). They live in `.env.local` (git-ignored) and in Vercel env vars. `.env.example` lists the names without values; `.gitignore` gained `!.env.example`. The service-role key is never used.
- **Sign-out** is a Server Action (`app/app/actions.ts`) that clears the session and returns to `/`.
- **Redirect URL map:** in **Google** the only redirect URI is Supabase's own callback (`https://<project-ref>.supabase.co/auth/v1/callback`), because Google hands the login to Supabase, not to our app; our four origins go under "Authorized JavaScript origins". In **Supabase** the four app callbacks go under Redirect URLs. Site URL: `https://www.pipa-clara.site`.

### F2/F3 — Shared Supabase project "semestre"

- **Decision (founder):** the Supabase free plan's project limit is reached, so Pipa Clara uses the existing project **"semestre"**, which already hosts apps from earlier weeks. Rule: **don't break anything that is already there.**
- **Prefix `pc_`** on every table and on the photo bucket: `pc_cisterns`, `pc_deliveries`, `pc_readings`, `pc_shares`, `pc_challenges`, bucket `pc_readings`. Names live in one place, `lib/supabase/names.ts`; app code never types a table name by hand.
- **Site URL stays as it is** (it belongs to another app). We only *add* the 4 Redirect URLs (`/auth/callback` on localhost:3000, `pipa-clara-venture.vercel.app`, `pipa-clara.site`, `www.pipa-clara.site`). Consequence: if a `redirectTo` is not on that list *exactly*, Supabase falls back to the Site URL and the organizer lands on the other app. If that ever happens, the first suspect is a typo in the Redirect URLs.
- **Google:** if the provider is already on in "semestre", reuse that OAuth client and only add the 4 JavaScript origins + `pipa-clara.site` as an authorized domain. The redirect URI (`https://<ref>.supabase.co/auth/v1/callback`) is the same for the whole project, so it is already there. Trade-off: Google's consent screen shows that client's app name/logo, not "Pipa Clara". Acceptable for the build week; logged for the persona test (Rosa may hesitate at an unfamiliar name).
- **Shared `auth.users`:** anyone who signed in to another app in "semestre" is also a valid Pipa Clara user, and vice versa. Data stays separate because RLS is `organizer_id = auth.uid()` on every `pc_` table, so a user only ever sees rows they created here.
- **Risks to check before F3** (read-only queries in `supabase/checks/pre-f3-shared-project.sql`):
  1. no existing `pc_*` tables or bucket;
  2. triggers on `auth.users` from older apps (they fire for Pipa Clara sign-ups too and could fail the sign-in);
  3. existing policies on `storage.objects` that don't filter by `bucket_id` (they would also open `pc_readings`).
- **F3 plan, adjusted:** the migration in `supabase/migrations/` only *creates* `pc_` objects (no `drop`, no `alter` of anything without the prefix). RLS on all five `pc_` tables with select/insert/update/delete `organizer_id = auth.uid()`. Private bucket `pc_readings`; storage policies always scoped `bucket_id = 'pc_readings' and (storage.foldername(name))[1] = auth.uid()::text`. Policy names also start with `pc_` so they are easy to find among the other apps' policies.
- **Checks run by the founder (2026-11-01)** in the "semestre" SQL editor, all four returned "Success. No rows returned":
  1a. no `pc_*` tables → names free;
  1b. no `pc*` buckets → bucket name free;
  2. no triggers on `auth.users` → a Pipa Clara sign-up runs no other app's code;
  3. no policies on `storage.objects` at all → nothing from older apps can open `pc_readings`; the F3 policies will be the only storage policies.
  Result: safe to proceed with F3 in the shared project as planned.
- **Env vars:** `.env.local` checked (format OK, git-ignored; Supabase auth settings answered 200, Google enabled, sign-ups allowed). Same two variables added to Vercel for production, preview and development with `vercel env add`.

### F2 — Mechanical test: bugs found and fixed

- **Founder's test on localhost:** signed in with Google, saw her email on `/app`, "Salir" returned to `/`. ✔
- **Bug (mechanical test):** with a session, the header still showed "Entrar". Cause: the header was fully static (built once, same for everyone), so it never knew about the session. Fix: `components/AuthButton.tsx` reads the session (`getClaims()`) behind `<Suspense>` and shows **"Mi cisterna"** → `/app` with a session or **"Entrar"** → `/login` without one. An invisible placeholder of the same size keeps the header from jumping while it loads. Public pages became partial prerenders (static shell + the streamed button).
- **Knock-on fix:** a Server Component can't write cookies, so if the header refreshed an expiring token on a public page the new token would be lost and the organizer signed out later. `proxy.ts` now runs on **every** page (static files excluded) to refresh the session; it still only redirects to `/login` on `/app`.
- **Dev "1 Issue":** `Route "/app": Next.js encountered the unstable value Date.now() while prerendering`. Cause: the Supabase client checks token expiry with `Date.now()`, and Next 16 (`cacheComponents`) tried to prerender that part. Fix: `createClient()` in `lib/supabase/server.ts` calls `await connection()` first, which tells Next "this runs only when a real request arrives". Fixed once, for every server use.
- **Also in the log:** `AuthApiError: Invalid Refresh Token: Refresh Token Not Found`. Likely leftover `sb-<ref>-auth-token` cookies on `localhost:3000` from earlier "semestre" apps (same Supabase project, same cookie name, same host). Harmless: the stale cookie is treated as "no session". One code exchange also failed before a retry worked; `/auth/callback` now logs the reason (`error.code`, or Google's `error` when there is no code) so the next failure explains itself.
- **Second Google account blocked:** the shared OAuth client is in Testing mode, which only lets listed Test users in. The founder adds the second account under Google Auth Platform → Audience → Test users (needed for the F3 RLS test).
