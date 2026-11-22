import { describe, expect, it } from "vitest";
import { isReady, missingCount } from "./collection";
import { DEMO, demoStartShares, demoSummary, demoVerdict } from "./demo";

describe("/demo example data", () => {
  it("starts like the mockup: 5 de 6, Casa 4 promised, not ready", () => {
    const shares = demoStartShares();
    expect(missingCount(shares)).toBe(1);
    expect(isReady(shares)).toBe(false);
    expect(shares.find((s) => s.label === "Casa 4")?.state).toBe("promised");
    expect(shares.map((s) => s.amountMxn)).toEqual([252, 252, 252, 252, 251, 251]);
  });

  it("matches the homepage: 9,900 L measured, consistent, 300 L margin", () => {
    const { result, note } = demoVerdict();
    expect(result.measuredLiters).toBe(9_900);
    expect(result.verdict).toBe("consistent");
    expect(result.toleranceLiters).toBe(300);
    expect(note).toContain("100");
  });

  it("the summary carries the real $10 fee, 6 de 6 and no household label", () => {
    const all = demoStartShares().map((s) => ({ ...s, state: "received" as const }));
    const text = demoSummary(all);
    expect(text).toContain("cuota de Pipa Clara $10");
    expect(text).toContain("Ya pagaron: 6 de 6");
    for (const label of DEMO.labels) expect(text).not.toContain(label);
  });
});
