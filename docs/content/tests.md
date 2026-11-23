# Tests with real people

Real results only. **Zero responses is valid evidence and gets written as 0.** Roles, never names.

## Test 1 · A1 → the real encargada

Test 1 — A1 sent to the real encargada with the /demo screenshot.

- **Date:** 2026-11-22
- **Who (role only):** la encargada (A, n=1)
- **Piece shown:** A1 [`A1/final.md`](A1/final.md) (v1) + the /demo screenshot
- **Q1:** "¿Qué haces si se acaba el agua y falta una casa?"
  - **A:** "Pues la verdad, trato de repartir lo que queda para que alcance para todos, pero si ya se acabó, esa casa se queda sin agua hasta que vuelva a llegar otra pipa. A veces se enojan porque sienten que les tocó menos, pero yo trato de repartir lo más parejo posible. No siempre es fácil porque cada familia consume diferente y uno tampoco puede estar midiendo exactamente cuánto le toca a cada quien."
- **Q2:** "Si ya se acabó el agua y una casa todavía no te ha dado su parte, ¿pides la pipa poniendo tú lo que falta, o esperan a que pague?"
  - **A:** "Pues depende de cuánto falte. Si es poquito, a veces sí lo pongo yo para que no nos quedemos sin agua, porque al final todos la necesitamos. Pero sí me da coraje tener que estar poniendo de mi dinero y luego andar cobrando. Si falta mucho, sí prefiero esperar a que paguen, porque tampoco puedo estar pagando por todos."
- **Q3:** "¿Se lo mandarías a tu grupo? ¿Qué le cambiarías?"
  - **A:** "Sí, sí se los mandaría, sobre todo porque yo soy la que anda cobrando y organizando todo. Está bien que diga que la aplicación te ayuda a saber quién ya pagó, pero yo cambiaría un poquito la parte de 'tú pides la pipa cuando todos dieron su parte', porque si nos esperamos a que todos paguen, a veces nos quedamos sin agua. Preferiría que dijera que te ayuda a organizar los pagos y saber quién falta, aunque ya hayas pedido la pipa. También pondría más claro cómo funciona, porque no todos saben usar aplicaciones y algunos vecinos preferirían seguir pagando en efectivo."

**Findings:**
- She would forward A1 (yes).
- "Pays from her own pocket" is now A, n=1 (was C, n=0): she covers small shortfalls and resents chasing the money afterwards; for large shortfalls she waits.
- The 100% rule as a hard block does not fit her: when water runs out she orders anyway if the gap is small. The simulated Rosa raised the same risk; now a real encargada confirms it.
- New finding, not built: fairness of how the water is shared inside a shared cistern.

**Compared with today's way (WhatsApp + cash):** She would forward A1 and use it alongside cash, not instead of it: neighbors keep paying her in cash. She did not say she prefers her current way, but the hard 100% block does not fit how she works today (she orders anyway when the gap is small). Not measured on time or errors yet.

**What I change because of it:** A1 v2 ([`A1/final-v2.md`](A1/final-v2.md)), and "Pedir de todos modos" as Week 16 #1 (`docs/DECISIONS.md`).

## Test 2 · Venture page → 9 people from my sample

Venture page with opt-in shared by WhatsApp with 9 people (5 school-sample buyers + 4 vecindad neighbors) on 2026-11-22 at 15:14. Result at 23:25 the same day: 4 opt-ins in pc_optins (4 of 9). Window: about 8 hours, shorter than the 72 h first planned. Friends and acquaintances, so opt-ins show interest, not validation (Blueprint C6).

- **Sent on (date and time):** 2026-11-22, 15:14
- **Read after 72 h on (date and time):** 2026-11-22, 23:25 (about 8 h, not 72 h)
- **Message sent (exactly):**

| # | Group (buyer / vecindad neighbor) | Sent | Opened the page? (if known) | Opted in? | Comment (exact words, if any) |
|---|---|---|---|---|---|
| 1 | buyer |  |  |  |  |
| 2 | buyer |  |  |  |  |
| 3 | buyer |  |  |  |  |
| 4 | buyer |  |  |  |  |
| 5 | buyer |  |  |  |  |
| 6 | vecindad neighbor |  |  |  |  |
| 7 | vecindad neighbor |  |  |  |  |
| 8 | vecindad neighbor |  |  |  |  |
| 9 | vecindad neighbor |  |  |  |  |

- **Opt-ins counted in `pc_optins` after 72 h:** 4 (at 23:25, about 8 h) <!-- count in the Supabase table editor; friends' opt-ins don't count as validation (Blueprint condition 6) -->
- **Total: 4 of 9**

## Persona pass (separate chat, from phone screenshots)

- **Persona:** Rosa (`docs/PERSONAS.md`)
- **Did she understand "Listo para pedir"?**
- **Would she send the progress message to her group?**
- **Every confusion:**
- **Worst one, and the fix:**
