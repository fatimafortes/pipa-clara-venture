import { describe, expect, it } from "vitest";
import { buildSummary, whatsappLink, type SummaryInput } from "./summary";
import { computeVerdict, insideMarginNote } from "./verdict";

// The mockup example: 12 households, 7 paid, 1,300 L short, full price paid
const mockup: SummaryInput = {
  deliveredAt: "2026-10-25T14:41:00Z",
  litersClaimed: 10_000,
  measuredLiters: 8_700,
  verdict: "short",
  toleranceLiters: 300,
  before: { takenAt: "2026-10-25T14:02:00Z", hasPhoto: true }, // 08:02 in Mexico City
  after: { takenAt: "2026-10-25T14:41:00Z", hasPhoto: true }, // 08:41 in Mexico City
  driverPresent: true,
  priceMxn: 1_800,
  paidMxn: 1_800,
  feeMxn: 2,
  shareAmounts: Array(12).fill(152),
  paidCount: 7,
  challenges: [],
};

describe("buildSummary", () => {
  it("has the date, claimed vs measured, the verdict, the share and the paid count", () => {
    const text = buildSummary(mockup);
    expect(text).toContain("Pipa del 25 de octubre");
    expect(text).toContain("Litros que dijo el pipero: 10,000 L");
    expect(text).toContain("Litros que entraron (medidos): 8,700 L");
    expect(text).toContain("FALTANTE de 1,300 L");
    expect(text).toContain("Cada hogar paga: $152");
    expect(text).toContain("Ya pagaron: 7 de 12");
  });

  it("says the margin in words, not '±300 L' (persona test)", () => {
    const text = buildSummary(mockup);
    expect(text).toContain("margen de medición de 300 litros");
    expect(text).not.toContain("±");
  });

  it("shows the time of BOTH readings, in Mexico City time (persona test)", () => {
    const text = buildSummary(mockup);
    expect(text).toContain("Lectura de antes: 08:02, con el pipero presente, con foto guardada");
    expect(text).toContain("Lectura de después: 08:41, con foto guardada");
  });

  it("short but full price paid: says so, so the verdict isn't silently ignored", () => {
    expect(buildSummary(mockup)).toContain(
      "Se le pagó al pipero el precio completo, $1,800, aunque faltaron 1,300 L.",
    );
  });

  it("short and paid what entered: says how much, of how much, and why", () => {
    const text = buildSummary({ ...mockup, paidMxn: 1_566, shareAmounts: [...Array(6).fill(133), ...Array(6).fill(132)] });
    expect(text).toContain(
      "Se le pagó al pipero $1,566 de los $1,800 que pedía: lo que vale el agua que sí entró (8,700 L de 10,000 L).",
    );
    expect(text).toContain("Cada hogar paga: $132 o $133");
    expect(text).toContain("(pipa $1,566 + cuota de Pipa Clara $24");
  });

  it("short and another amount agreed: says the shortfall and what the water was worth", () => {
    expect(buildSummary({ ...mockup, paidMxn: 1_600 })).toContain(
      "Se le pagó al pipero $1,600 de los $1,800 que pedía: por el faltante de 1,300 L (lo que sí entró vale $1,566).",
    );
  });

  it("includes what each challenge says, one line each (persona test)", () => {
    const text = buildSummary({
      ...mockup,
      challenges: [
        { raisedBy: "driver", note: "La cinta estaba chueca" },
        { raisedBy: "neighbor", note: "La bomba se prendió sola" },
      ],
    });
    expect(text).toContain('- El pipero: "La cinta estaba chueca"');
    expect(text).toContain('- Un vecino: "La bomba se prendió sola"');
  });

  it("never contains household labels (CHARTER principle 3)", () => {
    const text = buildSummary(mockup);
    for (const label of ["Depto", "Hogar", "Casa"]) {
      expect(text).not.toContain(label);
    }
  });

  it("says 'no se pudo medir' instead of a number when it couldn't be measured", () => {
    const text = buildSummary({ ...mockup, verdict: "couldnt_measure", measuredLiters: null, after: null });
    expect(text).toContain("Litros que entraron (medidos): no se pudo medir");
    expect(text).toContain("NO SE PUDO MEDIR");
    expect(text).not.toContain("FALTANTE");
    expect(text).not.toContain("Lectura de después");
  });
});

// Week 13 mockup: 3 × 2.5 m, before read twice (41 and 42 cm), after 173 cm → 9,900 of 10,000 L
const week13Verdict = computeVerdict({
  lengthM: 3, widthM: 2.5, maxHeightCm: 300, beforeCm: 41, beforeRepeatCm: 42, afterCm: 173,
  litersClaimed: 10_000, pumpRan: false, overflowed: false,
});
const week13: SummaryInput = {
  ...mockup,
  measuredLiters: week13Verdict.measuredLiters,
  verdict: week13Verdict.verdict,
  toleranceLiters: week13Verdict.toleranceLiters,
  insideMarginNote: insideMarginNote(week13Verdict, 10_000),
};

describe("buildSummary with the Week 13 precision check", () => {
  it("consistent below the claim: the margin from the repeat (150 L) and the 'unos X L menos' sentence", () => {
    const text = buildSummary(week13);
    expect(text).toContain("Veredicto: CONSISTENTE (margen de medición de 150 litros)");
    expect(text).toContain(
      "Entraron unos 100 L menos de lo que dijo el pipero, dentro del margen de medición de 150 litros.",
    );
  });

  it("no sentence when there is nothing to say (measured once, at the claim)", () => {
    const text = buildSummary({ ...mockup, verdict: "consistent", measuredLiters: 10_000 });
    expect(text).not.toContain("menos de lo que dijo");
  });

  it("the sentence never appears on a short or couldn't-measure verdict, even if passed", () => {
    for (const verdict of ["short", "couldnt_measure"] as const) {
      expect(buildSummary({ ...week13, verdict })).not.toContain("dentro del margen de medición de 150 litros.");
    }
  });

  it("still never contains household labels", () => {
    const text = buildSummary(week13);
    for (const label of ["Depto", "Hogar", "Casa"]) expect(text).not.toContain(label);
  });

  it("never accuses: no 'robo', 'robó' or 'te robaron', for any verdict", () => {
    for (const input of [
      mockup,
      week13,
      { ...mockup, verdict: "couldnt_measure" as const, measuredLiters: null },
      { ...mockup, paidMxn: 1_566 },
    ]) {
      expect(buildSummary(input)).not.toMatch(/rob[oó]|te robaron/i);
    }
  });
});

describe("whatsappLink", () => {
  it("opens WhatsApp with the text encoded in the link", () => {
    const link = whatsappLink("Ya pagaron: 7 de 12\nCada hogar paga: $152");
    expect(link.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toBe("Ya pagaron: 7 de 12\nCada hogar paga: $152");
  });
});
