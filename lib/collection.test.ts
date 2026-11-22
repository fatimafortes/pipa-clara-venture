import { describe, expect, it } from "vitest";
import {
  collectedMxn,
  collectionShares,
  collectionStatus,
  differencePerHousehold,
  isReady,
  missingCount,
  readyButtonLabel,
  type CollectionShare,
} from "./collection";
import { splitShares } from "./shares";

const labels = (n: number) => Array.from({ length: n }, (_, i) => `Casa ${i + 1}`);
const sum = (xs: { amountMxn: number }[]) => xs.reduce((a, s) => a + s.amountMxn, 0);
const withStates = (shares: CollectionShare[], states: CollectionShare["state"][]) =>
  shares.map((s, i) => ({ ...s, state: states[i] }));

describe("collectionShares", () => {
  it.each([3, 5, 12])("splits price + $10 fee among %i households without losing a peso", (n) => {
    const shares = collectionShares(1_500, 10, labels(n));
    expect(shares).toHaveLength(n);
    expect(sum(shares)).toBe(1_510);
    const amounts = shares.map((s) => s.amountMxn);
    expect(Math.max(...amounts) - Math.min(...amounts)).toBeLessThanOrEqual(1);
    expect(shares.every((s) => s.state === "pending")).toBe(true);
  });

  it("the mockup: $1,500 + $10 among 6 is $252 for four houses and $251 for two", () => {
    const amounts = collectionShares(1_500, 10, labels(6)).map((s) => s.amountMxn);
    expect(amounts).toEqual([252, 252, 252, 252, 251, 251]);
  });

  it("keeps the labels in order", () => {
    expect(collectionShares(300, 10, labels(3)).map((s) => s.label)).toEqual(["Casa 1", "Casa 2", "Casa 3"]);
  });
});

describe("status: the 100% rule", () => {
  const six = collectionShares(1_500, 10, labels(6));

  it("is collecting while any share is missing", () => {
    const shares = withStates(six, ["received", "received", "received", "pending", "received", "received"]);
    expect(collectionStatus(shares, null)).toBe("collecting");
    expect(isReady(shares)).toBe(false);
    expect(missingCount(shares)).toBe(1);
  });

  it("a promise is not money: promised doesn't count as received", () => {
    const shares = withStates(six, ["received", "received", "received", "promised", "received", "received"]);
    expect(collectionStatus(shares, null)).toBe("collecting");
    expect(readyButtonLabel(shares)).toBe("Listo para pedir (falta 1)");
  });

  it("is ready only when every share is received", () => {
    const shares = withStates(six, Array(6).fill("received"));
    expect(collectionStatus(shares, null)).toBe("ready");
    expect(readyButtonLabel(shares)).toBe("Listo para pedir");
    expect(collectedMxn(shares)).toBe(1_510);
  });

  it("is ordered once linked to a delivery, and only then", () => {
    const shares = withStates(six, Array(6).fill("received"));
    expect(collectionStatus(shares, "d-1")).toBe("ordered");
  });

  it("an empty collection is never ready", () => {
    expect(isReady([])).toBe(false);
    expect(collectionStatus([], null)).toBe("collecting");
  });

  it("says faltan in plural", () => {
    expect(readyButtonLabel(six)).toBe("Listo para pedir (faltan 6)");
  });

  it("collected money counts only received shares", () => {
    const shares = withStates(collectionShares(300, 0, labels(3)), ["received", "promised", "pending"]);
    expect(collectedMxn(shares)).toBe(100);
  });
});

describe("differencePerHousehold", () => {
  it("after paying the pipero less, shows what each household gave above its new share", () => {
    const collected = collectionShares(1_500, 10, labels(6));
    // Short verdict: she paid $1,305 instead of $1,500; same $10 fee
    const owed = splitShares(1_305 + 10, 6).map((amountMxn, i) => ({ label: `Casa ${i + 1}`, amountMxn }));
    const diff = differencePerHousehold(collected, owed);
    expect(sum(diff)).toBe(195);
    expect(diff.every((d) => d.amountMxn >= 32 && d.amountMxn <= 33)).toBe(true);
  });

  it("is zero when she paid the full price", () => {
    const collected = collectionShares(1_500, 10, labels(3));
    expect(sum(differencePerHousehold(collected, collected))).toBe(0);
  });
});
