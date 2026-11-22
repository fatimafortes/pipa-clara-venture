import { splitShares } from "./shares";

// "Juntar antes de pedir" (PACKET §8, F1). Pure functions, so the app, /demo and the
// tests share the same rules. The 100% rule: the pipa is ordered only when every
// household has given its share; a promise is not money, so it doesn't count.

export type ShareState = "pending" | "promised" | "received";
export type CollectionStatus = "collecting" | "ready" | "ordered";

export type CollectionShare = {
  label: string;
  amountMxn: number;
  state: ShareState;
  // "YYYY-MM-DD", only when state = "promised"
  promisedFor?: string | null;
};

// What each household gives: (pipero's price + Pipa Clara's fee for the pipa) in equal
// shares. Same split as a delivery: no peso lost or invented, leftover pesos go first.
export function collectionShares(priceMxn: number, feeMxn: number, labels: string[]): CollectionShare[] {
  return splitShares(priceMxn + feeMxn, labels.length).map((amountMxn, i) => ({
    label: labels[i],
    amountMxn,
    state: "pending",
    promisedFor: null,
  }));
}

export function receivedCount(shares: Pick<CollectionShare, "state">[]): number {
  return shares.filter((s) => s.state === "received").length;
}

// How many households are still missing (pending or only promised)
export function missingCount(shares: Pick<CollectionShare, "state">[]): number {
  return shares.length - receivedCount(shares);
}

export function collectionStatus(
  shares: Pick<CollectionShare, "state">[],
  linkedDeliveryId: string | null,
): CollectionStatus {
  if (linkedDeliveryId) return "ordered";
  return shares.length > 0 && missingCount(shares) === 0 ? "ready" : "collecting";
}

export function isReady(shares: Pick<CollectionShare, "state">[]): boolean {
  return shares.length > 0 && missingCount(shares) === 0;
}

export function collectedMxn(shares: CollectionShare[]): number {
  return shares.filter((s) => s.state === "received").reduce((sum, s) => sum + s.amountMxn, 0);
}

// "Listo para pedir (falta 1)" / "(faltan 2)"
export function readyButtonLabel(shares: Pick<CollectionShare, "state">[]): string {
  const missing = missingCount(shares);
  if (missing === 0) return "Listo para pedir";
  return `Listo para pedir (${missing === 1 ? "falta 1" : `faltan ${missing}`})`;
}

// After a short verdict, if she paid the pipero less than what was collected:
// how much each household gave above its new share. Positive = she holds it.
// She decides whether to return it or keep it for the next pipa (no credit system).
export function differencePerHousehold(
  collected: { label: string; amountMxn: number }[],
  owed: { label: string; amountMxn: number }[],
): { label: string; amountMxn: number }[] {
  const owedBy = new Map(owed.map((s) => [s.label, s.amountMxn]));
  return collected.map((s) => ({ label: s.label, amountMxn: Math.max(0, s.amountMxn - (owedBy.get(s.label) ?? s.amountMxn)) }));
}
