import { describe, expect, it } from "vitest";
import { normalizePhone, validateOptIn } from "./optin";

const base = { contact: "55 1234 5678", housing: "vecindad", consent: true, website: "" };

describe("validateOptIn", () => {
  it("accepts a 10-digit WhatsApp in common formats", () => {
    for (const contact of ["5512345678", "55 1234 5678", "(55) 1234-5678", "+52 55 1234 5678"]) {
      expect(validateOptIn({ ...base, contact })).toEqual({
        ok: true,
        value: { contact: "5512345678", contactKind: "whatsapp", housing: "vecindad" },
      });
    }
  });

  it("accepts an email, lower-cased", () => {
    expect(validateOptIn({ ...base, contact: " Rosa@Correo.MX " })).toEqual({
      ok: true,
      value: { contact: "rosa@correo.mx", contactKind: "email", housing: "vecindad" },
    });
  });

  it("rejects empty consent", () => {
    const r = validateOptIn({ ...base, consent: false });
    expect(r.ok).toBe(false);
    expect("errors" in r && r.errors.consent).toBeTruthy();
  });

  it("rejects the honeypot as a bot, before anything else", () => {
    expect(validateOptIn({ ...base, contact: "", website: "http://spam" })).toEqual({ ok: false, bot: true });
  });

  it("rejects empty, too long, bad email, short phone and unknown housing", () => {
    expect(validateOptIn({ ...base, contact: "" }).ok).toBe(false);
    expect(validateOptIn({ ...base, contact: `${"a".repeat(75)}@x.com` }).ok).toBe(false);
    expect(validateOptIn({ ...base, contact: "rosa@correo" }).ok).toBe(false);
    expect(validateOptIn({ ...base, contact: "55 1234 567" }).ok).toBe(false);
    expect(validateOptIn({ ...base, housing: "casa" }).ok).toBe(false);
  });

  it("phone normalization", () => {
    expect(normalizePhone("+52 (55) 1234-5678")).toBe("5512345678");
    expect(normalizePhone("+52 1 55 1234 5678")).toBe("5512345678");
    expect(normalizePhone("1-800-FLOWERS")).toBeNull();
  });
});
