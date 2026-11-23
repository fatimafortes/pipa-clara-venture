import { formatDay, formatLiters, formatMxn, formatTime } from "./format";
import { valueOfMeasured } from "./shares";
import { VERDICT_LABEL, varianceText, type Verdict } from "./verdict";

// The WhatsApp summary for the neighbors (CHARTER principle 3): what entered,
// what was paid and why, what each household owes and how many have paid.
// Never who owes: it doesn't even receive household labels. Challenge notes are
// included (persona test), so the challenge form warns: no names in the note.

const raisedByLabel = { driver: "El pipero", neighbor: "Un vecino", organizer: "La organizadora" } as const;

export type SummaryReading = { takenAt: string; hasPhoto: boolean } | null;

export type SummaryInput = {
  deliveredAt: string;
  litersClaimed: number;
  measuredLiters: number | null;
  verdict: Verdict;
  toleranceLiters: number;
  // "Entraron unos X L menos…, dentro del margen…" when it applies (insideMarginNote)
  insideMarginNote?: string | null;
  before: SummaryReading;
  after: SummaryReading;
  driverPresent: boolean;
  priceMxn: number; // what the driver asked
  paidMxn: number; // what the organizer actually paid him
  feeMxn: number; // per household
  // The whole pipa's fee when it came from a collection ($10); overrides feeMxn × households
  feeTotalMxn?: number | null;
  shareAmounts: number[];
  paidCount: number;
  challenges: { raisedBy: keyof typeof raisedByLabel; note: string }[];
};

function readingLine(label: string, reading: SummaryReading, extra?: string): string | null {
  if (!reading) return null;
  const parts = [formatTime(reading.takenAt), extra, reading.hasPhoto ? "con foto guardada" : null];
  return `Lectura de ${label}: ${parts.filter(Boolean).join(", ")}`;
}

// How much the driver was paid, and why: the consequence of the verdict
export function paymentLine(s: SummaryInput): string {
  const shortBy = s.measuredLiters === null ? 0 : s.litersClaimed - s.measuredLiters;
  if (s.verdict !== "short" || s.measuredLiters === null) {
    return `Se le pagó al pipero: ${formatMxn(s.paidMxn)}.`;
  }
  if (s.paidMxn >= s.priceMxn) {
    return `Se le pagó al pipero el precio completo, ${formatMxn(s.priceMxn)}, aunque faltaron ${formatLiters(shortBy)}.`;
  }
  const worth = valueOfMeasured(s.measuredLiters, s.litersClaimed, s.priceMxn);
  const why =
    s.paidMxn === worth
      ? `lo que vale el agua que sí entró (${formatLiters(s.measuredLiters)} de ${formatLiters(s.litersClaimed)})`
      : `por el faltante de ${formatLiters(shortBy)} (lo que sí entró vale ${formatMxn(worth)})`;
  return `Se le pagó al pipero ${formatMxn(s.paidMxn)} de los ${formatMxn(s.priceMxn)} que pedía: ${why}.`;
}

export function buildSummary(s: SummaryInput): string {
  const households = s.shareAmounts.length;
  const low = Math.min(...s.shareAmounts);
  const high = Math.max(...s.shareAmounts);
  const fee = s.feeTotalMxn ?? s.feeMxn * households;
  const margin = varianceText(s.toleranceLiters);

  const verdictLine =
    s.verdict === "short" && s.measuredLiters !== null
      ? `Veredicto: ${VERDICT_LABEL.short}, ${formatLiters(s.litersClaimed - s.measuredLiters)} menos (${margin})`
      : s.verdict === "consistent"
        ? `Veredicto: ${VERDICT_LABEL.consistent} (${margin})`
        : "Veredicto: NO SE PUDO MEDIR";

  const lines: (string | null)[] = [
    `Pipa Clara · Pipa del ${formatDay(s.deliveredAt)}`,
    "",
    `Litros que dijo el pipero: ${formatLiters(s.litersClaimed)}`,
    `Litros que entraron (medidos): ${
      s.measuredLiters === null ? "no se pudo medir" : formatLiters(s.measuredLiters)
    }`,
    verdictLine,
    s.verdict === "consistent" ? (s.insideMarginNote ?? null) : null,
    readingLine("antes", s.before, s.driverPresent ? "con el pipero presente" : "sin el pipero"),
    readingLine("después", s.after),
    "",
    paymentLine(s),
    `Cada hogar paga: ${low === high ? formatMxn(low) : `${formatMxn(low)} o ${formatMxn(high)}`}`,
    low === high ? null : UNEVEN_SHARES_NOTE,
    `(pipa ${formatMxn(s.paidMxn)} + cuota de Pipa Clara ${formatMxn(fee)}, en partes iguales)`,
    `Ya pagaron: ${s.paidCount} de ${households}`,
  ];

  if (s.challenges.length > 0) {
    lines.push("", "Desacuerdos registrados:");
    for (const c of s.challenges) {
      lines.push(`- ${raisedByLabel[c.raisedBy]}: "${c.note}"`);
    }
  }

  return lines.filter((line) => line !== null).join("\n");
}

// Next to "$251 o $252" everywhere (Week 15 persona test)
export const UNEVEN_SHARES_NOTE = "Para que sume exacto, a algunas casas les toca $1 más.";

export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
