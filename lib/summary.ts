import { formatDay, formatLiters, formatMxn, formatTime } from "./format";
import type { Verdict } from "./verdict";

// The WhatsApp summary for the neighbors (CHARTER principle 3): what entered,
// what each household owes and how many have paid. Never who: no household
// labels and no challenge notes (a note could contain a name), only counts.
export type SummaryInput = {
  deliveredAt: string;
  litersClaimed: number;
  measuredLiters: number | null;
  verdict: Verdict;
  toleranceLiters: number;
  beforeTakenAt: string | null;
  driverPresent: boolean;
  priceMxn: number;
  feeMxn: number;
  shareAmounts: number[];
  paidCount: number;
  challengesCount: number;
};

export function buildSummary(s: SummaryInput): string {
  const households = s.shareAmounts.length;
  const low = Math.min(...s.shareAmounts);
  const high = Math.max(...s.shareAmounts);
  const fee = s.feeMxn * households;

  const verdictLine =
    s.verdict === "short" && s.measuredLiters !== null
      ? `Veredicto: FALTANTE de ${formatLiters(s.litersClaimed - s.measuredLiters)} (margen de medición ±${formatLiters(s.toleranceLiters)})`
      : s.verdict === "consistent"
        ? `Veredicto: CONSISTENTE (margen de medición ±${formatLiters(s.toleranceLiters)})`
        : "Veredicto: NO SE PUDO MEDIR";

  const lines = [
    `Pipa Clara · Pipa del ${formatDay(s.deliveredAt)}`,
    "",
    `Litros que dijo el pipero: ${formatLiters(s.litersClaimed)}`,
    `Litros que entraron (medidos): ${
      s.measuredLiters === null ? "no se pudo medir" : formatLiters(s.measuredLiters)
    }`,
    verdictLine,
  ];

  if (s.beforeTakenAt) {
    lines.push(
      `Lectura de antes: ${formatTime(s.beforeTakenAt)}, ${
        s.driverPresent ? "con el pipero presente" : "sin el pipero"
      }, con foto guardada`,
    );
  }

  lines.push(
    "",
    `Cada hogar paga: ${low === high ? formatMxn(low) : `${formatMxn(low)} o ${formatMxn(high)}`}`,
    `(pipa ${formatMxn(s.priceMxn)} + cuota de Pipa Clara ${formatMxn(fee)}, en partes iguales)`,
    `Ya pagaron: ${s.paidCount} de ${households}`,
  );

  if (s.challengesCount > 0) {
    lines.push(
      "",
      s.challengesCount === 1
        ? "Hay 1 desacuerdo registrado junto a este veredicto."
        : `Hay ${s.challengesCount} desacuerdos registrados junto a este veredicto.`,
    );
  }

  return lines.join("\n");
}

export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
