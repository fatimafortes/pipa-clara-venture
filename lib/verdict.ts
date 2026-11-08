// The engine (PACKET §6): compares the liters the driver claims against the liters
// measured in the cistern. Pure arithmetic, no AI: the organizer can check it by hand.
import { formatLiters, formatLitersWord } from "./format";

export type Verdict = "consistent" | "short" | "couldnt_measure";

export type VerdictInput = {
  lengthM: number;
  widthM: number;
  maxHeightCm: number;
  beforeCm: number | null;
  // The "before" level read a second time after pulling the stick out (precision check).
  // Left out or null = measured once, and the margin is the same as in Week 12.
  beforeRepeatCm?: number | null;
  afterCm: number | null;
  litersClaimed: number;
  pumpRan: boolean;
  overflowed: boolean;
};

export type VerdictResult = {
  // null when the delivery couldn't be measured: we never show a number we don't trust
  measuredLiters: number | null;
  toleranceLiters: number;
  // Error assumed per reading, in cm: 2 by default, or the real spread of the repeat (min 1)
  errorCm: number;
  // |first − second| "before" reading; null when it was measured once
  spreadCm: number | null;
  // measured ± margin, never below 0; null when it couldn't be measured
  measuredRange: { low: number; high: number } | null;
  // Fewer liters than claimed, but inside the margin: consistent, with an honest note
  belowClaimInsideMargin: boolean;
  verdict: Verdict;
  // Shown on screen, so it is in Spanish
  reason: string;
};

// Default error per reading (Week 12): ±2 cm
const DEFAULT_ERROR_CM = 2;
// A lucky identical pair can't claim more precision than this
const MIN_ERROR_CM = 1;

// Readings are stored with one decimal; rounding avoids 42.3 − 41 = 1.2999…
const roundTenth = (cm: number) => Math.round(cm * 10) / 10;

export function litersPerCm(lengthM: number, widthM: number): number {
  // 1 cm of level over the floor area: m × m × 0.01 m = m³/100, and 1 m³ = 1,000 L
  return lengthM * widthM * 10;
}

export function computeVerdict(input: VerdictInput): VerdictResult {
  const perCm = litersPerCm(input.lengthM, input.widthM);
  const repeat = input.beforeRepeatCm ?? null;
  const spreadCm =
    repeat === null || input.beforeCm === null ? null : roundTenth(Math.abs(input.beforeCm - repeat));
  const errorCm = spreadCm === null ? DEFAULT_ERROR_CM : Math.max(MIN_ERROR_CM, spreadCm);
  // Two readings (before and after), each off by up to errorCm
  const toleranceLiters = Math.round(2 * errorCm * perCm);
  const precision = { toleranceLiters, errorCm, spreadCm };

  const couldntMeasure = (reason: string): VerdictResult => ({
    measuredLiters: null,
    ...precision,
    measuredRange: null,
    belowClaimInsideMargin: false,
    verdict: "couldnt_measure",
    reason,
  });

  if (input.beforeCm === null || input.afterCm === null) {
    return couldntMeasure("Falta la lectura de antes o de después.");
  }
  if (input.pumpRan) {
    return couldntMeasure("La bomba al tinaco estuvo prendida: salió agua mientras entraba.");
  }
  if (input.overflowed) {
    return couldntMeasure("La cisterna se desbordó: no sabemos cuánta agua se tiró.");
  }
  if (input.afterCm >= input.maxHeightCm) {
    return couldntMeasure("El nivel de después llegó a la altura máxima: la cisterna pudo desbordarse.");
  }

  const measuredLiters = Math.round((input.afterCm - input.beforeCm) * perCm);
  const measured = {
    measuredLiters,
    ...precision,
    measuredRange: {
      low: Math.max(0, measuredLiters - toleranceLiters),
      high: Math.max(0, measuredLiters + toleranceLiters),
    },
  };

  if (measuredLiters >= input.litersClaimed - toleranceLiters) {
    return {
      ...measured,
      belowClaimInsideMargin: measuredLiters < input.litersClaimed,
      verdict: "consistent",
      reason: `Entraron los litros que dijo el pipero, dentro del margen de medición de ${formatLitersWord(toleranceLiters)}.`,
    };
  }

  return {
    ...measured,
    belowClaimInsideMargin: false,
    verdict: "short",
    reason: `Entraron menos litros de los que dijo el pipero, más allá del margen de medición de ${formatLitersWord(toleranceLiters)}.`,
  };
}

// "Entraron unos 100 L menos de lo que dijo el pipero, dentro del margen de medición de 150 litros."
// Only for a consistent delivery below the claim; null when the difference rounds to under 10 L.
export function insideMarginNote(result: VerdictResult, litersClaimed: number): string | null {
  if (!result.belowClaimInsideMargin || result.measuredLiters === null) return null;
  const less = Math.round((litersClaimed - result.measuredLiters) / 10) * 10;
  if (less < 10) return null;
  return `Entraron unos ${formatLiters(less)} menos de lo que dijo el pipero, dentro del margen de medición de ${formatLitersWord(result.toleranceLiters)}.`;
}

// The grey box under the verdict: how precise this measurement was
export function precisionNote(result: VerdictResult): string {
  if (result.spreadCm === null) {
    return "Medida una vez: usamos un margen de 2 cm por lectura. Medir dos veces lo hace más preciso.";
  }
  return `Precisión de tu medición: medida dos veces, diferencia de ${formatCm(result.spreadCm)} cm`;
}

const formatCm = (cm: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(cm);
