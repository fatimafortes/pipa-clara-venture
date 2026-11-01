import { describe, expect, it } from "vitest";
import { computeVerdict, type VerdictInput } from "./verdict";

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
    expect(result.reason).toContain("±300 L");
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
