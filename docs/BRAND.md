# Pipa Clara — Brand

Voice and look for the app, the site and every content piece. Source: `docs/PACKET.md` §3.3–3.4 (Week 15). Tokens live in `app/globals.css`; if they change there, change them here.

## Voice: a neighbor who explains, not a company that sells

1. **Tú**, short sentences, everyday words. "Ya no pongas dinero de tu bolsa", not "Optimiza la recaudación".
2. **Numbers carry their label:** *medido*, *ejemplo* or *aún no verificado*. If a claim isn't in the claims register (`docs/PACKET.md` §3.2), it doesn't ship.
3. **Never blame the pipero, never expose a household.** No names, no faces, no plates. A difference is *evidencia, no sentencia*.
4. **No pressure:** no countdowns, no "últimos lugares", no invented waiting lists or counts.

### Words we use / avoid

| Use | Avoid |
|---|---|
| encargada, quien organiza | administradora, cliente |
| dar su parte, juntar | deuda, moroso, deudor |
| "5 de 6 ya dieron su parte" | "Casa 4 no ha pagado" (in anything the group sees) |
| faltante, diferencia, evidencia | robo, trampa, fraude |
| "Hoy no cobramos en el piloto" | "¡Gratis por tiempo limitado!" |

## Visual system

| Token | Value | Use |
|---|---|---|
| Teal | `#12707a` · dark `#0c565e` · soft `#e2f0f1` | Actions, headings, the brand |
| Amber | `#b45f06` · soft `#fdf3e3` | Warnings, "faltante", labels like **DATOS DE EJEMPLO** / **DEMO** |
| WhatsApp green | `#1f9150` | Only for WhatsApp buttons |
| Ink | `#16272b` | Text |
| Muted | `#55666a` | Secondary text |
| Line | `#dbe5e7` | Borders, disabled buttons |
| Page | `#f2f6f7` | Background |

- **Type:** Inter, base size 112.5% (18 px). Large and readable: Rosa is 55 and reads on her phone.
- **Shapes:** rounded cards, flat (no shadows, no gradients), one idea per card. Same in content pieces.
- **Logo:** water drop (`app/icon.svg`, `components/Logo.tsx`) + "Pipa Clara" in teal, bold.
- **Example data** always carries the amber badge (`components/ExampleBadge.tsx`).

## Content pieces

- Show the product (a real screen or `/demo`), not stock photos.
- No real faces, plates, names or addresses. Household labels like "Casa 4" only, and never next to "debe".
- Every piece goes through the six roles and the founder's approval: `docs/content/`.
