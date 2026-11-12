import { describe, expect, it } from "vitest";
import {
  DEFAULTS,
  costToServe,
  decodeScenario,
  defaultFeePerHousehold,
  detectability,
  encodeScenario,
  minDetectablePct,
  priceAt10to1,
  ratios,
  revenue,
  valuePerDelivery,
} from "./pricing";

const fam = DEFAULTS.familias;
const biz = DEFAULTS.negocios;

describe("value and ratios (PACKET §7 worked example)", () => {
  it("families: $72.31 per delivery, 7.2 to 1 at $10, not 10 to 1", () => {
    const v = valuePerDelivery(fam);
    expect(v.shortfall).toBe(19.8);
    expect(v.time).toBe(52.51);
    expect(v.total).toBe(72.31);
    expect(ratios(fam).group).toBe(7.23);
  });

  it("each household only gets its part of the shortfall protection: about 2 to 1", () => {
    expect(ratios(fam).household).toBe(1.98);
  });

  it("time value never goes negative when measuring takes longer than collecting", () => {
    expect(valuePerDelivery({ ...fam, collectHours: 0.1, measureMinutes: 30 }).time).toBe(0);
  });

  it("a business has no shares to collect: value is only the shortfall", () => {
    const v = valuePerDelivery(biz);
    expect(v.time).toBe(0);
    expect(v.total).toBe(22);
    expect(priceAt10to1(biz)).toBe(2.2);
  });

  it("no ratio when the fee is zero", () => {
    expect(ratios({ ...fam, feeMxn: 0 })).toEqual({ group: null, household: null });
  });
});

describe("detectability uses the verdict's margin", () => {
  it("3 × 2.5 m at 2 cm: 300 L margin, a 110 L shortfall can't be detected", () => {
    expect(detectability(fam)).toEqual({ marginLiters: 300, expectedShortfallLiters: 110, detectable: false });
    expect(minDetectablePct(fam)).toBe(3);
  });

  it("a big enough shortfall is detectable", () => {
    expect(detectability({ ...fam, shortfallPct: 5 }).detectable).toBe(true);
  });
});

describe("revenue and cost to serve", () => {
  it("100 cisterns × 50% × 2 pipas × $10 = $1,000 a month", () => {
    expect(revenue(fam)).toEqual({ monthly: 1000, annual: 12000 });
  });

  it("founder labor at the hourly value", () => {
    // 50 paying × 15 min = 12.5 h × 39.38
    expect(costToServe(fam).monthly).toBe(492.25);
    expect(costToServe(fam).setupOnce).toBe(984.5);
  });

  it("zero conversion means zero revenue and zero cost", () => {
    const s = { ...fam, conversionPct: 0 };
    expect(revenue(s).monthly).toBe(0);
    expect(costToServe(s).monthly).toBe(0);
  });
});

describe("shareable scenarios", () => {
  it("round trip", () => {
    const s = { ...biz, cisterns: 37, shortfallPct: 2.5 };
    expect(decodeScenario(encodeScenario(s))).toEqual(s);
  });

  it("clamps out-of-range values, ignores junk and unknown keys", () => {
    const s = decodeScenario("segment=familias&conversionPct=500&feeMxn=abc&evil=1&cisterns=-4");
    expect(s?.conversionPct).toBe(100);
    expect(s?.feeMxn).toBe(0);
    expect(s?.cisterns).toBe(0);
    expect(s).not.toHaveProperty("evil");
  });

  it("no segment, no scenario", () => {
    expect(decodeScenario("cisterns=5")).toBeNull();
  });
});

describe("delivery form default fee", () => {
  it("adds up to about $10 per delivery", () => {
    expect(defaultFeePerHousehold(5)).toBe(2);
    expect(defaultFeePerHousehold(3)).toBe(3);
    expect(defaultFeePerHousehold(12)).toBe(1);
    expect(defaultFeePerHousehold(1)).toBe(10);
  });
});
