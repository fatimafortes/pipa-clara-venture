import { collectionShares, type CollectionShare } from "./collection";
import { buildSummary } from "./summary";
import { computeVerdict, insideMarginNote, type VerdictInput } from "./verdict";

// /demo (F4): fixed example data, same numbers as the Week 15 mockup and the homepage.
// Runs entirely in the browser through the same pure functions as the app: no login,
// no database, no real photos, no real names.

export const DEMO = {
  cistern: { name: "Cisterna de ejemplo", lengthM: 3, widthM: 2.5, maxHeightCm: 200 },
  labels: ["Casa 1", "Casa 2", "Casa 3", "Casa 4", "Casa 5", "Casa 6"],
  priceMxn: 1_500,
  feeMxn: 10,
  agreedDate: "2026-11-27", // a Friday, as in the mockup
  litersClaimed: 10_000,
  beforeCm: 20,
  afterCm: 152,
  deliveredAt: "2026-11-27T15:00:00Z",
  beforeAt: "2026-11-27T15:02:00Z",
  afterAt: "2026-11-27T15:41:00Z",
} as const;

// Where the demo starts: 5 de 6, Casa 4 promised for the agreed Friday (the mockup)
export function demoStartShares(): CollectionShare[] {
  return collectionShares(DEMO.priceMxn, DEMO.feeMxn, [...DEMO.labels]).map((s) =>
    s.label === "Casa 4"
      ? { ...s, state: "promised", promisedFor: DEMO.agreedDate }
      : { ...s, state: "received" },
  );
}

export const demoVerdictInput: VerdictInput = {
  lengthM: DEMO.cistern.lengthM,
  widthM: DEMO.cistern.widthM,
  maxHeightCm: DEMO.cistern.maxHeightCm,
  beforeCm: DEMO.beforeCm,
  afterCm: DEMO.afterCm,
  litersClaimed: DEMO.litersClaimed,
  pumpRan: false,
  overflowed: false,
};

export function demoVerdict() {
  const result = computeVerdict(demoVerdictInput);
  return { result, note: insideMarginNote(result, DEMO.litersClaimed) };
}

export function demoSummary(shares: CollectionShare[]): string {
  const { result, note } = demoVerdict();
  return buildSummary({
    deliveredAt: DEMO.deliveredAt,
    litersClaimed: DEMO.litersClaimed,
    measuredLiters: result.measuredLiters,
    verdict: result.verdict,
    toleranceLiters: result.toleranceLiters,
    insideMarginNote: note,
    before: { takenAt: DEMO.beforeAt, hasPhoto: false },
    after: { takenAt: DEMO.afterAt, hasPhoto: false },
    driverPresent: true,
    priceMxn: DEMO.priceMxn,
    paidMxn: DEMO.priceMxn,
    feeMxn: 0,
    feeTotalMxn: DEMO.feeMxn,
    shareAmounts: shares.map((s) => s.amountMxn),
    paidCount: shares.filter((s) => s.state === "received").length,
    challenges: [],
  });
}
