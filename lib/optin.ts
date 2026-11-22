import type { FieldErrors, Result } from "./validation";

// The opt-in on the homepage (F5, PACKET §12.3). Pure, so it runs on the server and in tests.
export const HOUSING = ["vecindad", "edificio", "privada", "otra"] as const;
export type Housing = (typeof HOUSING)[number];

export const HOUSING_LABEL: Record<Housing, string> = {
  vecindad: "Vecindad",
  edificio: "Edificio",
  privada: "Privada",
  otra: "Otra",
};

export const CONSENT_TEXT = "Acepto que Pipa Clara me contacte sobre esta prueba";
export const MAX_CONTACT = 80;

export type OptInInput = { contact: string; housing: string; consent: boolean; website: string };
export type OptIn = { contact: string; contactKind: "email" | "whatsapp"; housing: Housing };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// "55 1234 5678", "(55) 1234-5678", "+52 55 1234 5678" → "5512345678"; null if not 10 digits
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/[\s\-().]/g, "");
  // "+52 1 55…" is the old mobile prefix; WhatsApp links still show it sometimes
  if (digits.startsWith("+521") && digits.length === 14) digits = digits.slice(4);
  else if (digits.startsWith("+52")) digits = digits.slice(3);
  return /^\d{10}$/.test(digits) ? digits : null;
}

// bot = the hidden field was filled: the caller pretends it worked and stores nothing
export function validateOptIn(input: OptInInput): Result<OptIn> | { ok: false; bot: true } {
  if (input.website.trim() !== "") return { ok: false, bot: true };

  const errors: FieldErrors = {};
  const raw = input.contact.trim();
  let contact = "";
  let contactKind: OptIn["contactKind"] = "email";
  if (raw === "") {
    errors.contact = "Escribe tu WhatsApp o tu correo.";
  } else if (raw.length > MAX_CONTACT) {
    errors.contact = `Máximo ${MAX_CONTACT} letras.`;
  } else if (raw.includes("@")) {
    if (EMAIL.test(raw)) contact = raw.toLowerCase();
    else errors.contact = "Revisa el correo, por ejemplo nombre@correo.com.";
  } else {
    const phone = normalizePhone(raw);
    if (phone) {
      contact = phone;
      contactKind = "whatsapp";
    } else errors.contact = "El WhatsApp debe tener 10 dígitos, por ejemplo 55 1234 5678.";
  }

  if (!(HOUSING as readonly string[]).includes(input.housing)) errors.housing = "Elige dónde vives.";
  if (!input.consent) errors.consent = "Para avisarte necesitamos que lo aceptes.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { contact, contactKind, housing: input.housing as Housing } };
}
