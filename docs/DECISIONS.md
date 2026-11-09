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

### F6 — Founder's phone test

- **Faltante:** 10,000 L claimed, 26 → 142 cm on 3 × 2.5 m → "Faltante: 1,300 L" (±300 L). ✔ Log: `[createDelivery] saved 7e0ec02d-… short`.
- **No se pudo medir** (pump ran): correct verdict, no shortfall shown. ✔ Log: `saved 603e1dec-… couldnt_measure`.
- **Bug (founder):** in "Litros que entraron (medidos)" the founder saw nothing where the measured value should be, which looked like a broken screen. Fix: say it in words, **"— (no se pudo medir)"**, in smaller grey text so it doesn't read as a missing number.
- **Validation:** the log shows a rejected save on `beforeCm` (the −5 test). No rejection for letters in liters was logged; on a phone the `inputMode="numeric"` keyboard may not offer letters at all. The server check is still covered by unit tests.
- **Validation on the phone:** the numeric keyboard doesn't offer letters at all; typing a wrong value shows the red message. ✔
- **Persistence:** signed out and back in; all 4 deliveries are in "Pipas registradas", each opens with its data and photos. ✔
- **F6 accepted (2026-11-01).**

### F7 — Payments, challenges and WhatsApp summary

- **Verdict screen order follows the mockup:** verdict card → "Cada hogar paga / Ya pagaron" → green "Mandar resumen por WhatsApp" → outlined "Registrar desacuerdo" → "El veredicto es evidencia, no sentencia…" (now true) → challenges → payments.
- **Payments:** a "Pagos" section with one button per household ("Pendiente" amber / "Pagado ✓" teal), labeled "Solo tú ves quién ya pagó". Each tap is a Server Action that updates one share, **asks Supabase for the updated row** (lesson from the F5 bug) and redirects back to re-read from the database. A failed update shows "No se pudo guardar el pago" via `?error=pago`. The update also filters by `delivery_id`, and RLS limits it to her own rows.
- **Challenges:** "Registrar desacuerdo" opens a form: who (El pipero / Un vecino / Yo) + note (1–500 chars, `validateChallenge`, with tests). Saved with the same verify-and-redirect pattern; listed under the verdict with who and when. **No edit or delete in the UI, and the database forbids both** (F3: no update/delete policy and no privilege). The form is keyed by the number of challenges, so it closes itself after a save.
- **WhatsApp summary** (`lib/summary.ts`, 8 tests): date, liters claimed vs measured ("no se pudo medir" in words), verdict with margin, "before" reading time and whether the driver was present, amount per household with the fee breakdown, "Ya pagaron: X de N", and how many challenges exist. Opened with a `wa.me/?text=` link (no API, no bot).
  - **No names, by construction:** `buildSummary` doesn't even receive household labels or challenge notes (a note could contain a name), so it can't leak them; challenges appear only as a count. A test also checks the text never contains "Depto", "Hogar" or "Casa".
  - **The photo itself can't travel through `wa.me`** (text only). For Claudia, the summary says the "before" photo exists, its time and that the driver was present.
