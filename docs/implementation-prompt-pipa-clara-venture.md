# Pipa Clara — Implementation Prompt for Claude Code

Paste everything below the line into Claude Code, inside the project folder, after `docs/` (CHARTER, PERSONAS, PACKET, mockup.png) has been committed.

---

You are building **Pipa Clara**, the Week 12 core build of my venture. Before writing any code, read `docs/CHARTER.md`, `docs/PERSONAS.md` and `docs/PACKET.md`. The packet is the spec; the charter is the referee for every scope decision. **Build only the core feature. No features beyond the packet's scope (section 9 lists what NOT to build).**

## How we work

- Build **one feature at a time**, in the order below. After each feature: run it, show me how to test it, wait for my OK, then commit with the message given.
- Explain every decision in plain language; I am learning, and this conversation is graded as my build transcript.
- Keep `docs/DECISIONS.md` updated: every decision, every bug found and fixed. At the end of each session add "Tomorrow's first move".
- Never put secrets in code. Supabase URL and anon key go in `.env.local` (git-ignored) and in Vercel environment variables. Never use the service-role key in the browser.
- UI language: **Spanish**. Code, comments and docs: English.
- Mobile-first, large readable text (primary user is 55 and uses WhatsApp, other apps only if simple). Follow the mockup in `docs/mockup.png`.
- Any example data is invented and labeled on screen "DATOS DE EJEMPLO".

## Stack

Next.js (App Router, TypeScript) + Tailwind + Supabase (Auth with Google, Postgres with RLS, private Storage bucket) + Vercel + GitHub. Use `@supabase/ssr` for auth. Free tier only.

## Features, acceptance criteria and commits

### F1 — Project skeleton and public pages
- Next.js + Tailwind app with pages `/` (home), `/product` (how it works: the flow in 4 steps), `/about` (the need, who pays, the 10:1 case — take the text from CHARTER and PACKET).
- Shared header with the Pipa Clara name/logo and a "Entrar" button.
- Deploy to Vercel and **connect the venture's real domain right away** (guide me step by step: Vercel → Domains, and the DNS records at my registrar). The real domain is the URL of record; if it doesn't load, the whole assignment scores 0, so it goes live on day one, not at the end.
- **Accept when:** all three pages load locally, on Vercel and on the real domain; text is in Spanish; looks good at 390 px wide.
- **Commit:** `feat: skeleton with home, product and about pages` (first deploy)

### F2 — Sign in with Google
- Supabase Auth with Google; `/app` is protected and redirects to sign-in if there is no session; sign-out button.
- Guide me through the Google OAuth client (Google Cloud Console) and the Supabase Auth settings, including redirect URLs for localhost, the Vercel URL and the real domain.
- **Accept when:** I can sign in with Google on localhost and on the real domain, land on `/app`, and sign out.
- **Commit:** `feat: Google sign-in and protected /app`

### F3 — Database, RLS and storage
- SQL migration file in `supabase/migrations/` with the five tables from PACKET section 10: `cisterns`, `deliveries`, `readings`, `shares`, `challenges`, each with `organizer_id uuid references auth.users default auth.uid()`.
- **RLS enabled on all five tables**, with select/insert/update/delete policies `organizer_id = auth.uid()`.
- Private storage bucket `readings` with policies so each organizer can only read/write files under her own `auth.uid()/` folder.
- Tell me exactly what to paste in the Supabase SQL editor and what to click.
- **Accept when:** a second Google account cannot see the first account's rows or photos (test it and show me how).
- **Commit:** `feat: schema with RLS on all tables and private photo bucket`

### F4 — The engine (pure functions + tests)
- `lib/verdict.ts` with `computeVerdict({ lengthM, widthM, maxHeightCm, beforeCm, afterCm, litersClaimed, pumpRan, overflowed })` returning `{ measuredLiters, toleranceLiters, verdict: 'consistent' | 'short' | 'couldnt_measure', reason }`.
  - measured = (after − before) × length × width × 10
  - tolerance = 4 × length × width × 10 (±2 cm per reading)
  - `couldnt_measure` if a reading is missing, pump ran, overflowed, or after ≥ max height; otherwise `consistent` if measured ≥ claimed − tolerance, else `short`.
- `lib/shares.ts` with `splitShares(totalMxn, households)` that splits equally in whole pesos and never loses or invents a peso (distribute the remainder one peso at a time).
- Unit tests (Vitest) for every case in PACKET section 13.
- **Accept when:** `npm test` passes and I can read each test and understand it.
- **Commit:** `feat: verdict and share engine with unit tests`

### F5 — Register the cistern
- In `/app`: if the organizer has no cistern, show a form: name, length (m), width (m), max height (cm), number of households (2–40), household labels (short text like "Depto 3", never full names).
- Validate every field (ranges from PACKET section 11) with clear Spanish messages.
- **Accept when:** the cistern is saved, shown on reload, and invalid input is rejected.
- **Commit:** `feat: cistern registration with validation`

### F6 — Record a delivery and get the verdict (the core)
- "Nueva pipa": liters claimed, price paid (MXN), fee per household (default MXN 2).
- BEFORE reading: level in cm + photo upload (JPG/PNG ≤ 5 MB) + checkbox "El pipero estuvo presente".
- AFTER reading: level in cm + photo, or checkboxes "La bomba al tinaco estuvo prendida" / "La cisterna se desbordó".
- On save: compute the verdict with F4, store delivery, readings (with timestamps), verdict and shares.
- Verdict screen like the mockup: claimed vs measured, verdict card (consistent / faltante / no se pudo medir) with the margin, both photo thumbnails with time, amount per household, "Ya pagaron: X de N".
- **Accept when:** I can record a full delivery on my phone, see the right verdict, and find it again after signing out and back in.
- **Commit:** `feat: record delivery with readings, photos and verdict`

### F7 — Shares, challenge and WhatsApp summary
- Organizer marks each household's share as paid / pending (only she sees which).
- "Registrar desacuerdo": who raises it (pipero / vecino / yo) + note ≤ 500 chars; shown under the verdict; challenges cannot be deleted.
- "Mandar resumen por WhatsApp": opens a `wa.me` link with the summary text: date, liters claimed vs measured, verdict, amount per household, "Ya pagaron: X de N" — **no names**.
- Delivery history list in `/app`.
- **Accept when:** the WhatsApp text opens correctly on my phone and contains no household names.
- **Commit:** `feat: payments, challenges and WhatsApp summary`

### F8 — Final check on the real domain
- Run the whole flow on the real domain from my phone; fix anything that only breaks in production.
- **Accept when:** sign-in and the full flow work on the real domain.
- **Commit:** `chore: production check` (final deploy)

## Time budget
I have two days. If we fall behind, cut in this order and log the cut in DECISIONS.md: delivery history list first, then the challenge screen polish. Never cut: the real domain, sign-in + RLS, the verdict engine, saving the delivery.

## When something breaks
Read the error, explain it in one or two sentences, propose the fix, and tell me how to verify it. Log it in `docs/DECISIONS.md`.
