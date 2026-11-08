import { describe, expect, it } from "vitest";
import { computeVerdict, insideMarginNote, precisionNote, type VerdictInput } from "./verdict";

// PACKET §13 cases. Unless a test says otherwise: a 2 × 2 m cistern, so
// 1 cm of level = 40 L and the margin is ±160 L (4 cm × 40 L).
const base: VerdictInput = {
  lengthM: 2,
  widthM: 2,
  maxHeightCm: 300,
  beforeCm: 20,
  afterCm: 270, // 250 cm × 40 L = 10,000 L
  litersClaimed: 10_000,
  pumpRan: false,
  overflowed: false,
};

describe("computeVerdict", () => {
  it("exact match → consistent", () => {
    const result = computeVerdict(base);
    expect(result.verdict).toBe("consistent");
    expect(result.measuredLiters).toBe(10_000);
    expect(result.toleranceLiters).toBe(160);
  });

  it("1,000 L short on a 2 × 2 m cistern → short", () => {
    // 225 cm × 40 L = 9,000 L, 1,000 L below the claim, far past the ±160 L margin
    const result = computeVerdict({ ...base, afterCm: 245 });
    expect(result.verdict).toBe("short");
    expect(result.measuredLiters).toBe(9_000);
  });

  it("120 L short, within the ±160 L margin → consistent", () => {
    // 247 cm × 40 L = 9,880 L
    const result = computeVerdict({ ...base, afterCm: 267 });
    expect(result.verdict).toBe("consistent");
    expect(result.measuredLiters).toBe(9_880);
  });

  it("exactly 160 L short, right on the margin → consistent", () => {
    // 246 cm × 40 L = 9,840 L = 10,000 − 160
    const result = computeVerdict({ ...base, afterCm: 266 });
    expect(result.verdict).toBe("consistent");
  });

  it("200 L short, just past the margin → short", () => {
    // 245 cm × 40 L = 9,800 L
    const result = computeVerdict({ ...base, afterCm: 265 });
    expect(result.verdict).toBe("short");
  });

  it("missing 'after' reading → couldn't measure, and no measured number", () => {
    const result = computeVerdict({ ...base, afterCm: null });
    expect(result.verdict).toBe("couldnt_measure");
    expect(result.measuredLiters).toBeNull();
  });

  it("missing 'before' reading → couldn't measure", () => {
    const result = computeVerdict({ ...base, beforeCm: null });
    expect(result.verdict).toBe("couldnt_measure");
  });

  it("pump to the tinaco ran → couldn't measure, even if the numbers look fine", () => {
    const result = computeVerdict({ ...base, pumpRan: true });
    expect(result.verdict).toBe("couldnt_measure");
    expect(result.measuredLiters).toBeNull();
  });

  it("cistern overflowed → couldn't measure", () => {
    const result = computeVerdict({ ...base, overflowed: true });
    expect(result.verdict).toBe("couldnt_measure");
  });

  it("after level above max height → couldn't measure", () => {
    const result = computeVerdict({ ...base, afterCm: 310 });
    expect(result.verdict).toBe("couldnt_measure");
  });

  it("after level exactly at max height → couldn't measure (it may have spilled)", () => {
    const result = computeVerdict({ ...base, afterCm: 300 });
    expect(result.verdict).toBe("couldnt_measure");
  });

  it("level went down → short, never a negative 'consistent'", () => {
    const result = computeVerdict({ ...base, afterCm: 10 });
    expect(result.verdict).toBe("short");
    expect(result.measuredLiters).toBe(-400);
  });

  it("the mockup example: 3 × 2.5 m, 10,000 L claimed, 8,700 L measured → short, ±300 L", () => {
    // 3 × 2.5 m = 75 L per cm; from 26 cm to 142 cm = 116 cm × 75 L = 8,700 L
    const result = computeVerdict({
      ...base,
      lengthM: 3,
      widthM: 2.5,
      beforeCm: 26,
      afterCm: 142,
    });
    expect(result.measuredLiters).toBe(8_700);
    expect(result.toleranceLiters).toBe(300);
    expect(result.verdict).toBe("short");
    expect(result.reason).toBe(
      "Entraron menos litros de los que dijo el pipero, más allá del margen de medición de 300 litros.",
    );
  });

  it("decimal dimensions don't leave floating-point crumbs in the liters", () => {
    // 1.1 × 1.1 m: 0.1 + 0.2-style float errors must not reach the screen
    const result = computeVerdict({
      ...base,
      lengthM: 1.1,
      widthM: 1.1,
      beforeCm: 10,
      afterCm: 110,
      litersClaimed: 1_210,
    });
    expect(Number.isInteger(result.measuredLiters)).toBe(true);
    expect(result.measuredLiters).toBe(1_210);
  });
});

// Week 13 precision check (PACKET §7, §13). The mockup cistern: 3 × 2.5 m = 75 L per cm.
const mockup: VerdictInput = { ...base, lengthM: 3, widthM: 2.5, beforeCm: 41, afterCm: 174 };

