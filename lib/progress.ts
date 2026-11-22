import { receivedCount, type CollectionShare } from "./collection";
import { formatDateOnly } from "./format";

// The WhatsApp progress message for the group (F2). Counts only, never who:
// it doesn't even receive the household labels (CHARTER principle 3).
export type ProgressInput = {
  shares: Pick<CollectionShare, "state">[];
  agreedDate?: string | null; // "YYYY-MM-DD"
};

export function buildProgressMessage({ shares, agreedDate }: ProgressInput): string {
  const total = shares.length;
  const received = receivedCount(shares);
  const lines = [`Pipa Clara · Juntando para la pipa: ${received} de ${total} ya dieron su parte.`];
  if (agreedDate) lines.push(`Fecha que acordó el grupo: ${formatDateOnly(agreedDate)}.`);
  lines.push(received === total ? "Ya estamos todos: se pide la pipa." : "Cuando estemos todos, se pide.");
  return lines.join(" ");
}
