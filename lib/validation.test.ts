import { describe, expect, it } from "vitest";
import {
  validateCollection,
  validateShareState,
  parseNumber,
  validateChallenge,
  validateCistern,
  validateDelivery,
  validateDriverPayment,
  validatePhoto,
  type CisternInput,
  type DeliveryInput,
} from "./validation";

describe("parseNumber", () => {
  it("accepts a dot or a comma as the decimal sign", () => {
    expect(parseNumber("2.5")).toBe(2.5);
    expect(parseNumber("2,5")).toBe(2.5);
    expect(parseNumber(" 300 ")).toBe(300);
  });

  it("rejects letters, empty text and scientific notation", () => {
    expect(parseNumber("diez mil")).toBeNull();
    expect(parseNumber("10000L")).toBeNull();
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("1e3")).toBeNull();
  });
});

const cistern: CisternInput = {
  name: "Cisterna de la vecindad",
  lengthM: "3",
  widthM: "2,5",
  maxHeightCm: "200",
  householdsCount: "3",
  labels: ["Depto 1", "Depto 2", "Casa azul"],
};

describe("validateCistern", () => {
  it("accepts a valid cistern and turns text into numbers", () => {
    const result = validateCistern(cistern);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.widthM).toBe(2.5);
  });

  it("rejects dimensions outside 0.5–20 m", () => {
    const result = validateCistern({ ...cistern, lengthM: "0.2", widthM: "25" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.lengthM).toBeDefined();
      expect(result.errors.widthM).toBeDefined();
    }
  });

  it("rejects 1 household, 41 households and 2.5 households", () => {
    for (const householdsCount of ["1", "41", "2.5"]) {
      const result = validateCistern({ ...cistern, householdsCount });
      expect(result.ok).toBe(false);
    }
  });

  it("rejects a missing, too long or repeated household label", () => {
    expect(validateCistern({ ...cistern, labels: ["Depto 1", "Depto 2"] }).ok).toBe(false);
    expect(validateCistern({ ...cistern, labels: ["Depto 1", "", "Casa"] }).ok).toBe(false);
    expect(validateCistern({ ...cistern, labels: ["Depto 1", "x".repeat(31), "Casa"] }).ok).toBe(false);
    expect(validateCistern({ ...cistern, labels: ["Depto 1", "depto 1", "Casa"] }).ok).toBe(false);
  });
});

const delivery: DeliveryInput = {
  litersClaimed: "10000",
  priceMxn: "1800",
  feeMxn: "2",
  beforeCm: "26",
  afterCm: "142",
  pumpRan: false,
  overflowed: false,
};

describe("validateDelivery (PACKET §13 form cases)", () => {
  it("accepts a valid delivery", () => {
    expect(validateDelivery(delivery, 200).ok).toBe(true);
  });

  it("negative level → rejected with a clear message", () => {
    const result = validateDelivery({ ...delivery, beforeCm: "-5" }, 200);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.beforeCm).toContain("entre 0 y 200 cm");
  });

  it("letters in liters → rejected with a clear message", () => {
    const result = validateDelivery({ ...delivery, litersClaimed: "diez mil" }, 200);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.litersClaimed).toContain("número entero");
  });

  it("a level above the cistern's max height → rejected", () => {
    expect(validateDelivery({ ...delivery, afterCm: "250" }, 200).ok).toBe(false);
  });

  it("liters and price outside their ranges → rejected", () => {
    expect(validateDelivery({ ...delivery, litersClaimed: "40001" }, 200).ok).toBe(false);
    expect(validateDelivery({ ...delivery, priceMxn: "0" }, 200).ok).toBe(false);
  });

  it("the second 'before' reading is optional: empty → null", () => {
    const result = validateDelivery({ ...delivery, beforeRepeatCm: " " }, 200);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.beforeRepeatCm).toBeNull();
  });

  it("the second 'before' reading follows the same rule as the other levels", () => {
    const ok = validateDelivery({ ...delivery, beforeRepeatCm: "41,5" }, 200);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.value.beforeRepeatCm).toBe(41.5);
    for (const bad of ["-1", "201", "cuarenta"]) {
      const result = validateDelivery({ ...delivery, beforeRepeatCm: bad }, 200);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.beforeRepeatCm).toContain("entre 0 y 200 cm");
    }
  });

  it("an empty 'after' level is allowed: the verdict will be 'couldn't measure'", () => {
    const result = validateDelivery({ ...delivery, afterCm: "" }, 200);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.afterCm).toBeNull();
  });
});

