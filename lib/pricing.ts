// Week 14 pricing (PACKET §7): every assumption behind the price lives here, once.
// /pricing, the simulator and the 10:1 memo on /about all read from this file, so the
// three can never disagree. Pure arithmetic, checkable by hand.
import { litersPerCm } from "./verdict";

export type Status = "measured" | "assumed" | "analogy";

// What the visitor sees next to each number
export const STATUS_LABEL: Record<Status, string> = {
  measured: "medido",
  assumed: "supuesto",
  analogy: "analogía, sin validar",
};

export type Segment = "familias" | "negocios";

export type Scenario = {
  segment: Segment;
  // Market
  cisterns: number; // cisterns (or businesses) reached
  conversionPct: number; // % that use it and pay
  deliveriesPerMonth: number;
  // Price and cost
  feeMxn: number; // Pipa Clara's fee per delivery
  pipaPriceMxn: number;
  litersClaimed: number;
  // Value
  shortfallPct: number; // expected shortfall, % of the load
  collectHours: number; // organizer's time collecting and noting payments, per delivery
  measureMinutes: number; // extra time measuring with Pipa Clara, per delivery
  wageMxnHour: number;
  households: number;
  // Measurement
  lengthM: number;
  widthM: number;
  errorCm: number;
  // Cost to serve
  setupMinutes: number; // once per new paying cistern
  supportMinutesMonth: number; // per paying cistern per month
};

type Field = {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
};

// Ranges double as validation: anything outside is clamped
export const FIELDS: Record<Exclude<keyof Scenario, "segment">, Field> = {
  cisterns: { label: "Cisternas que conocen Pipa Clara", unit: "", min: 0, max: 100000, step: 1 },
  conversionPct: { label: "De ellas, cuántas la usan y pagan", unit: "%", min: 0, max: 100, step: 1 },
  deliveriesPerMonth: { label: "Pipas al mes por cisterna", unit: "", min: 0, max: 60, step: 1 },
  feeMxn: { label: "Cuota de Pipa Clara por pipa", unit: "$", min: 0, max: 500, step: 1 },
  pipaPriceMxn: { label: "Precio de la pipa", unit: "$", min: 0, max: 20000, step: 50 },
  litersClaimed: { label: "Litros que dice el pipero", unit: "L", min: 0, max: 40000, step: 500 },
  shortfallPct: { label: "Faltante esperado por pipa", unit: "%", min: 0, max: 50, step: 0.1 },
  collectHours: { label: "Horas cobrando y anotando, por pipa", unit: "h", min: 0, max: 10, step: 0.25 },
  measureMinutes: { label: "Minutos extra midiendo, por pipa", unit: "min", min: 0, max: 120, step: 1 },
  wageMxnHour: { label: "Valor de una hora", unit: "$", min: 0, max: 1000, step: 0.01 },
  households: { label: "Hogares que comparten la cisterna", unit: "", min: 1, max: 100, step: 1 },
  lengthM: { label: "Largo de la cisterna", unit: "m", min: 0.1, max: 30, step: 0.1 },
  widthM: { label: "Ancho de la cisterna", unit: "m", min: 0.1, max: 30, step: 0.1 },
  errorCm: { label: "Error por lectura", unit: "cm", min: 0, max: 20, step: 0.5 },
  setupMinutes: { label: "Minutos para dar de alta una cisterna", unit: "min", min: 0, max: 600, step: 5 },
  supportMinutesMonth: { label: "Minutos de soporte al mes por cisterna", unit: "min", min: 0, max: 600, step: 5 },
};

export type Assumption = { status: Status; source: string };

// 2026 minimum wage: MXN 315.04 per day ÷ 8 h
export const MIN_WAGE_HOUR = 39.38;

// Status and source of each default, shown next to the input
export const SOURCES: Record<Exclude<keyof Scenario, "segment">, Assumption> = {
  cisterns: { status: "assumed", source: "Escenario, no un dato" },
  conversionPct: { status: "assumed", source: "Escenario, no un dato" },
  deliveriesPerMonth: {
    status: "assumed",
    source: "Familias: 2 al mes, supuesto. Negocios: 3 a 4 por semana, medido en la crisis de 2024 (La Silla Rota, OEM)",
  },
  feeMxn: { status: "measured", source: "Precio decidido: $10 por pipa para familias" },
  pipaPriceMxn: {
    status: "measured",
    source: "Profeco: $1,802.94 promedio CDMX (ene 2023). Negocios: $1,500–2,500 (La Jornada, 2024)",
  },
  litersClaimed: { status: "assumed", source: "Pipa típica de 10,000 L" },
  shortfallPct: {
    status: "analogy",
    source: "Gasolina, Profeco: ~11% de estaciones dan ~10% menos. Nadie ha medido pipas de agua",
  },
  collectHours: { status: "assumed", source: "1 a 2 h; nadie lo ha medido. Negocios: 0, no reparten" },
  measureMinutes: { status: "assumed", source: "Dos lecturas y fotos; sin medir todavía" },
  wageMxnHour: { status: "measured", source: "Salario mínimo 2026: $315.04 al día ÷ 8 h" },
  households: { status: "assumed", source: "Cisterna típica de 5 hogares" },
  lengthM: { status: "assumed", source: "Cisterna de ejemplo 3 × 2.5 m" },
  widthM: { status: "assumed", source: "Cisterna de ejemplo 3 × 2.5 m" },
  errorCm: { status: "measured", source: "Margen por defecto de la app: 2 cm por lectura" },
  setupMinutes: { status: "assumed", source: "Plan del equipo: 30 min de alta" },
  supportMinutesMonth: { status: "assumed", source: "Plan del equipo: 15 min de soporte" },
};

