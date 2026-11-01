// Splits a delivery's total (price + fee) into equal shares in whole pesos.
// Never loses or invents a peso: the remainder goes one peso at a time to the
// first households in the list, so the shares always add up to the total.
export function splitShares(totalMxn: number, households: number): number[] {
  if (!Number.isInteger(totalMxn) || totalMxn < 0) {
    throw new Error("totalMxn must be a whole, non-negative number of pesos");
  }
  if (!Number.isInteger(households) || households < 1) {
    throw new Error("households must be a whole number, at least 1");
  }

  const base = Math.floor(totalMxn / households);
  const remainder = totalMxn - base * households;

  return Array.from({ length: households }, (_, i) => (i < remainder ? base + 1 : base));
}
