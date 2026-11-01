import { describe, expect, it } from "vitest";
import { splitShares, valueOfMeasured } from "./shares";

describe("valueOfMeasured", () => {
  it("the mockup: 8,700 of 10,000 L at $1,800 → the water that entered is worth $1,566", () => {
    expect(valueOfMeasured(8_700, 10_000, 1_800)).toBe(1_566);
  });

  it("never more than the price, never negative", () => {
    expect(valueOfMeasured(10_500, 10_000, 1_800)).toBe(1_800);
    expect(valueOfMeasured(-400, 10_000, 1_800)).toBe(0);
  });
});

const sum = (shares: number[]) => shares.reduce((a, b) => a + b, 0);

describe("splitShares", () => {
  it("MXN 1,800 + MXN 24 fee among 12 households → 12 × MXN 152", () => {
    const shares = splitShares(1_800 + 24, 12);
    expect(shares).toEqual(Array(12).fill(152));
  });

  it("MXN 1,000 among 3 → 334 + 333 + 333: the extra peso goes to the first household", () => {
    expect(splitShares(1_000, 3)).toEqual([334, 333, 333]);
  });

  it("never loses or invents a peso, for many totals and household counts", () => {
    for (let households = 2; households <= 40; households++) {
      for (const total of [0, 1, 7, 999, 1_810, 1_824, 2_003, 20_080]) {
        const shares = splitShares(total, households);
        expect(shares).toHaveLength(households);
        expect(sum(shares)).toBe(total);
        // Fair: no two households differ by more than 1 peso
        expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("rejects pesos with cents and impossible household counts", () => {
    expect(() => splitShares(100.5, 3)).toThrow();
    expect(() => splitShares(-1, 3)).toThrow();
    expect(() => splitShares(100, 0)).toThrow();
    expect(() => splitShares(100, 2.5)).toThrow();
  });
});
