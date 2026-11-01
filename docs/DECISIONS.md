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

### F2 — Production bug and acceptance

- **Bug (production):** signing in on `www.pipa-clara.site` ended on `http://localhost:3000/**?error=invalid_request&error_code=flow_state_already_used…` with a 404. Cause: `https://www.pipa-clara.site/auth/callback` was missing from Supabase → Authentication → URL Configuration → Redirect URLs. When the requested `redirectTo` isn't on that list, Supabase falls back to the project's **Site URL**, which in "semestre" is `http://localhost:3000/**` (set by an earlier app; we don't change it). The local dev server then had no page called `/**` → 404. The `flow_state_already_used` error came from the same failed round trip.
- **Fix:** the founder added the exact Redirect URL (https, `www.`, no trailing slash) and saved.
- **Lesson:** in a shared project, a missing Redirect URL doesn't fail loudly; it silently sends the organizer to another app's Site URL. If a login ever lands on the wrong site, check the Redirect URLs list first.
- **F2 accepted (2026-11-01):** the founder signed in with Google on `www.pipa-clara.site`, landed on `/app`, the header switched to "Mi cisterna", and "Salir" signed her out. Localhost passed earlier.

### F4 — The engine: verdict and shares (pure functions + tests)

- Built **before F3** to save time: it depends on nothing (no database, no login), so it could be finished and committed while the Supabase steps wait for the founder.
- **`lib/verdict.ts` → `computeVerdict()`**: measured = (after − before) × length × width × 10; tolerance = 4 cm × length × width × 10 (±2 cm per reading). Order of checks: missing reading → pump ran → overflowed → after ≥ max height → compare. Any of the first four → `couldnt_measure`, and then **`measuredLiters` is `null`**: we never show a liters number we don't trust.
- **"after = max height" counts as couldn't measure** (the spec says "after ≥ max height"): a full cistern may have spilled.
- **Liters are rounded to whole liters** (`Math.round`). Without it, decimal dimensions like 1.1 × 1.1 m produce `1210.0000000000002` (floating point). There is a test for it.
- **Level going down** gives a negative measured value and `short`, never `consistent`.
- **`reason` is in Spanish** because it is shown on screen; it includes the margin, as in the mockup ("más allá del margen de medición (±300 L)").
- **`lib/shares.ts` → `splitShares()`**: floor(total / households) each; the remainder goes one peso at a time to the **first households in the list**. Deterministic and easy to explain; the difference between any two households is at most $1. Rejects cents, negative totals and non-whole household counts.
- **Tests (Vitest, 18 passing):** every PACKET §13 case, plus the boundary at exactly −160 L, the mockup example (3 × 2.5 m, 8,700 of 10,000 L, ±300 L → short), the float-rounding case, and a sweep of 2–40 households × 8 totals checking that no peso is lost or invented.
- **Dependency fix:** `vitest@5` needs `@types/node` ≥ 22; the scaffold had `^20`. Upgraded to `^24` (matches local Node 24) instead of `--force`. Plain Vitest, no jsdom / React Testing Library: we only test pure functions.

### F3 — Schema, RLS and private photo bucket

- **Migration** `supabase/migrations/20261101210000_pc_schema.sql`: the five `pc_` tables from PACKET §10, each with `organizer_id uuid not null default auth.uid() references auth.users`. Wrapped in `begin … commit`, so a failure leaves nothing half-created. It only **creates** `pc_` objects; nothing else in "semestre" is touched.
- **Columns added beyond PACKET §10, because later features need them:** `pc_cisterns.household_labels text[]` (F5 labels, count must equal `households_count`); `pc_readings.driver_present` (F6 checkbox, CHARTER principle 1); `unique (delivery_id, kind)` so a delivery has one before and one after reading. `measured_liters` is nullable (null when couldn't measure, same as the engine).
- **PACKET §11 ranges are also CHECK constraints** (dimensions 0.5–20 m, max height 50–2,000 cm, households 2–40, liters 1–40,000, price 1–20,000, labels ≤ 30, notes ≤ 500), so bad data is rejected even if someone skips the form.
- **RLS on all five tables**, policies `organizer_id = (select auth.uid())`; the `(select …)` form is evaluated once per query instead of per row.
- **Extra check on child rows:** insert/update of a delivery requires that its cistern belongs to the same organizer (same for readings, shares and challenges with their delivery). Without it, a user who learned another cistern's id could attach rows to it (foreign keys don't check RLS).
- **Deviation from the build prompt, on purpose:** `pc_challenges` has **select and insert policies only**, no update/delete. The prompt asks for all four on every table, but CHARTER principle 2 says a challenge is never deleted. With RLS on and no policy, the database itself forbids it.
- **Table privileges as a second lock:** revoked everything from `anon` on the `pc_` tables; `authenticated` gets select/insert/update/delete, and only select/insert on `pc_challenges`.
- **Bucket `pc_readings`:** private, created by the migration with `file_size_limit` 5 MB and `allowed_mime_types` JPG/PNG, so Supabase enforces PACKET §11 itself. Storage policies are scoped `bucket_id = 'pc_readings' and (storage.foldername(name))[1] = auth.uid()::text`. **Select and insert only:** a reading photo is evidence, so it can't be replaced or deleted. Uploads will use unique file names, so no overwrite is ever needed.
- **RLS test** `supabase/checks/f3-rls-test.sql`: impersonates account A and B in the SQL editor (role `authenticated` + JWT `sub`, the same thing Supabase does for a real request), runs 14 checks, prints PASA/FALLA, and **rolls everything back** (leaves no data).
- **Verified locally before touching Supabase:** no Postgres or Docker on this Mac, so ran migration + test in **PGlite** (real Postgres in WASM, installed in a scratch folder outside the repo) with a minimal stand-in for Supabase's `auth`/`storage` schemas. 14/14 PASA, 0 rows left behind.
  - **Bug found in my own test:** "A deletes a challenge" expected "0 rows deleted", but got `permission denied`, because the privilege revoke blocks it before RLS even runs. That is a stronger block, so the test now accepts both as "no se borró".
  - **Proved the test can fail:** with RLS removed from `pc_cisterns` on purpose, 4 checks turned FALLA (B sees, edits and deletes A's cistern, and creates one in A's name).
- **F3 accepted (2026-11-01):** the founder ran the migration in "semestre", added her second Google account to Test users, signed in once with it, and ran `f3-rls-test.sql` with both real accounts: **14/14 PASA** in the real Supabase (including storage). The second account can't see, change or delete the first one's rows or photos.

### F5 — Register the cistern

- **Validation in one pure module** `lib/validation.ts` (`validateCistern`, `validateDelivery`, `validatePhoto`), used by the Server Actions and covered by Vitest (15 tests, incl. PACKET §13: negative level, letters in liters, 10 MB photo → rejected). The database CHECK constraints from F3 repeat the same limits as a second line.
- **Numbers accept "2.5" or "2,5"**; letters, empty text and "1e3" are rejected. Liters, prices, fees and household count must be whole numbers.
- **Household labels:** one box per household appears when she types the number, pre-filled "Hogar 1…N" so she only edits what she wants; each 1–30 chars, no duplicates (case-insensitive), hint "Nunca nombres completos".
- **Form keeps what she typed on error** (`useActionState` returns the values; React 19 resets forms after an action otherwise).
- **Data access** in `lib/data.ts` (`requireUser`, `getCistern`, …): every query goes through RLS; the app never filters by user id by hand, so a missing filter can't leak data.
- **One cistern per organizer** in the UI (the first one created); the schema allows more for later.
- `/app` shows the form when there is no cistern, otherwise its summary, including "cada centímetro de nivel son X L" so she can check the arithmetic by hand.
- **Tested by me:** unit tests, lint, types, build. **Saving to Supabase is tested by the founder** (I can't sign in with Google).

### F6 — Record a delivery and get the verdict (the core)

- **"Nueva pipa"** (`/app/pipa/nueva`), one form in three sections that follow the real order: 1. la pipa (liters claimed, price, fee per household default $2), 2. antes (level, photo, "El pipero estuvo presente"), 3. después (level, photo, "bomba prendida", "se desbordó"). An empty "after" level is allowed; the engine then says "No se pudo medir".
- **Photos upload the moment they are taken**, straight from the phone to the private bucket (browser client + the F3 storage policies). If both went up at "Guardar", the before and after photos would carry the same time, and the time is part of the evidence. Uploading from the browser also avoids the Server Action body limit (~1 MB).
- **The reading's time is Supabase's, not the phone's:** the Server Action looks up each photo's `created_at` in Storage and saves it as `taken_at`. A phone clock can be changed; the server's can't. Without a photo, `taken_at` is the save time.
- **Photos are shrunk in the browser** to ≤ 1600 px JPEG (~300 KB): faster on mobile data, and redrawing on a canvas **drops EXIF, including the GPS location** phones embed. The 5 MB / JPG-PNG rule is checked on the original file (PACKET §11); the bucket enforces it again.
- **Photo paths are checked on the server:** only `<her user id>/<uuid>.jpg` is accepted, so a tampered form can't point a reading at someone else's file.
- **Saving:** validate → compute the verdict with F4 → insert delivery → insert readings and shares. PostgREST can't wrap several inserts in one transaction, so if readings or shares fail, the action **deletes the delivery** (cascade removes its children): no half-saved delivery.
- **Shares** = `splitShares(price + fee × households, households)`, assigned to the labels in the order she typed them.
- **Verdict screen** (`/app/pipa/[id]`), as in the mockup: claimed vs measured ("—" when it couldn't be measured), verdict card (teal = consistente, amber = faltante with the missing liters, grey = no se pudo medir) with the reason and the margin, both photo thumbnails with time and level (before also says "con el pipero presente" / "sin el pipero"), "Cada hogar paga" and "Ya pagaron: X de N".
  - Added a **breakdown line** ("Pipa $1,800 + cuota de Pipa Clara $24 (12 × $2) = $1,824"): Claudia's persona quits if "a fee shows up in her share without explanation".
  - The reason text is recomputed from the saved numbers (same pure function), so it is never out of sync with the formula.
  - Photos come from the private bucket through **signed links that expire in 1 hour**.
- **Dates and times use `America/Mexico_City` explicitly:** Vercel runs in UTC, so without it an 8:02 reading would show as 14:02.
- **Minimal list of deliveries on `/app`** (date + verdict, newest first), because the F6 acceptance needs her to "find it again after signing out and back in". The fuller history is F7.
- **Known risk for the persona test:** the form lives in one page for the ~40 min the truck takes. Photos are safe as soon as they upload, but if the phone reloads the page, the typed numbers are lost. Watch for it in Rosa's walkthrough.
- **Tested by me:** unit tests, lint, types, build, and that the new pages redirect to `/login` without a session. **The full flow with photos must be tested by the founder on her phone.**

### F5 — Bug: the cistern "saved" but nothing was stored (fixed)

- **Reported by the founder (production, phone):** pressed "Guardar cisterna", saw no error, reloaded `/app` and got the empty form again; `pc_cisterns` was empty in Supabase.
- **What the evidence shows so far:**
  - Vercel logs: 6 `POST /app` (the save action) between 15:32 and 15:34, all HTTP 200, no error lines. Only 2 of them invoked the server function (`λ`); one was served with **`cache=HIT`**, so that save never reached our code.
  - The Supabase API does see the table: an anonymous read-only probe got `401 / 42501 permission denied for table pc_cisterns`, exactly as designed (rules out a missing table or schema-cache problem).
  - The local dev log has no save attempts (she only tested in production).
- **Three real defects found, fixed now:**
  1. **Errors were invisible on a phone.** "No se pudo guardar" rendered at the *top* of the form, off-screen while her thumb is on the button at the bottom, so a failed save looked like nothing happened. Fix: `SubmitErrors` shows the error (or "Revisa los N datos marcados arriba") right above the button, in both forms.
  2. **Success was assumed, not verified.** "No error from the insert" was treated as "saved". Fix: `.insert(...).select("id").single()`, so Supabase must return the saved row; no row → visible error with its code.
  3. **The server logged almost nothing**, so the logs can't say what happened. Fix: log validation failures (which fields), insert failures (code, message, details, hint) and successes (row id), in both actions.
- **Also changed:** after saving the cistern, `redirect("/app")` instead of `refresh()`, so the page is re-read from the database instead of trusting any cached response.
- **Verified:**
  - Localhost: founder saved "cisterna de prueba"; `/app` then showed it, read back from the database after the redirect.
  - Production (commit `805ab3d`), with her second Google account: saved, still there after reload. Vercel log: `POST /app 200 … BYPASS | [createCistern] saved f6ab5eab-…`.
- **Root cause, honestly:** not proven. The old code (`refresh()` after an insert that was never verified) ran only in production, behind Vercel's cache, and one of her saves was answered from that cache (`cache=HIT`) without running the action. The most likely cause is that cached answer combined with the old "no error = saved" logic; both are gone now. Every save is now verified and logged, so if it ever happens again, the log will say exactly why.
- **Lesson:** a save that can fail must say so where the user is looking, and "no error" is not proof of "saved": ask the database for the saved row.
