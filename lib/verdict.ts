// The engine (PACKET §6): compares the liters the driver claims against the liters
// measured in the cistern. Pure arithmetic, no AI: the organizer can check it by hand.
import { formatLitersWord } from "./format";

export type Verdict = "consistent" | "short" | "couldnt_measure";

export type VerdictInput = {
  lengthM: number;
  widthM: number;
  maxHeightCm: number;
  beforeCm: number | null;
  afterCm: number | null;
  litersClaimed: number;
  pumpRan: boolean;
  overflowed: boolean;
};

export type VerdictResult = {
  // null when the delivery couldn't be measured: we never show a number we don't trust
  measuredLiters: number | null;
  toleranceLiters: number;
  verdict: Verdict;
  // Shown on screen, so it is in Spanish
  reason: string;
};

// Each reading can be off by ±2 cm, so the two readings together by up to 4 cm
const TOLERANCE_CM = 4;

export function litersPerCm(lengthM: number, widthM: number): number {
  // 1 cm of level over the floor area: m × m × 0.01 m = m³/100, and 1 m³ = 1,000 L
  return lengthM * widthM * 10;
}

export function computeVerdict(input: VerdictInput): VerdictResult {
  const perCm = litersPerCm(input.lengthM, input.widthM);
  const toleranceLiters = Math.round(TOLERANCE_CM * perCm);

  const couldntMeasure = (reason: string): VerdictResult => ({
    measuredLiters: null,
    toleranceLiters,
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

  if (measuredLiters >= input.litersClaimed - toleranceLiters) {
    return {
      measuredLiters,
      toleranceLiters,
      verdict: "consistent",
      reason: `Entraron los litros que dijo el pipero, dentro del margen de medición de ${formatLitersWord(toleranceLiters)}.`,
    };
  }

  return {
    measuredLiters,
    toleranceLiters,
    verdict: "short",
    reason: `Entraron menos litros de los que dijo el pipero, más allá del margen de medición de ${formatLitersWord(toleranceLiters)}.`,
  };
}
