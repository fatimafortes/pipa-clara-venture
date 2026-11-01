import { describe, expect, it } from "vitest";
import { buildSummary, whatsappLink, type SummaryInput } from "./summary";

// The mockup example: 12 households, 7 paid, 1,300 L short
const mockup: SummaryInput = {
  deliveredAt: "2026-10-25T14:41:00Z", // 08:41 in Mexico City
  litersClaimed: 10_000,
  measuredLiters: 8_700,
  verdict: "short",
  toleranceLiters: 300,
  beforeTakenAt: "2026-10-25T14:02:00Z", // 08:02 in Mexico City
  driverPresent: true,
  priceMxn: 1_800,
  feeMxn: 2,
  shareAmounts: Array(12).fill(152),
  paidCount: 7,
  challengesCount: 0,
};

describe("buildSummary", () => {
  it("has the date, claimed vs measured, the verdict, the share and the paid count", () => {
    const text = buildSummary(mockup);
    expect(text).toContain("Pipa del 25 de octubre");
    expect(text).toContain("Litros que dijo el pipero: 10,000 L");
    expect(text).toContain("Litros que entraron (medidos): 8,700 L");
    expect(text).toContain("FALTANTE de 1,300 L");
    expect(text).toContain("±300 L");
    expect(text).toContain("Cada hogar paga: $152");
    expect(text).toContain("Ya pagaron: 7 de 12");
  });

  it("shows the 'before' reading time in Mexico City and that the driver was there", () => {
    expect(buildSummary(mockup)).toContain("Lectura de antes: 08:02, con el pipero presente");
  });

  it("explains the fee, so it never shows up in a share without explanation", () => {
    expect(buildSummary(mockup)).toContain("pipa $1,800 + cuota de Pipa Clara $24");
  });

  it("never contains household labels (CHARTER principle 3)", () => {
    const text = buildSummary(mockup);
    for (const label of ["Depto", "Hogar", "Casa"]) {
      expect(text).not.toContain(label);
    }
  });

  it("says 'no se pudo medir' instead of a number when it couldn't be measured", () => {
    const text = buildSummary({ ...mockup, verdict: "couldnt_measure", measuredLiters: null });
    expect(text).toContain("Litros que entraron (medidos): no se pudo medir");
    expect(text).toContain("NO SE PUDO MEDIR");
    expect(text).not.toContain("FALTANTE");
  });

  it("mentions challenges only as a count, never their notes", () => {
    const text = buildSummary({ ...mockup, challengesCount: 2 });
    expect(text).toContain("Hay 2 desacuerdos registrados");
  });

  it("shows both amounts when the remainder makes shares differ by $1", () => {
    expect(buildSummary({ ...mockup, shareAmounts: [334, 333, 333] })).toContain("Cada hogar paga: $333 o $334");
  });
});

describe("whatsappLink", () => {
  it("opens WhatsApp with the text encoded in the link", () => {
    const link = whatsappLink("Ya pagaron: 7 de 12\nCada hogar paga: $152");
    expect(link.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toBe("Ya pagaron: 7 de 12\nCada hogar paga: $152");
  });
});