describe("validateDriverPayment", () => {
  it("full price → the price; another amount → that amount", () => {
    expect(validateDriverPayment({ choice: "full", otherMxn: "" }, 1_800)).toEqual({ ok: true, value: 1_800 });
    expect(validateDriverPayment({ choice: "other", otherMxn: "1566" }, 1_800)).toEqual({ ok: true, value: 1_566 });
  });

  it("rejects an empty, decimal, negative or above-price amount", () => {
    for (const otherMxn of ["", "1566.5", "-1", "1801", "mil"]) {
      expect(validateDriverPayment({ choice: "other", otherMxn }, 1_800).ok).toBe(false);
    }
  });
});

describe("validateChallenge", () => {
  it("accepts the driver, a neighbor or the organizer, with a note", () => {
    for (const raisedBy of ["driver", "neighbor", "organizer"]) {
      expect(validateChallenge({ raisedBy, note: "Dice que la cinta estaba chueca" }).ok).toBe(true);
    }
  });

  it("rejects an unknown person, an empty note and a note over 500 characters", () => {
    expect(validateChallenge({ raisedBy: "company", note: "x" }).ok).toBe(false);
    expect(validateChallenge({ raisedBy: "driver", note: "   " }).ok).toBe(false);
    expect(validateChallenge({ raisedBy: "driver", note: "x".repeat(501) }).ok).toBe(false);
  });
});

describe("validatePhoto", () => {
  it("10 MB photo → rejected with a clear message", () => {
    expect(validatePhoto({ type: "image/jpeg", size: 10 * 1024 * 1024 })).toContain("5 MB");
  });

  it("JPG and PNG under 5 MB → accepted", () => {
    expect(validatePhoto({ type: "image/jpeg", size: 3_000_000 })).toBeNull();
    expect(validatePhoto({ type: "image/png", size: 3_000_000 })).toBeNull();
  });

  it("other formats → rejected", () => {
    expect(validatePhoto({ type: "image/gif", size: 1000 })).toContain("JPG o PNG");
    expect(validatePhoto({ type: "image/heic", size: 1000 })).toContain("JPG o PNG");
  });
});

describe("validateCollection", () => {
  it("accepts whole pesos and an optional date", () => {
    expect(validateCollection({ priceMxn: "1500", feeMxn: "10", agreedDate: "" })).toEqual({
      ok: true,
      value: { priceMxn: 1500, feeMxn: 10, agreedDate: null },
    });
    expect(validateCollection({ priceMxn: "1500", feeMxn: "10", agreedDate: "2026-11-27" })).toMatchObject({
      ok: true,
      value: { agreedDate: "2026-11-27" },
    });
  });

  it("rejects cents, out-of-range prices and impossible dates", () => {
    const r = validateCollection({ priceMxn: "1500.50", feeMxn: "600", agreedDate: "2026-02-30" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["agreedDate", "feeMxn", "priceMxn"]);
    expect(validateCollection({ priceMxn: "0", feeMxn: "10", agreedDate: "" }).ok).toBe(false);
    expect(validateCollection({ priceMxn: "20001", feeMxn: "10", agreedDate: "" }).ok).toBe(false);
  });
});

describe("validateShareState", () => {
  it("received and pending carry no date", () => {
    expect(validateShareState({ state: "received", promisedFor: "2026-11-27" })).toEqual({
      ok: true,
      value: { state: "received", promisedFor: null },
    });
  });
  it("a promise needs a real date", () => {
    expect(validateShareState({ state: "promised", promisedFor: "" }).ok).toBe(false);
    expect(validateShareState({ state: "promised", promisedFor: "2026-11-27" }).ok).toBe(true);
  });
  it("rejects unknown states", () => {
    expect(validateShareState({ state: "paid", promisedFor: "" }).ok).toBe(false);
  });
});
