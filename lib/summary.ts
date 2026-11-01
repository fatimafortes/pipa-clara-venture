import { formatDay, formatLiters, formatLitersWord, formatMxn, formatTime } from "./format";
import { valueOfMeasured } from "./shares";
import type { Verdict } from "./verdict";

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
  before: SummaryReading;
  after: SummaryReading;
  driverPresent: boolean;
  priceMxn: number; // what the driver asked
  paidMxn: number; // what the organizer actually paid him
  feeMxn: number;
  shareAmounts: number[];
  paidCount: number;
  challenges: { raisedBy: keyof typeof raisedByLabel; note: string }[];
};

function readingLine(label: string, reading: SummaryReading, extra?: string): string | null {
  if (!reading) return null;
  const parts = [formatTime(reading.takenAt), extra, reading.hasPhoto ? "con foto guardada" : "sin foto"];
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
  const fee = s.feeMxn * households;
  const margin = `margen de medición de ${formatLitersWord(s.toleranceLiters)}`;

  const verdictLine =
    s.verdict === "short" && s.measuredLiters !== null
      ? `Veredicto: FALTANTE de ${formatLiters(s.litersClaimed - s.measuredLiters)} (${margin})`
      : s.verdict === "consistent"
        ? `Veredicto: CONSISTENTE (${margin})`
        : "Veredicto: NO SE PUDO MEDIR";

  const lines: (string | null)[] = [
    `Pipa Clara · Pipa del ${formatDay(s.deliveredAt)}`,
    "",
    `Litros que dijo el pipero: ${formatLiters(s.litersClaimed)}`,
    `Litros que entraron (medidos): ${
      s.measuredLiters === null ? "no se pudo medir" : formatLiters(s.measuredLiters)
    }`,
    verdictLine,
    readingLine("antes", s.before, s.driverPresent ? "con el pipero presente" : "sin el pipero"),
    readingLine("después", s.after),
    "",
    paymentLine(s),
    `Cada hogar paga: ${low === high ? formatMxn(low) : `${formatMxn(low)} o ${formatMxn(high)}`}`,
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

export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
