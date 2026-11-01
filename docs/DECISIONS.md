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