export const DEFAULTS: Record<Segment, Scenario> = {
  familias: {
    segment: "familias",
    cisterns: 100,
    conversionPct: 50,
    deliveriesPerMonth: 2,
    feeMxn: 10,
    pipaPriceMxn: 1800,
    litersClaimed: 10000,
    shortfallPct: 1.1,
    collectHours: 1.5,
    measureMinutes: 10,
    wageMxnHour: MIN_WAGE_HOUR,
    households: 5,
    lengthM: 3,
    widthM: 2.5,
    errorCm: 2,
    setupMinutes: 30,
    supportMinutesMonth: 15,
  },
  negocios: {
    segment: "negocios",
    cisterns: 20,
    conversionPct: 50,
    deliveriesPerMonth: 13,
    feeMxn: 2,
    pipaPriceMxn: 2000,
    litersClaimed: 10000,
    shortfallPct: 1.1,
    collectHours: 0,
    measureMinutes: 10,
    wageMxnHour: MIN_WAGE_HOUR,
    households: 1,
    lengthM: 3,
    widthM: 2.5,
    errorCm: 2,
    setupMinutes: 30,
    supportMinutesMonth: 15,
  },
};

// Pipa Clara's fee for families: $10 per delivery, from the first one
export const FAMILY_FEE_PER_DELIVERY = DEFAULTS.familias.feeMxn;

const round2 = (n: number) => Math.round(n * 100) / 100;

export function clamp(key: Exclude<keyof Scenario, "segment">, value: number): number {
  const f = FIELDS[key];
  if (!Number.isFinite(value)) return f.min;
  return Math.min(f.max, Math.max(f.min, value));
}

export function payingCisterns(s: Scenario): number {
  return Math.round((s.cisterns * s.conversionPct) / 100);
}

export function revenue(s: Scenario): { monthly: number; annual: number } {
  const monthly = round2(payingCisterns(s) * s.deliveriesPerMonth * s.feeMxn);
  return { monthly, annual: round2(monthly * 12) };
}

// Founder labor priced at the same hourly value (condition 4 of the Blueprint)
export function costToServe(s: Scenario): { setupOnce: number; monthly: number } {
  const paying = payingCisterns(s);
  return {
    setupOnce: round2(((paying * s.setupMinutes) / 60) * s.wageMxnHour),
    monthly: round2(((paying * s.supportMinutesMonth) / 60) * s.wageMxnHour),
  };
}

export type Value = { time: number; shortfall: number; total: number };

// What one delivery is worth to the payers, in pesos
export function valuePerDelivery(s: Scenario): Value {
  // Time saved collecting, minus the time measuring takes; never negative
  const hours = Math.max(0, s.collectHours - s.measureMinutes / 60);
  const time = round2(hours * s.wageMxnHour);
  const shortfall = round2((s.shortfallPct / 100) * s.pipaPriceMxn);
  return { time, shortfall, total: round2(time + shortfall) };
}

export type Ratios = {
  // Whole delivery: value ÷ fee
  group: number | null;
  // One household: its part of the shortfall protection ÷ its part of the fee.
  // The time saved goes to the organizer only, so it isn't counted here.
  household: number | null;
};

export function ratios(s: Scenario): Ratios {
  if (s.feeMxn <= 0) return { group: null, household: null };
  const v = valuePerDelivery(s);
  return {
    group: round2(v.total / s.feeMxn),
    household: round2(v.shortfall / s.feeMxn),
  };
}

export function priceAt10to1(s: Scenario): number {
  return round2(valuePerDelivery(s).total / 10);
}

export type Detectability = {
  marginLiters: number;
  expectedShortfallLiters: number;
  detectable: boolean;
};

// Same margin as computeVerdict(): two readings, each off by up to errorCm
export function detectability(s: Scenario): Detectability {
  const marginLiters = Math.round(2 * s.errorCm * litersPerCm(s.lengthM, s.widthM));
  const expectedShortfallLiters = Math.round((s.shortfallPct / 100) * s.litersClaimed);
  return {
    marginLiters,
    expectedShortfallLiters,
    detectable: expectedShortfallLiters > marginLiters,
  };
}

// Shortfall the measurement could catch, as % of the load (useful for "what would have to be true")
export function minDetectablePct(s: Scenario): number | null {
  if (s.litersClaimed <= 0) return null;
  return round2((detectability(s).marginLiters / s.litersClaimed) * 100);
}

// Fee per household that adds up to about $10 per delivery, in whole pesos
export function defaultFeePerHousehold(households: number): number {
  if (!Number.isFinite(households) || households < 1) return FAMILY_FEE_PER_DELIVERY;
  return Math.max(1, Math.round(FAMILY_FEE_PER_DELIVERY / households));
}

const KEYS = Object.keys(FIELDS) as Exclude<keyof Scenario, "segment">[];

// Shareable link: only known keys, numbers only
export function encodeScenario(s: Scenario): string {
  const p = new URLSearchParams();
  p.set("segment", s.segment);
  for (const k of KEYS) p.set(k, String(s[k]));
  return p.toString();
}

// Unknown keys ignored, missing keys take the segment default, everything clamped
export function decodeScenario(query: string): Scenario | null {
  const p = new URLSearchParams(query);
  const seg = p.get("segment");
  if (seg !== "familias" && seg !== "negocios") return null;
  const s: Scenario = { ...DEFAULTS[seg] };
  for (const k of KEYS) {
    const raw = p.get(k);
    if (raw === null || raw.trim() === "") continue;
    s[k] = clamp(k, Number(raw));
  }
  return s;
}