describe("computeVerdict with a repeated 'before' reading", () => {
  it("no repeat → exactly Week 12: 2 cm per reading, same margin, same reason", () => {
    const week12 = computeVerdict(base);
    expect(week12.errorCm).toBe(2);
    expect(week12.spreadCm).toBeNull();
    expect(week12.toleranceLiters).toBe(160);
    expect(computeVerdict({ ...base, beforeRepeatCm: null })).toEqual(week12);
  });

  it("3 × 2.5 m with 41 and 42 cm → 1 cm error → 150 L margin (Week 12: 300 L)", () => {
    const result = computeVerdict({ ...mockup, beforeRepeatCm: 42 });
    expect(result.spreadCm).toBe(1);
    expect(result.errorCm).toBe(1);
    expect(result.toleranceLiters).toBe(150);
    expect(computeVerdict(mockup).toleranceLiters).toBe(300);
  });

  it("spread 0 → the 1 cm floor, never an impossible zero margin", () => {
    const result = computeVerdict({ ...mockup, beforeRepeatCm: 41 });
    expect(result.spreadCm).toBe(0);
    expect(result.errorCm).toBe(1);
    expect(result.toleranceLiters).toBe(150);
  });

  it("spread 3 cm → the margin triples (40 and 43 cm → 450 L)", () => {
    const result = computeVerdict({ ...mockup, beforeCm: 40, beforeRepeatCm: 43 });
    expect(result.errorCm).toBe(3);
    expect(result.toleranceLiters).toBe(450);
    expect(result.toleranceLiters).toBe(3 * computeVerdict({ ...mockup, beforeRepeatCm: 42 }).toleranceLiters);
  });

  it("decimal readings don't leave float crumbs in the spread (41 and 42.3 → 1.3 cm)", () => {
    const result = computeVerdict({ ...mockup, beforeRepeatCm: 42.3 });
    expect(result.spreadCm).toBe(1.3);
    expect(result.toleranceLiters).toBe(195);
  });

  it("the mockup: 9,900 of 10,000 L, margin 150 L → consistent, inside the margin, range 9,750–10,050", () => {
    // 41 → 173 cm = 132 cm × 75 L = 9,900 L
    const result = computeVerdict({ ...mockup, afterCm: 173, beforeRepeatCm: 42 });
    expect(result.measuredLiters).toBe(9_900);
    expect(result.verdict).toBe("consistent");
    expect(result.belowClaimInsideMargin).toBe(true);
    expect(result.measuredRange).toEqual({ low: 9_750, high: 10_050 });
    expect(insideMarginNote(result, 10_000)).toBe(
      "Entraron unos 100 L menos de lo que dijo el pipero, dentro del margen de medición de 150 litros.",
    );
  });

  it("80 L below the claim, inside the margin → consistent + belowClaimInsideMargin, rounded to the nearest 10", () => {
    // 2 × 2 m, ±160 L: 9,920 L measured
    const result = computeVerdict({ ...base, afterCm: 268 });
    expect(result.verdict).toBe("consistent");
    expect(result.belowClaimInsideMargin).toBe(true);
    expect(insideMarginNote(result, 10_000)).toContain("unos 80 L menos");
  });

  it("at or above the claim → no 'menos' note", () => {
    const result = computeVerdict(base);
    expect(result.belowClaimInsideMargin).toBe(false);
    expect(insideMarginNote(result, 10_000)).toBeNull();
  });

  it("the same difference past a tighter margin → short, never the 'inside the margin' note", () => {
    // 41 → 171 cm = 9,750 L, 250 L short: inside 300 L (one reading), outside 150 L (two readings 1 cm apart)
    expect(computeVerdict({ ...mockup, afterCm: 171 }).verdict).toBe("consistent");
    const result = computeVerdict({ ...mockup, afterCm: 171, beforeRepeatCm: 42 });
    expect(result.verdict).toBe("short");
    expect(result.belowClaimInsideMargin).toBe(false);
    expect(insideMarginNote(result, 10_000)).toBeNull();
  });

  it("couldn't-measure cases still give no liters, no range and no note, even with a repeat", () => {
    for (const input of [
      { ...mockup, beforeRepeatCm: 42, afterCm: null },
      { ...mockup, beforeRepeatCm: 42, pumpRan: true },
      { ...mockup, beforeRepeatCm: 42, overflowed: true },
      { ...mockup, beforeRepeatCm: 42, afterCm: 300 },
    ]) {
      const result = computeVerdict(input);
      expect(result.verdict).toBe("couldnt_measure");
      expect(result.measuredLiters).toBeNull();
      expect(result.measuredRange).toBeNull();
      expect(insideMarginNote(result, 10_000)).toBeNull();
    }
  });

  it("the range never goes below 0", () => {
    const result = computeVerdict({ ...base, beforeCm: 20, afterCm: 22, litersClaimed: 50 });
    expect(result.measuredRange).toEqual({ low: 0, high: 240 });
  });

  it("precision box: measured once vs. twice", () => {
    expect(precisionNote(computeVerdict(mockup))).toBe(
      "Medida una vez: usamos un margen de 2 cm por lectura. Medir dos veces lo hace más preciso.",
    );
    expect(precisionNote(computeVerdict({ ...mockup, beforeRepeatCm: 42 }))).toBe(
      "Precisión de tu medición: medida dos veces, diferencia de 1 cm",
    );
    expect(precisionNote(computeVerdict({ ...mockup, beforeRepeatCm: 42.5 }))).toContain("diferencia de 1.5 cm");
  });

  it("never accuses: no 'robo', 'robó' or 'te robaron' in any reason or note", () => {
    const texts = [
      { ...mockup },
      { ...mockup, afterCm: 173, beforeRepeatCm: 42 },
      { ...mockup, afterCm: 150, beforeRepeatCm: 42 },
      { ...mockup, pumpRan: true },
      { ...mockup, overflowed: true },
      { ...mockup, afterCm: null },
      { ...mockup, afterCm: 300 },
    ].flatMap((input) => {
      const result = computeVerdict(input);
      return [result.reason, insideMarginNote(result, input.litersClaimed) ?? "", precisionNote(result)];
    });
    for (const text of texts) expect(text).not.toMatch(/rob[oó]|te robaron/i);
  });
});
