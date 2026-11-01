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
- **"DATOS DE EJEMPLO"** badge (`components/ExampleBadge.tsx`) on every block with invented numbers (home example, the 10:1 case).
- **The 10:1 case** is not spelled out in CHARTER or PACKET; derived from the packet's own example: 1,300 L short of a 10,000 L / $1,800 load = $234 paid for water that never arrived, vs. a $24 fee (12 × $2) → ≈ 10 measured deliveries. **To confirm with the founder.**
- **Persona quote on `/about`** is labeled as a composite persona with an invented name, not presented as a real testimonial.
- **`npm audit` warnings** (minimatch via ESLint) affect dev tooling only, never shipped to the browser; the suggested `--force` fix would downgrade ESLint and break linting. Left as is.
- Removed template assets (Next/Vercel SVGs, `favicon.ico`); favicon is now `app/icon.svg` (water drop).
- Verified: `npm run lint` clean, `npm run build` prerenders `/`, `/product`, `/about`, `/app` as static pages. Founder checked the pages in the browser.
