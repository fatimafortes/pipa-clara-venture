// Form validation (PACKET §11). Pure functions, so they run on the server and in tests.
// Inputs are the raw strings from the form; messages are shown on screen, in Spanish.

export type FieldErrors = Record<string, string>;

export type Result<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

// Accepts "2.5" and "2,5"; rejects letters, empty text and things like "1e3"
export function parseNumber(raw: string | null | undefined): number | null {
  const text = (raw ?? "").trim().replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(text)) return null;
  return Number(text);
}

function checkRange(
  errors: FieldErrors,
  field: string,
  raw: string,
  min: number,
  max: number,
  message: string,
  { wholeNumber = false } = {},
): number {
  const value = parseNumber(raw);
  if (value === null || value < min || value > max || (wholeNumber && !Number.isInteger(value))) {
    errors[field] = message;
    return NaN;
  }
  return value;
}

export type CisternInput = {
  name: string;
  lengthM: string;
  widthM: string;
  maxHeightCm: string;
  householdsCount: string;
  labels: string[];
};

export type Cistern = {
  name: string;
  lengthM: number;
  widthM: number;
  maxHeightCm: number;
  householdsCount: number;
  labels: string[];
};

export function validateCistern(input: CisternInput): Result<Cistern> {
  const errors: FieldErrors = {};

  const name = input.name.trim();
  if (name.length < 1 || name.length > 60) {
    errors.name = "Escribe un nombre para la cisterna (máximo 60 letras).";
  }

  const lengthM = checkRange(errors, "lengthM", input.lengthM, 0.5, 20,
    "El largo debe ser un número entre 0.5 y 20 metros.");
  const widthM = checkRange(errors, "widthM", input.widthM, 0.5, 20,
    "El ancho debe ser un número entre 0.5 y 20 metros.");
  const maxHeightCm = checkRange(errors, "maxHeightCm", input.maxHeightCm, 50, 2000,
    "La altura máxima debe ser un número entre 50 y 2,000 cm.");
  const householdsCount = checkRange(errors, "householdsCount", input.householdsCount, 2, 40,
    "El número de hogares debe ser un número entero entre 2 y 40.", { wholeNumber: true });

  const labels = input.labels.map((label) => label.trim());
  if (!errors.householdsCount && labels.length !== householdsCount) {
    errors.labels = "Escribe una etiqueta para cada hogar.";
  } else if (labels.some((label) => label.length < 1 || label.length > 30)) {
    errors.labels = "Cada etiqueta debe tener entre 1 y 30 letras, por ejemplo \"Depto 3\".";
  } else if (new Set(labels.map((label) => label.toLowerCase())).size !== labels.length) {
    errors.labels = "Hay dos hogares con la misma etiqueta. Cada uno debe ser distinto.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { name, lengthM, widthM, maxHeightCm, householdsCount, labels } };
}

export type DeliveryInput = {
  litersClaimed: string;
  priceMxn: string;
  feeMxn: string;
  beforeCm: string;
  afterCm: string;
  pumpRan: boolean;
  overflowed: boolean;
};

export type Delivery = {
  litersClaimed: number;
  priceMxn: number;
  feeMxn: number;
  beforeCm: number;
  // null when the "after" level was left empty: the verdict will be "couldn't measure"
  afterCm: number | null;
  pumpRan: boolean;
  overflowed: boolean;
};

export function validateDelivery(input: DeliveryInput, maxHeightCm: number): Result<Delivery> {
  const errors: FieldErrors = {};

  const litersClaimed = checkRange(errors, "litersClaimed", input.litersClaimed, 1, 40000,
    "Los litros deben ser un número entero entre 1 y 40,000.", { wholeNumber: true });
  const priceMxn = checkRange(errors, "priceMxn", input.priceMxn, 1, 20000,
    "El precio debe ser un número entero de pesos entre 1 y 20,000.", { wholeNumber: true });
  const feeMxn = checkRange(errors, "feeMxn", input.feeMxn, 0, 100,
    "La cuota por hogar debe ser un número entero de pesos entre 0 y 100.", { wholeNumber: true });

  const levelMessage = `El nivel debe ser un número entre 0 y ${maxHeightCm} cm (la altura máxima de tu cisterna).`;
  const beforeCm = checkRange(errors, "beforeCm", input.beforeCm, 0, maxHeightCm, levelMessage);

  let afterCm: number | null = null;
  if (input.afterCm.trim() !== "") {
    afterCm = checkRange(errors, "afterCm", input.afterCm, 0, maxHeightCm, levelMessage);
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      litersClaimed,
      priceMxn,
      feeMxn,
      beforeCm,
      afterCm,
      pumpRan: input.pumpRan,
      overflowed: input.overflowed,
    },
  };
}

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

// Checked on the original file, before it is shrunk for upload
export function validatePhoto(file: { type: string; size: number }): string | null {
  if (file.type !== "image/jpeg" && file.type !== "image/png") {
    return "La foto debe ser JPG o PNG.";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "La foto pesa más de 5 MB. Toma otra o elige una más ligera.";
  }
  return null;
}
