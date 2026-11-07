# Pipa Clara — Implementation Prompt, Week 13 (Real Humans)

Paste everything below the line into your coding agent, inside the project folder, **after** `docs/PACKET.md` and `docs/mockup-week13.png` are committed (`docs: week 13 packet before any code`).

---

You are continuing **Pipa Clara**, my venture. Week 12 is finished and live at **https://www.pipa-clara.site**. This week I put it in front of five real people, so the work is small and careful, not big.

Before writing any code, read in this order: `docs/PACKET.md` (this week's spec), `docs/DECISIONS.md` (everything that happened in Week 12, including the bugs and the open risks), `docs/CHARTER.md` (the referee for scope), `AGENTS.md` (this Next.js version has breaking changes: read the bundled docs in `node_modules/next/dist/docs/` before touching routing, caching or Server Actions). **Build only what PACKET section 6 lists. Section 10 lists what NOT to build.**

## How we work (same rules as Week 12)

- One feature at a time, in the order below. After each one: run lint, types, tests and build; tell me exactly how to test it on my phone; wait for my OK; then commit with the given message and push (every push to `main` deploys to production).
- Explain decisions in plain language; this conversation is graded as my build transcript.
- Keep `docs/DECISIONS.md` updated under a new heading `## Week 13`: every decision, bug and fix. End each session with "Tomorrow's first move".
- UI in **Spanish**; code, comments and docs in English. Mobile-first, large text (Rosa is 55).
- **Don't break what works.** The Supabase project "semestre" is shared with other apps: migrations only create or add to `pc_` objects, never drop or alter anything without the prefix. Table names come from `lib/supabase/names.ts`.
- **Deploy order:** a migration that adds a column the new code reads must run in Supabase **before** the push (Week 12 lesson with `paid_mxn`). Remind me every time.
- Keep the Week 12 patterns: verify every save by asking for the saved row; show errors next to the button; log successes and failures on the server.
- Any example data is invented and labeled "DATOS DE EJEMPLO". Never store real names; household labels stay like "Depto 3".

## Features, acceptance criteria and commits

### W1 — Retry once on `PGRST303` (open risk from Week 12)
- In `lib/data.ts` (or one shared helper used by every query), when Supabase answers `PGRST303` ("JWT issued at future"), wait ~1 s and retry **once**. Log `[retry PGRST303] <query name> ok|failed`.
- Unit-test the helper with a fake query that fails once with `PGRST303` and then succeeds, and one that fails twice (must give up and return the error).
- **Accept when:** tests pass, nothing else changes, and a normal sign-in on the real domain still lands on `/app`.
- **Commit:** `fix: retry once when the session token is a second ahead (PGRST303)`

### W2 — Strangers can sign in (PACKET A5)
- No code unless needed. Guide me step by step in Google Auth Platform: check which scopes the shared OAuth client uses (must be only `openid`, `email`, `profile`), and publish the app ("In production"). Explain what changes for the other "semestre" apps and what the "unverified app" screen looks like, if it appears.
- If publishing isn't possible, fall back to adding each tester's email under Test users before the session, and log that decision.
- **Accept when:** a Google account that was never a test user signs in on `www.pipa-clara.site` and lands on `/app`. Log the result in DECISIONS.md.
- **Commit:** `docs: open sign-in to real testers` (DECISIONS only)

### W3 — Event log `pc_events` (PACKET A1)
- Migration `supabase/migrations/<timestamp>_pc_week13.sql` (only `pc_` objects, wrapped in `begin … commit`):
  - Table `pc_events`: `id uuid pk`, `organizer_id uuid not null default auth.uid() references auth.users on delete cascade`, `name text not null check (name in ('signed_in','cistern_created','delivery_saved','verdict_viewed','summary_sent','challenge_saved'))`, `delivery_id uuid null references pc_deliveries on delete cascade`, `created_at timestamptz not null default now()`. Index on `(organizer_id, created_at)`.
  - RLS on; policies **select and insert only**, `organizer_id = (select auth.uid())`; insert also checks that `delivery_id`, if given, belongs to the same organizer. No update/delete policy. Revoke all from `anon`; grant select/insert to `authenticated`.
- `lib/events.ts` → `logEvent(name, deliveryId?)`, server-only. **Never blocks or breaks the user's action:** if the insert fails, log it and continue. No free text, no IP, no user agent, no device data.
- Call it at: sign-in callback (`signed_in`), cistern saved, delivery saved, verdict page opened, WhatsApp summary button pressed (`summary_sent`, via a small Server Action or route the button calls before opening `wa.me`), challenge saved.
- Add event checks to `supabase/checks/f3-rls-test.sql` (or a new `w13-events-rls-test.sql`): B can't read A's events; B can't insert an event with A's `delivery_id`; nobody can update or delete events; an unknown name is rejected. Prints PASA/FALLA and rolls back.
- Add `supabase/checks/w13-return-signal.sql`: read-only query I run in the SQL editor that lists, per organizer id (no emails), the number of distinct days with `signed_in` and the first/last date. This is my evidence for Blueprint condition 4.
- **Accept when:** I do a full flow on my phone and see one row per action in `pc_events`; the RLS test is all PASA with both of my accounts; a failed event insert doesn't stop the save.
- **Commit:** `feat: event log with RLS for sessions and return visits`

### W4 — Precision check and margin from real error (PACKET A2, section 7)
- Migration (can be the same file as W3 if not yet run, otherwise a new one): `pc_readings.repeat_level_cm numeric(6,1) null check (repeat_level_cm between 0 and 2000)`.
- `lib/verdict.ts`: add optional `beforeRepeatCm: number | null`.
  - `errorCm = beforeRepeatCm == null ? 2 : max(1, |beforeCm − beforeRepeatCm|)`
  - `toleranceLiters = round(2 × errorCm × litersPerCm)`
  - New outputs: `errorCm`, `measuredRange: { low, high } | null` (measured ± tolerance, low never below 0), `belowClaimInsideMargin: boolean` (measured < claimed and verdict consistent).
  - Without a repeat reading, results must be **identical** to Week 12 (existing tests keep passing unchanged).
- Tests: the PACKET section 13 cases (no repeat = Week 12; spread 0 → 1 cm floor; spread 3 cm → triple margin; 3 × 2.5 m with 41/42 cm → 150 L; below the claim inside the margin → consistent + flag; couldn't-measure cases still give no liters and no range).
- Delivery form, section "Antes": after the level field, an optional block **"Mide otra vez (recomendado)"**: "Saca la regla, vuelve a meterla en el mismo lugar y anota el nivel otra vez." Same validation as the other levels (0 – max height). Save it in `repeat_level_cm` of the before reading.
- **Important:** the verdict page recomputes the verdict from the saved readings. It must pass `beforeRepeatCm` too, or the margin on screen won't match the saved verdict. Same for the WhatsApp summary.
- **Accept when:** on my phone, a delivery with readings 41/42 cm on a 3 × 2.5 m cistern shows a 150 L margin; without the second reading it shows 300 L as before; old deliveries look exactly the same.
- **Commit:** `feat: repeat reading turns real precision into the margin`

### W5 — Honest uncertainty messages (PACKET A3, mockup-week13.png)
- Verdict page, following `docs/mockup-week13.png`:
  - Under "Litros que entraron (medidos)": the range, "entre 9,750 y 10,050 L" (not shown when it couldn't be measured).
  - Consistent and `belowClaimInsideMargin`: second line "Entraron unos X L menos de lo que dijo el pipero, dentro del margen de medición de Y litros." X rounded to the nearest 10.
  - Grey box: "Precisión de tu medición: medida dos veces, diferencia de N cm" or, without a repeat, "Medida una vez: usamos un margen de 2 cm por lectura. Medir dos veces lo hace más preciso."
  - If the spread is ≥ 3 cm, the box says "Tu medición varió N cm: el margen es más amplio. Mide en el mismo punto y con el agua quieta."
- Delivery form: **before** the "Antes" section, a question "¿Apagaste la bomba que sube el agua al tinaco?" with a short note: "Si está prendida, el resultado dirá 'no se pudo medir'." This only informs; the existing "La bomba al tinaco estuvo prendida" checkbox still decides the verdict.
- WhatsApp summary: include the range and, when it applies, the "unos X L menos, dentro del margen" sentence; still no household names (keep the existing test that checks for them).
- Never use the words "robo", "robó" or "te robaron" anywhere; add a test on the summary and the reason text.
- **Accept when:** the three verdicts look right on my phone at 390 px, the new texts are understandable read aloud, and summary tests pass.
- **Commit:** `feat: show the measured range and say when a small difference is inside the margin`

### W6 — Mechanical test pass and production check
- Run the PACKET section 13 mechanical list on `www.pipa-clara.site` with me. Find at least one bug, fix it, redeploy, log it.
- Re-check the security floor from outside (anonymous access to `pc_events` → denied; no secrets in the repo or the browser JS).
- **Accept when:** everything in section 13's mechanical pass is checked off in DECISIONS.md.
- **Commit:** `chore: week 13 production check` (this is my second deploy at minimum; there will be more)

### W7 — The #1 pain fix (Slice B), **not now**
- Do **not** build anything for this until I come back with the sessions. When I do, I will add `## 14. Addendum` to `docs/PACKET.md` with the user quote and the pain ranking. First commit that addendum (`docs: packet addendum, #1 pain from real users`), then help me build the smallest fix, with before/after evidence: a screenshot and the same task timed before and after.
- If the fix I propose is something I already knew how to fix before the sessions, or ignores a finding that contradicted my prediction, push back.

## Time budget
If we fall behind, cut in this order and log it: the spread ≥ 3 cm warning text, then the range in the WhatsApp summary. **Never cut:** the real domain loading, W2 (strangers can sign in), W3 (event log), W4's margin math, and W7.

## When something breaks
Read the error, explain it in one or two sentences, propose the fix, and tell me how to verify it. If I send a screenshot, read it first. Log it in `docs/DECISIONS.md`.