- **History:** `/app` "Pipas registradas" now shows "Ya pagaron: X de N" under each delivery (one query, with shares embedded).
- **F7 accepted (2026-11-01):** the founder tested payments, a challenge and the WhatsApp summary on her phone. Logs confirm: `[setSharePaid] … paid/pending`, `[createChallenge] saved …` ×2, no errors.
- **Bug found in the logs, not reported by the founder:** the same share was marked "paid" up to **9 times in ~7 seconds**. A tap that is still saving looked like a tap that failed, so she tapped again. Two causes: the button gave no feedback while saving, and the action redirected to the same URL plus `#pagos`, which the router can treat as a hash jump and render late. Fix: `PaidButton` (client, `useFormStatus`) shows "Guardando…" and is disabled while saving; the action now calls `refresh()` (Next 16's way to re-render the current page after a Server Action) instead of redirecting, so the page updates in place without jumping to the top. Rosa would have hit this with the driver waiting.

### F8 — Production check on the real domain

- **Checked from outside, on `https://www.pipa-clara.site`:**
  - `/`, `/product`, `/about`, `/login` → 200, `lang="es"`.
  - `/app`, `/app/pipa/nueva`, `/app/pipa/<id>` without a session → 307 to `/login`.
  - `pipa-clara.site` and `http://` → 308 to `https://www.pipa-clara.site`.
  - All five `pc_` tables, anonymous → 401. Photo bucket: anonymous list → empty (RLS), public URL → 400 (private bucket).
  - Secrets: no service-role or secret key in the repo, in git history (only `.env.example` was ever committed) or in the production browser JS. The one `sb_secret_` match in the JS is supabase-js checking a key's prefix, not a key.
- **Full flow by the founder on the real domain, on her phone:** Google sign-in (F2), cistern (F5), deliveries with photos and all three verdicts (F6), sign out / sign in with everything still there, payments, challenge and WhatsApp summary with no names (F7). Each save confirmed in the Vercel logs.
- **Last fix verified in production:** payment buttons show "Guardando…", update in place without jumping to the top, and "Ya pagaron" goes up by one.
- **PACKET §13 "find at least one bug, fix it, redeploy, log it":** seven are logged above. Five were found by the founder (header "Entrar", Redirect URL fallback to another app, cistern not saved, blank "measured", "1 Issue" in dev); two by me (my own RLS test, and repeated payment taps seen in the logs).
- **F8 accepted (2026-11-01). Final deploy = this commit.**

### Cuts and deviations (for the grader)

- **Nothing was cut** from the build prompt; the time-budget cut list (history list, challenge polish) wasn't needed.
- **Deliberate deviations, each explained above:** shared Supabase project "semestre" with a `pc_` prefix; `pc_challenges` and the photo bucket allow no update/delete (CHARTER principle 2, evidence); F4 was built before F3 to save time; extra columns `household_labels` and `driver_present`.

### Open risks to watch

- **The delivery form lives in one page for ~40 minutes:** photos are safe once uploaded, but typed numbers are lost if the phone reloads the page.
- **Google's consent screen shows the shared "semestre" client's name**, not "Pipa Clara"; Rosa may hesitate at an unfamiliar name.
- **`wa.me` carries text only:** Claudia sees that a "before" photo exists, with its time and the driver present, but not the photo itself.

### Persona pass — done by the founder (2026-11-01), see "Persona-test fix" below

- Rosa (55) walks the screenshots in order with the driver "waiting"; Claudia (41) reads only the WhatsApp summary. Log every hesitation and fix the worst one before the deadline (PACKET §13).

## Tomorrow's first move (Week 13)

- **The real test with María on her next delivery.** Before the truck: register her cistern with her (dimensions with a tape measure, household labels like "Depto 3", never names). With the truck: take the "before" reading with the driver present, then the "after"; time how long each reading takes while the driver waits. After: she sends the WhatsApp summary to her group and marks payments as they come in.
- **Watch the kill conditions (PACKET §13):** can the delivery actually be measured (pump to the tinaco, overflow)? Does she take both readings without help? Do the neighbors accept the summary?
- **Before María's delivery, fix the `PGRST303` sign-in risk** (retry once, see "Open risk found in the final log review").
- **Watch the open risks above:** does the form survive the wait, does the Google screen confuse her, and is the WhatsApp text enough for the neighbors without the photo?
- **Pricing (CHARTER, Week 13):** ask whether the MXN 2 per household fee feels fair after she sees a real verdict.
- **North star starts counting:** delivery #1 of 5 measured without anyone reminding her.

### Persona-test fix (2026-11-01, before submitting)

- **Worst confusion, shared by Rosa and Claudia:** the verdict said "Faltante: 1,300 L" but the households were still charged the full price, so **the verdict had no consequence**. Fix, keeping CHARTER/Blueprint condition 4 (the app labels, the organizer decides):
  1. **"Lo que sí entró vale $X"** on a short verdict: `valueOfMeasured()` = measured / claimed × price, whole pesos, never above the price (mockup: 8,700 / 10,000 × $1,800 = **$1,566**; tests).
     - Then **"¿Cuánto le pagaste al pipero?"**: "El precio completo" or "Otro monto" (0 to the price; `validateDriverPayment`, tests).
     - Saving stores `pc_deliveries.paid_mxn` and **re-splits every household's share on what was actually paid**, keeping who already paid. Same verify-the-row pattern as F5.
     - The breakdown on screen says "Le pagaste al pipero $X de $Y".
     - **Schema change:** migration `20261101230000_pc_paid_to_driver.sql` adds one nullable column (`null` = full price; check 0–20,000). Validated in PGlite together with F3 (RLS test still 14/14). **Deploy order matters:** the new code selects `paid_mxn`, so the migration must run in "semestre" *before* the push, or every delivery page would fail. Verified from outside: before the migration, the API answers `42703 column … paid_mxn does not exist`.
     - The delivery form's "Precio que pagaste" became **"Precio que pide el pipero"**, since what she pays is now decided after the verdict.
  2. **WhatsApp summary:** time of the **before AND after** readings (with or without photo), **how much the driver was paid and why** (full price despite the shortfall / what the water that entered is worth / another amount agreed), shares on the paid amount, and **one line per challenge with its note**.
     - This **reverses my F7 decision** to send challenges as a count only. The founder decided notes go in, so the challenge form now warns: "Esta nota aparece en el resumen de WhatsApp: no escribas nombres." Household labels are still never received by the summary function.
     - Organizer challenges read "La organizadora" in the summary, since "Yo" makes no sense to a neighbor.
  3. **Wording:** "cotizados" → "los que dijo el pipero"; "±300 L" → "margen de medición de 300 litros" (`formatLitersWord`), everywhere it is shown: verdict reason, summary, home example, /product.
  4. **Placeholders** now read "ej. 10000", in light italic grey, so an example never looks like a value already typed.
- Tests: 49 passing (new: `valueOfMeasured`, `validateDriverPayment`, 4 payment/challenge summary cases, "no ±" check).
- **Migration run by the founder in "semestre"** before the push; verified from outside (the API answer changed from `42703 column does not exist` to `42501 permission denied`), then deployed (`727c7fe`). No errors in the logs after the deploy.
- **Verified by the founder on her phone:** paying $1,566 of $1,800 re-split 12 households to **$132 or $133**; households already marked paid stayed paid; the WhatsApp text says "Se le pagó al pipero $1,566 de los $1,800 que pedía: lo que vale el agua que sí entró", with both reading times and the challenges, and **no names**. Log: `[setDriverPayment] a3c672d1-… 1566 of 1800`.
- **Persona-test fix accepted (2026-11-01).**

### Open risk found in the final log review

- **`PGRST303 JWT issued at future`**, once, on `GET /app` **0.9 s after a Google sign-in**. The session token's "issued at" time was slightly ahead of the database's clock (clock skew between Supabase Auth and its API), so that one request failed. Her next requests 3 s later worked; it fixed itself.
- **Why it matters:** it can happen right after signing in, which is María's first impression in Week 13.
- **Proposed fix (not applied, to avoid an untested change on submission day):** in `lib/data.ts`, retry a query once after ~1 s when Supabase answers `PGRST303`. First thing to do in Week 13, before María's delivery.

---

## Week 13

### W1 — Retry once on `PGRST303` (open risk from Week 12)

- **Helper** `lib/supabase/retry.ts` → `retryOnFutureToken(name, run)`: if Supabase answers `PGRST303` ("JWT issued at future"), wait 1 s and ask **once** more; log `[retry PGRST303] <name> ok|failed`. Any other answer (data or a different error) comes back untouched on the first try.
- **It takes a function that builds the query, not a query already sent,** so the retry is a genuinely new request instead of relying on a Supabase query object being safe to await twice.
- **Wrapped:** the three first reads in `lib/data.ts` (`getCistern`, `getDeliveries`, `getDelivery`), which are what a stranger sees right after signing in. **Not wrapped, on purpose:** the four follow-up reads inside `getDelivery` (they run only after the first read succeeded with the same token) and the saves in Server Actions (by the time she presses "Guardar", the ~1 s clock gap is long over). The spec says "nothing else changes".
- **Tests (5, Vitest, fake query):** fails once then succeeds → data, 2 calls; fails twice → returns the error, never a third call; normal answer → 1 call; other errors (e.g. `42501`) not retried; waits ~1 s before the second try (fake timers). 54 tests passing.
- **W1 accepted (2026-11-06):** pushed as `0e310c9`; the founder signed out and back in on `www.pipa-clara.site` on her phone and landed on `/app` with her cistern and pipas; a pipa page looks the same.

### W2 — Strangers can sign in

- **Blocked by Google:** the shared OAuth client can't be published ("In production") until Branding has an app name, a support email, a homepage URL **and a privacy policy URL**. Pipa Clara had no privacy page.
- **Needed deviation from the packet:** PACKET §6 doesn't list a privacy page, but A5 ("strangers can sign in") can't happen without one, and A5 is on the never-cut list. So I added the smallest thing that unblocks it: one static public page, `/privacidad`, no new data, no new behavior. Logged here as a deviation, not as scope creep.
- **`/privacidad`** (Spanish, plain language for Rosa, dated 8 Nov 2026): what is stored (Google email, name and profile-photo link; cistern; household labels like "Depto 3"; deliveries; readings; photos without location; payments; challenges; the event log with no IP or device data), why, who can see it, private photos, what we don't do, the services used, how to ask for deletion.
- **Only claims the app actually keeps, checked against the code before writing:**
  - "Name and profile photo": Supabase stores what Google sends at sign-in in `auth.users`, including the name and the avatar link, even though Pipa Clara never shows them. Listed so the page isn't incomplete.
  - "Photos without location": true since F6 (redrawn on a canvas in the browser, which drops EXIF/GPS).
  - "Only you": RLS on every `pc_` table (F3, 14/14 PASA). **Said honestly that the administrator has technical access to the database**; "nobody else can see it" would be false.
  - "Neighbors": they only see the WhatsApp summary she chooses to send, including challenge notes (Week 12 persona-test fix), and what goes to WhatsApp stays in WhatsApp.
  - "No trackers": no analytics in the code; the Inter font is bundled with the site at build time, so visitors' browsers make no Google Fonts requests; only Supabase session cookies.
  - "Vercel receives technical data such as the IP": true for any hosting; our own event log doesn't store it.
  - **Event log:** described as it will be when W3 ships this week (actions and time only). Update the page if W3 changes.
  - **No promised deadline** for deletion and no legal-sounding guarantees; just "we'll tell you by email when it's done".
- **Deletion, for whoever does it:** deleting the user in Supabase → Authentication cascades every `pc_` row (all tables reference `auth.users … on delete cascade`). **Photos in the `pc_readings` bucket do not cascade:** delete the folder `<user id>/` in Storage by hand first.
- **Support email** on the page: `fatimafortes.builds@gmail.com`, the same one as Google Branding (founder's choice). It's in one constant at the top of `app/privacidad/page.tsx`.
- **Linked from the footer** on every page (Google checks the URL loads); the link is padded to a larger tap area on phones.
- **Branding URLs to enter:** homepage `https://www.pipa-clara.site`, privacy policy `https://www.pipa-clara.site/privacidad`.
- Checked: types, lint, 54 tests, build; `/privacidad` answers 200 without a session (not redirected to `/login`).
- **Privacy page deployed** as `1b728ce`.
- **Google Auth Platform, done by the founder (2026-11-08):** Branding filled in (app name **"Pipa Clara"**, support and developer email `fatimafortes.builds@gmail.com`, homepage `https://www.pipa-clara.site`, privacy policy `https://www.pipa-clara.site/privacidad`, **no logo**, so no brand review). Audience → **Publish app** → status **"In production"**. Supabase → "Allow new users to sign up" is **on**.
- **Scopes:** not reported from the Data Access screen. Indirect evidence that only the basic `openid` / `email` / `profile` scopes are in use: the app requests no extra scopes in code (`GoogleButton.tsx` passes none), and Google showed **no "unverified app" warning**, which it does show for sensitive scopes in production. Check the Data Access screen directly if anything changes.
- **Side effect on the other "semestre" apps (shared OAuth client):** their Google sign-in screen now also says "Pipa Clara", and any Google account can now sign into them, not just test users. Each of them must rely on its own RLS, not on the test-user list. Pipa Clara does (a new account sees only its own, empty data).
- **Week 12 open risk closed:** the consent screen no longer shows an unfamiliar client name to Pipa Clara users.
- **Fallback (Test users per tester) not needed.**
- **W2 accepted (2026-11-08):** a Google account that was **never a test user** signed in on `www.pipa-clara.site` on a phone, saw **no warning screen**, and landed on `/app` with the empty cistern form.

### W3 — Event log `pc_events`

- **Migration** `supabase/migrations/20261108120000_pc_week13.sql` (one transaction, only `pc_` objects): table `pc_events` exactly as specified (fixed names in a CHECK, `delivery_id` optional, index on `(organizer_id, created_at)`); RLS with **select and insert policies only**; insert also requires that `delivery_id`, if given, is the organizer's own; `anon` gets nothing, `authenticated` only select/insert. With no update/delete policy or privilege, the log can't be rewritten.
- **The W4 column `pc_readings.repeat_level_cm` is in the same migration** (the prompt allows it): one Supabase run this week instead of two. Nullable, nothing reads it until W4.
- **`lib/events.ts` → `logEvent(name, deliveryId?)`**, server-only. Stores only the name, the delivery and the time. **It never blocks or breaks the action:** it reads the session during the request and schedules the insert with Next's `after()`, which runs **after the response is sent** (read in the bundled Next 16 docs). Any failure, even a thrown exception, ends as a `[logEvent] … failed` log line. Successes log `[logEvent] <name> <row id>` (verify-the-row pattern: `.select("id").single()`).
- **The event insert uses the W1 retry:** `signed_in` is written a fraction of a second after the Google sign-in, which is exactly when `PGRST303` happened in Week 12. Because it runs after the response, the 1 s wait never delays the user.
- **`signed_in` in the auth callback:** checked in Next's source that cookies set during the code exchange are readable later in the same request, so the insert carries the new session.
- **Where each event is logged:** `signed_in` (auth callback), `cistern_created`, `delivery_saved`, `challenge_saved` (their Server Actions, after the save is verified and before the redirect).
- **`verdict_viewed` is logged from the browser, not the server render. Decision, with reason:** the verdict page re-renders itself on every payment tap (`refresh()`, Week 12 fix), so logging during the render would add a fake "view" per payment. A tiny client component (`LogVerdictViewed`) calls a Server Action once when the page opens (a ref keeps React's dev double-run to one row).
- **`summary_sent`: the WhatsApp button stays a plain link; the log call starts on the same tap instead of strictly before opening `wa.me`.** Deviation from the prompt's wording, on purpose: phones (especially iPhone Safari) block a link that opens only after waiting for a server answer, so "log first, then open" could stop WhatsApp from opening at all.
- **The Server Action behind both (`logDeliveryEvent`) accepts only those two names and a uuid**, and deliberately does **not** call `requireUser()`: its redirect would move her to `/login` from a background call. Without a session, RLS rejects the insert and it is logged.
- **RLS test** `supabase/checks/w13-events-rls-test.sql` (13 checks, PASA/FALLA, rolls back): A adds and reads her own events; unknown name ("robo") rejected by the database; nobody can update or delete events (A or B); B can't read A's events, can't log one with A's `delivery_id` or in A's name; a visitor without a session sees and adds nothing.
- **Return signal** `supabase/checks/w13-return-signal.sql` (read-only): per organizer id, no emails, days with `signed_in` counted **in Mexico City time**, first/last day, and "regresó: sí" at 2+ days.
- **Verified locally in PGlite** (scratch folder, outside the repo, minimal Supabase stand-in): the three migrations run in order; `f3-rls-test.sql` still **14/14 PASA**; `w13-events-rls-test.sql` **13/13 PASA**; 0 rows left behind. **Proved the new test can fail:** with RLS removed from `pc_events` on purpose, 5 checks turned FALLA. The return-signal query counted a 23:30 and a 00:30 sign-in (Mexico City) as two days, as intended.
- Checked: types, lint, 54 tests, build.
- **Failed-log test (2026-11-08, localhost, before the migration, so `pc_events` didn't exist):** the founder signed in, saved a pipa and opened its verdict. All three worked. Server log: `[logEvent] insert failed: signed_in PGRST205 Could not find the table 'public.pc_events'`, then `[createDelivery] saved ee848095-… couldnt_measure` followed by `insert failed: delivery_saved PGRST205 …`, and `logDeliveryEvent("verdict_viewed", …) in 4ms` followed by `insert failed: verdict_viewed …`. **A failed event insert doesn't stop the save, the sign-in or the page;** the 4 ms action shows the insert runs after the answer is sent. ✔
- **Dev-server note:** the old dev server on port 3000 was a leftover background task from an earlier session (started 1 Nov, logs not visible). Stopped it at the founder's request and started a new one whose log I can read.
- **Bug caught before pushing (2026-11-08): the migration had not run.** The founder accepted W3 and said the W4 column was "already in", but a check from outside with the public key still answered `PGRST205` (no `pc_events`) and `42703` (no `repeat_level_cm`) on the project in `.env.local` (ref `nzhdar…`, "semestre"). Either it ran in another project or it failed and the transaction undid it. **Nothing pushed:** W4 code selects `repeat_level_cm`, so pushing it would break every pipa page in production (the `paid_mxn` lesson). W3's acceptance (rows in `pc_events`, RLS test 13/13 with both accounts) is **pending** until the migration is confirmed.
- **Migration confirmed from outside (2026-11-08)** after the founder ran it in "semestre" (first attempt failed harmlessly with `42601` because the clipboard held chat text instead of the SQL; nothing ran). Anonymous probes now answer `42501 permission denied` for `pc_events` (was `PGRST205` not found) and for `pc_readings?select=repeat_level_cm` (was `42703` column missing): table and column exist, and visitors are refused.
- **RLS test with both real accounts (2026-11-08): `w13-events-rls-test.sql` 13/13 PASA** in "semestre" (account A and B filled in on the clipboard copy only; the repo file keeps the placeholders). **From outside, no session:** reading `pc_events` and inserting into it both answer `401 / 42501 permission denied`.
- **W3 accepted (2026-11-08)** by the founder: failed-log test ✔, migration ✔, RLS 13/13 ✔. **Still to see after the deploy:** one row per action in `pc_events` from a full flow on her phone (only possible once this code is live).

### W4 + W5 — Precision check and honest uncertainty messages (built together, founder's decision)

- **Built as one step to save time** (founder's call), with the **time-budget cuts applied in the prompt's order: no "spread ≥ 3 cm" warning text, no range in the WhatsApp summary.** Kept: repeat reading, margin math, range on the verdict page, the "unos X L menos" line, the grey precision box, the pump question.
- **Engine** (`lib/verdict.ts`): optional `beforeRepeatCm`. `spreadCm = |before − repeat|` (rounded to 0.1 cm so 42.3 − 41 isn't 1.2999…); `errorCm = 2` without it, otherwise `max(1, spread)`; `toleranceLiters = round(2 × errorCm × L/cm)`. New outputs `errorCm`, `spreadCm`, `measuredRange` (measured ± margin, never below 0; null when it couldn't be measured) and `belowClaimInsideMargin`. **Without a repeat the result is identical to Week 12** (a test compares the whole object; the 18 Week 12 tests were not edited).
- **Two small text helpers** next to the engine so the page and the summary say exactly the same: `insideMarginNote()` ("Entraron unos X L menos…", X rounded to the nearest 10; **no note if it rounds to under 10 L**, since "unos 0 L menos" means nothing) and `precisionNote()` (the grey box).
- **Decision: on the verdict card the "unos X L menos" line replaces the usual reason, it doesn't follow it.** Read aloud, "Entraron los litros que dijo el pipero…" followed by "Entraron unos 100 L menos…" contradicts itself; the mockup shows only the second line under "Consistente". The engine's reason text itself is unchanged.
- **Grey precision box only when there are measured liters:** on "no se pudo medir" it would talk about a margin that isn't used.
- **Form:** inside "Antes", after the level, a block **"Mide otra vez (recomendado)"** with the spec's instruction; optional, same 0 – max-height validation (tests: empty → null, "41,5" accepted, −1 / 201 / letters rejected). Saved as `repeat_level_cm` on the "before" reading.
- **Pump question is an information box, not an answer field** (amber, before "Antes"): "¿Apagaste la bomba que sube el agua al tinaco?" + "Si está prendida, el resultado dirá 'no se pudo medir'." A Yes/No input that changes nothing would mislead; the existing checkbox still decides the verdict, as specified.
- **The verdict page and the summary recompute with `beforeRepeatCm`** (read back from `pc_readings`), so the margin shown matches the saved verdict. Old deliveries have `repeat_level_cm = null` → exactly Week 12.
- **WhatsApp summary:** the margin now comes from the repeat; adds the "unos X L menos" sentence on consistent deliveries only. Still never receives household labels.
- **"robo / robó / te robaron":** tests on every reason, note and summary variant; a search of `app/`, `components/`, `lib/` finds 0 matches.
- **Tests: 74 passing** (+13 engine incl. all PACKET §13 cases, +2 validation, +5 summary). Types, lint, build OK.
- **Deploy order: the Week 13 migration must run in "semestre" before this push**, or every pipa page fails with `42703`. Done: it ran and was confirmed from outside (see W3).
- **Two commits from one working tree:** W3 and W4+W5 touched the same three files, so the W3 commit was staged from W3-only copies and **built on its own** before committing (types, lint, 54 tests, build). **Slip on my side, no loss:** setting W4+W5 aside with `git stash` for that build conflicted on `DECISIONS.md` when restored (my W3-only copy had one extra blank line). Git kept the stash; I restored every file from it, checked them byte for byte, restaged and dropped the stash only after the W3 commit. The full tree was re-checked afterwards: types, lint, 74 tests, build.
- **W3 and W4+W5 accepted (2026-11-08), founder's phone test on production with a new account, 3 × 2.5 m cistern:**
  - Pipa 1 (before 41, repeat 42, after 173): **Consistente, 9,900 L, the range, "unos 100 L menos … 150 litros" and the grey box.** ✔
  - Pipa 2 (no repeat): **300 litros** margin and "Medida una vez". ✔
  - WhatsApp summary: the right margin, the "unos 100 L menos" line, no names. ✔
  - Payment buttons only toggle pendiente/pagado; **`pc_events` shows one row per action, and payments added none** (the client-side `verdict_viewed` decision works). ✔
  - **Not yet checked: an old (Week 12) pipa looks the same.** A new account has none; moved to W6.

### W6 — Mechanical pass and production check
- **Production, from outside (2026-11-08, after `af1d0e3`):** `/`, `/product`, `/about`, `/login`, `/privacidad` → 200; `/app`, `/app/pipa/nueva` without a session → 307 to `/login`; `pipa-clara.site` and `http://` → 308 to `https://www.pipa-clara.site`. Same as Week 12.
- **Security floor, from outside:** all six `pc_` tables, anonymous read → 401; **`pc_events` anonymous read and insert → 401 / `42501`**; bucket anonymous list → `[]`, public URL → 400. **Secrets:** no service-role/secret key in tracked files or git history (only the warning comment in `.env.example`, the only env file ever committed); the browser JS of the public pages (10 files, ~840 KB) contains only `NEXT_PUBLIC_SUPABASE_URL` and the publishable key, no JWTs; the one `sb_secret_` match is supabase-js checking a key's prefix (same as Week 12).
- **PACKET §13 mechanical list:**
  - `computeVerdict()` cases (no repeat = Week 12, spread 0 → 1 cm floor, spread 3 cm → triple, 80 L below inside the margin, couldn't-measure → no liters): unit tests ✔ (74 passing).
  - Event log: one row per action ✔ (founder's phone, W3/W4 acceptance); B can't read A's events ✔ and an unknown name is rejected ✔ (`w13-events-rls-test.sql` 13/13 in "semestre").
  - `PGRST303` retried once, then succeeds: unit tests ✔ (W1).
  - Sign-in with a Google account that was never a test user ✔ (W2).
  - Old (Week 12) pipa looks the same: **pending, founder.**
- **Bug found (W6): the return signal misses most returns.** `signed_in` is written only by `/auth/callback`, i.e. only when someone goes through the Google screen. Supabase sessions don't expire by default and `proxy.ts` keeps refreshing them, so **a tester who comes back days later on the same phone is already signed in and logs no `signed_in`**; marking payments days later logs nothing at all. `w13-return-signal.sql` would say "regresó: no" about exactly the person who came back: a false negative on Blueprint condition 4, the week's key evidence. My W3 design missed it; the founder's tests couldn't show it (every test started with a fresh sign-in).
- **Fix (founder's choice among three options): new event `app_opened`.** Rejected: reusing `signed_in` once a day (no migration, but the name would no longer mean "went through Google" in her evidence), and changing only the query (a return that only opens `/app` or marks payments would still leave nothing).
  - Migration `supabase/migrations/20261108150000_pc_events_app_opened.sql`: replaces only `pc_events_name_check` with the same list plus `'app_opened'`. Uses the exact constraint name, so a different name fails and changes nothing.
  - `/app` logs `app_opened` once per opening from the browser (`LogAppOpened`, same pattern and reason as `verdict_viewed`); it never blocks the page. After a Google sign-in both `signed_in` and `app_opened` are written; that is expected.
  - **This changes PACKET A1's fixed list of six names to seven.** Logged as a needed deviation: without it, A1's purpose ("a return visit is visible without asking anyone") fails. The privacy page already covers it ("cuándo entras").
  - `w13-return-signal.sql` now counts **days with any event** (`dias_con_visita`, "regresó: sí" at 2+), and keeps `dias_con_entrada_google` apart.
  - `w13-events-rls-test.sql`: +1 check (`app_opened` accepted) → 14 checks.
  - Verified in PGlite: the four migrations in order; `f3-rls-test.sql` 14/14; `w13-events-rls-test.sql` 14/14 (an unknown name is still rejected after the swap); 0 rows left. An organizer who signed in through Google once and came back already signed in on two more days → **3 days, 1 Google sign-in, regresó: sí** (the old query said "no"). Types, lint, 74 tests, build OK.
  - **Deploy order:** the migration must run before the push. The code wouldn't break without it, but every `app_opened` would be rejected and the visits lost.
  - **Migration run by the founder in "semestre" (2026-11-08): "Success".** From outside, `pc_events` is still locked (anonymous read and insert of `app_opened` → `401 / 42501`). The CHECK itself can't be seen from outside (visitors are refused before it applies), so **the proof that `app_opened` is accepted is pending:** `app_opened` rows after the deploy, and `w13-events-rls-test.sql` 14/14 with both accounts.
- **W6 fix verified in production (2026-11-08), founder:** opened `/app` on her phone while still signed in → a new **`app_opened`** row, no new `signed_in`. `w13-events-rls-test.sql` **14/14 PASA** with both accounts (incl. "A registra que abrió la app"), so the new CHECK is in.
- **Old pipa check (W4 acceptance) ✔:** a Week 12 pipa, opened with the original account, looks as before plus the range and the grey box ("Medida una vez…"), and the same 300 L margin.
- **PACKET §13 mechanical pass, all checked off:**
  - [x] `computeVerdict()`: no repeat = Week 12; spread 0 → 1 cm floor; spread 3 cm → triple margin; below the claim inside the margin → consistent + `belowClaimInsideMargin`; couldn't-measure → no liters (74 unit tests).
  - [x] Event log: each event writes one row (founder's phone); B can't read A's events and an unknown name is rejected (RLS test 14/14 in "semestre").
  - [x] `PGRST303`: simulated error retried once, then succeeds (unit tests, W1).
  - [x] Sign-in with a Google account that was never a test user (W2).
  - [x] Find at least one bug, fix it, redeploy, log it: **the return signal missed returning organizers who were still signed in**, fixed with `app_opened` and redeployed (`6af1cca`). Also caught before pushing: the Week 13 migration hadn't run (would have broken every pipa page).
  - [x] Security floor from outside: anonymous access to `pc_events` (read and insert) denied; no secrets in the repo, its history or the browser JS.
- **W6 accepted (2026-11-08).**

### Week 13 so far

- **Done and live:** W1 (PGRST303 retry), W2 (strangers can sign in, privacy page), W3 (event log + RLS), W4+W5 (repeat reading, margin, range, honest "inside the margin" message, pump question), W6 (mechanical pass + return-signal fix).
- **Cut, per the time budget and in its order:** the "spread ≥ 3 cm" warning text, and the range in the WhatsApp summary.
- **Deviations, each explained above:** privacy page (needed to publish Google sign-in); `verdict_viewed` / `app_opened` logged from the browser and `summary_sent` on the same tap; pump question as information, not an input; the "unos X L menos" line replaces the reason; seventh event name `app_opened`.
- **Not built, on purpose:** W7 waits for the five sessions (PACKET §10, Slice B).

### Persona-test fix (Week 13): "¿Cómo mido?"

- **Persona pass (PACKET §13, Layer 1), done by the founder:** Don Chuy (58, security guard, Iztapalapa, 6 families, distrusts apps, reads slowly). **Worst confusion, the one that would make him quit: measuring.** He doesn't know what tool to use, whether to measure from the top or from the bottom, or his cistern's size, and the pipero won't wait.
- **This is the Layer 1 persona fix, not W7 / Slice B.** W7 stays reserved for the #1 pain from the five real sessions, after the PACKET §14 addendum. A synthetic persona can't stand in for that ranking. If the real sessions show the same pain, this fix becomes the "before" to measure against.
- **Fix, the smallest one (founder's spec):** a short guide in plain Spanish, as one component `components/MeasureGuide.tsx`, using a native `<details>` that opens and closes without JavaScript:
  - **"¿Cómo mido?" at the start of "Nueva pipa":**
    - **what to use:** a stick or a tape measure, and a stick with marks every centimeter works;
    - **where:** the water height from the floor of the cistern; push the stick straight down to the floor, pull it out and see how high it got wet; always at the same spot;
    - **when:** before the hose goes in, and after it stops and the water is still.
  - **"¿Cómo mido mi cisterna?" next to the dimensions on the cistern form:**
    - measured **once, with time, not while the pipero waits**;
    - length and width inside, wall to wall, in meters;
    - max height from the floor to where water spills when full, in cm;
    - if you don't know a measurement, measure it before your first pipa.
- **"Open the first time" with no new data:** the "Nueva pipa" guide starts **open while the organizer has no pipas yet** (`getDeliveries().length === 0`, data the app already has), then starts closed but stays one tap away. The cistern form only appears once (before the first cistern), so its guide is always open. No `localStorage`, no new column, no migration.
- **Added the "wet mark" method** ("sácalo y mira hasta dónde se mojó"): "from the floor" alone doesn't tell someone with a stick where to read. It matches the existing hint "Mide desde el fondo".
- **Before / after (on-screen text):**
  - **Before:** "Nueva pipa" started straight with "1. La pipa"; the only measuring help was the hint "Mide desde el fondo. Máximo N cm." under the level. The cistern form showed "Largo (m)", "Ancho (m)" with no explanation, and only "Hasta dónde se puede llenar sin desbordarse." under the max height.
  - **After:** an open teal box "¿Cómo mido?" (what / where / when) under the "Nueva pipa" title on the first pipa, and an open box "¿Cómo mido mi cisterna?" right above the dimensions. Screenshots on the founder's phone (I can't sign in to take them).
- Checked: types, lint, 74 tests, build; no "robo / robó / te robaron".

### W7 — The #1 pain fix (Slice B), from the five real sessions

- **Addendum first, committed alone** (`b217d77`, `docs: packet addendum, #1 pain from real users`) as `## 15. Addendum: the #1 pain from real users` in `docs/PACKET.md`, before Appendix A. **Not "## 14." as the build prompt said:** the packet already has a §14 ("Blueprint conditions honored"); founder's choice. It holds: the five sessions (roles only), **strangers = sessions 1, 2, 4 and 5 (4 of 5)**, session 3 known to the founder; the relatives' unobserved use; the water-meter finding; the return signal; the pain ranking; the fix.
- **Pushback given before building, per the build prompt's W7 rule:**
  - The first fix description only moved "Pagos"; it **missed the half of #1 the sessions revealed** (the returning user couldn't get back to the WhatsApp summary). The founder's complete fix covers both halves.
  - Moving payments up was knowable before the sessions (a Week 12 question). Recorded in the addendum: the sessions changed *why* (for the 3 who organize or pay, collecting is the job), and the way back to the summary is the part that couldn't have been predicted.
  - **A finding that may contradict the premise, "3 of 5 already have a water meter on their cistern", was missing from the ranking.** Now in the addendum, with where the meter sits (city line vs. where the pipa unloads) marked as unknown, to ask next time. The fix doesn't address it.
  - **The return signal came from a relative, not an observed stranger.** Recorded as a weaker kind of independence.
- **The fix (founder's spec), no new data, no migration:**
  - **Verdict page:** the payments section moved from the bottom (under the challenges) to **right under "Cada hogar paga"**, with the heading **"¿Quién ya te pagó?"** and **"Toca cada hogar cuando te pague."** The privacy line stays. **"Ya pagaron: X de N" is now a link to `#pagos`.** The WhatsApp button follows the payments, in `#resumen`.
  - **`/app` list:** each pipa keeps its row (date, "Ya pagaron", verdict) and gains two buttons: **"Ver pagos"** (→ `#pagos`) and **"Mandar resumen"**, renamed **"Ver resumen"** after the "after" check (→ `#resumen`, the green WhatsApp button).
  - **Decision: the list's summary button jumps to the WhatsApp button; it doesn't open WhatsApp from the list.** Opening it directly would mean building every pipa's full summary (readings, shares, challenges) on the list page: more queries, not the smallest fix. Cost: one more tap. The returning user's problem was getting lost, not the tap.
  - **`ScrollToHash`** (tiny client component): the verdict streams in behind Suspense, so the browser's own jump to `#pagos` can happen before that part exists (the Week 12 `#pagos` lesson); it scrolls once the content is mounted. It also helps the existing `#desacuerdos` redirect after a challenge.
- **Correction, the real story of the "before" evidence:** my first entry said the "before" screenshots were captured before the push. **They weren't:** the founder had said so, then found she had missed them, and the fix was already live (`f0d4386`). No code was changed to get them back:
  - **Rolled production back with the Vercel CLI** (`vercel rollback`, instant, no rebuild, database untouched) to the `e227786` deployment (`pipa-clara-venture-hq0n0dri2…`, `dpl_CmXbA8T8…`). Confirmed from outside with `vercel inspect www.pipa-clara.site` before telling her it was live.
  - **The founder took the "before" evidence on her phone:** screenshot A (verdict on open: no payments in view; "Ya pagaron" a plain label), B (payments at the very bottom, under the challenges), C (`/app` list: one row per pipa, no actions), and the **timed task**, done by her (not a tester): from `/app`, mark Hogar 2 paid and open the WhatsApp summary.
  - **Promoted `f0d4386` back** (`vercel promote`, `pipa-clara-venture-8y7644z8j…`, `dpl_Dg8C8W7p…`); confirmed from outside the same way. While it was rolled back, nothing was pushed (a rollback pauses automatic production deploys; promoting turns them back on).
  - **Real data:** the "before" run marked Hogar 2 as paid in the shared database; she set it back to pending before the "after" run.
- **After (founder's phone, `f0d4386`):** screenshots A′, B′, C′ of the new layout; **"Ver pagos" lands on "¿Quién ya te pagó?" and the list buttons land where they should** (the `ScrollToHash` jump works in production). Same timed task, done by her.
- **Times for the same task (from `/app`, mark one household paid and open the WhatsApp summary), both done by the founder, not a tester:**
  - **Before (`e227786`): more than 60 s**, the founder's words "+60 seconds". **Estimated from memory, not timed.**
  - **After (`da0e62d`): about 30 s**, timed with a stopwatch, marking **Hogar 3** (Hogar 2 was used in the "before" run; same task, different household).
  - **Honest reading:** roughly half the time or better, but the "before" side is an estimate and the person doing it already knew the app. **It's a rough comparison, not a measurement.** The stronger evidence for the fix is behavioral: the returning user could not find the summary, and now both actions are on the `/app` list. Next real sessions: time a tester on the same task.
  - (Earlier messages had "[N]" / "XX" in place of the numbers; I left the times out until the founder gave them.)
- **Founder's finding from the "after" check, fixed:** the list button said **"Mandar resumen"** but only opens the pipa at the WhatsApp button; it sends nothing. **Renamed "Ver resumen"**, same place it lands. Rule: **the only button that says "Mandar" is the one that opens WhatsApp.** Checked: it's now the only "Mandar" on screen.
- Checked: types, lint, 74 tests, build.

## Tomorrow's first move (Week 13, sessions)

- **Run the five real-user sessions** (at least three strangers) at `www.pipa-clara.site`, one sheet each (PACKET §13): role and where found, stranger yes/no, story, tasks A–D with times, **the spread of the two "before" readings in cm**, 2–3 exact quotes, commitment. Consent first; roles, never names.
- **During each session, watch what I couldn't test:** the Google screen now says "Pipa Clara" (does anyone hesitate?); is "Mide otra vez" understood without help; is the "unos X L menos, dentro del margen" sentence understood read aloud; does the form survive the wait for the truck.
- **Kill-condition check:** if most spreads are ≥ 3 cm, the margin is hiding short loads; say it in the pain ranking, and consider bringing back the cut ≥ 3 cm warning.
- **Return signal:** run `supabase/checks/w13-return-signal.sql` a few days after the sessions; a tester counts as back at `dias_con_visita` ≥ 2.
- **Then W7:** write `## 14. Addendum` in `docs/PACKET.md` (the user quote + the pain ranking), commit `docs: packet addendum, #1 pain from real users`, and only then build the smallest fix, with before/after screenshot and timing.
