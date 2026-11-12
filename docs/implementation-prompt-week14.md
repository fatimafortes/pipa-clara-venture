# Implementation prompt — Week 14 (Pricing)

Source: [`PACKET.md`](PACKET.md) (Week 14). Build in this order; one commit per feature; run `npm run lint`, `npm test` and `npm run build` before each push. Read `node_modules/next/dist/docs/` before touching routing (Next.js 16).

## Rules

- No database change, no new dependency, no secrets.
- Every number shown on `/pricing` and `/about` comes from `lib/pricing.ts`. No number typed twice.
- Every assumption shows its status: **medido**, **supuesto** or **analogía (sin validar)**.
- Simulated output carries the badge **SIMULACIÓN**. Never write "robo / robó / te robaron".
- Screens in Spanish, large text (the primary user is 55), no horizontal scroll at 360 px.

## F1 — `lib/pricing.ts` + tests (commit `feat: pricing assumptions and math in one place`)

- `ASSUMPTIONS`: per key, `{ value, unit, status, source }`. Families and Negocios defaults.
- Pure functions: `revenue()`, `costToServe()`, `valuePerDelivery()`, `ratios()`, `priceAt10to1()`, `detectability()`, `encodeScenario()` / `decodeScenario()` (clamped, unknown keys ignored), `defaultFeePerHousehold(households)` = `max(1, round(10 / households))`.
- **Accept:** PACKET §7 worked example (value $72.31, 7.2:1; 300 L margin; 110 L not detectable); value ≥ 0 when measuring > collecting; business has no time value; round trip of a scenario; clamping.

## F2 — `/pricing` page (commit `feat: /pricing with tiers, segments and the free-vs-paid line`)

- Tiers: **Vecinos** (gratis: reciben el resumen), **Familias** ($10 por pipa desde la primera, dentro de las partes), **Negocios** (precio = valor ÷ 10, se recalcula con las primeras 10 pipas medidas). Who uses, who pays, what it buys.
- Shadow clause box: paying never changes a verdict; margin and evidence always visible; disagreements never deleted; the fee never passes through the pipero; monthly transfer **no activo en el piloto**.
- Header link "Precios".

## F3 — Simulator + saved scenarios (commit `feat: revenue simulator with saved scenarios`)

- Client component; segment tabs; inputs grouped (Mercado, Precio y costo, Valor, Medición), each with its status tag.
- Outputs: monthly/annual revenue, cost to serve, margin, value per delivery, ratio for the group and for each household, price at 10:1, detectability warning.
- Save: name (max 40) → `localStorage` list (try/catch; message if unavailable); load and delete. "Copiar enlace" writes the inputs to the URL; on mount, read `window.location.search` and restore.
- **Accept:** works on phone; reload keeps saved list; shared link restores in a private window.

## F4 — 10:1 memo on `/about` + conversation log (commit `feat: 10:1 memo and pricing conversation log`)

- `/about` replaces the old "caso 10 a 1" with the memo: today (notebook + cash, no measurement) vs Pipa Clara, same task (one delivery) and period; money, time, risk; measured vs assumed table; ratio per payer; what would make it true; main risk (shortfall unproven).
- `lib/pricing-conversations.ts`: entries `{ role, segment, date, question, priceAsked, answer, states }`, states separate (preguntó / dijo que sí / aprobó por escrito / pagó / renovó / dijo que no). First entry: the fonda, pending, with the exact question.

## F5 — Delivery form default (commit `feat: delivery fee defaults to $10 per pipa`)

- `DeliveryForm` receives `households`; default fee = `defaultFeePerHousehold(households)`; label "Cuota de Pipa Clara por hogar ($)" with hint "$10 por pipa repartido entre N hogares".

## Session close

Update `DECISIONS.md` (decisions, deviations, tomorrow's first move), commit, push. Deploy 1 after F3, deploy 2 after F5 + mechanical-pass fix.
