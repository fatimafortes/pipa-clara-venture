import "server-only";
import { redirect } from "next/navigation";
import type { Verdict } from "./verdict";
import { createClient } from "./supabase/server";
import { PHOTO_BUCKET, TABLES } from "./supabase/names";
import { retryOnFutureToken } from "./supabase/retry";

// Data access for the signed-in organizer. Every query goes through RLS,
// so even without a filter it can only ever return her own rows.

export type CisternRow = {
  id: string;
  name: string;
  length_m: number;
  width_m: number;
  max_height_cm: number;
  households_count: number;
  household_labels: string[];
};

export type DeliveryRow = {
  id: string;
  cistern_id: string;
  delivered_at: string;
  liters_claimed: number;
  price_mxn: number;
  fee_mxn: number;
  pump_ran: boolean;
  overflowed: boolean;
  measured_liters: number | null;
  verdict: Verdict;
  // What she actually paid the driver; null = the full price
  paid_mxn: number | null;
  // Set when the pipa was registered from a collection ("Juntar antes de pedir")
  collection_id: string | null;
  // The whole pipa's fee when it came from a collection; null = fee_mxn × households
  fee_total_mxn: number | null;
};

export type ReadingRow = {
  kind: "before" | "after";
  level_cm: number;
  // The precision check: "before" read a second time; null = measured once (and on "after")
  repeat_level_cm: number | null;
  photo_path: string | null;
  driver_present: boolean;
  taken_at: string;
};

export type ShareRow = {
  id: string;
  household_label: string;
  amount_mxn: number;
  paid: boolean;
};

export type ChallengeRow = {
  id: string;
  raised_by: "driver" | "neighbor" | "organizer";
  note: string;
  created_at: string;
};

const DELIVERY_COLUMNS =
  "id, cistern_id, delivered_at, liters_claimed, price_mxn, fee_mxn, pump_ran, overflowed, measured_liters, verdict, paid_mxn, collection_id, fee_total_mxn";

// Validates the session with Supabase; sends visitors without one to /login
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function getCistern(): Promise<CisternRow | null> {
  const { supabase } = await requireUser();
  const { data, error } = await retryOnFutureToken("getCistern", () =>
    supabase
      .from(TABLES.cisterns)
      .select("id, name, length_m, width_m, max_height_cm, households_count, household_labels")
      .order("created_at")
      .limit(1)
      .maybeSingle(),
  );
  if (error) throw error;
  return data;
}

export async function getDeliveries(): Promise<(DeliveryRow & { paidCount: number; sharesCount: number })[]> {
  const { supabase } = await requireUser();
  const { data, error } = await retryOnFutureToken("getDeliveries", () =>
    supabase
      .from(TABLES.deliveries)
      .select(
        `id, cistern_id, delivered_at, liters_claimed, price_mxn, fee_mxn, pump_ran, overflowed, measured_liters, verdict, paid_mxn, collection_id, fee_total_mxn, ${TABLES.shares}(paid)`,
      )
      .order("delivered_at", { ascending: false }),
  );
  if (error) throw error;
  return data.map(({ [TABLES.shares]: shares, ...delivery }) => ({
    ...(delivery as DeliveryRow),
    paidCount: (shares as { paid: boolean }[]).filter((s) => s.paid).length,
    sharesCount: (shares as { paid: boolean }[]).length,
  }));
}

export type DeliveryDetail = {
  delivery: DeliveryRow;
  cistern: CisternRow;
  readings: (ReadingRow & { photoUrl: string | null })[];
  shares: ShareRow[];
  challenges: ChallengeRow[];
};

export async function getDelivery(id: string): Promise<DeliveryDetail | null> {
  const { supabase } = await requireUser();

  const { data: delivery, error } = await retryOnFutureToken("getDelivery", () =>
    supabase
      .from(TABLES.deliveries)
      .select(DELIVERY_COLUMNS)
      .eq("id", id)
      .maybeSingle(),
  );
  // An id that isn't a uuid is just "not found", not a crash
  if (error?.code === "22P02") return null;
  if (error) throw error;
  if (!delivery) return null;

  const [cistern, readings, shares, challenges] = await Promise.all([
    supabase
      .from(TABLES.cisterns)
      .select("id, name, length_m, width_m, max_height_cm, households_count, household_labels")
      .eq("id", delivery.cistern_id)
      .single(),
    supabase
      .from(TABLES.readings)
      .select("kind, level_cm, repeat_level_cm, photo_path, driver_present, taken_at")
      .eq("delivery_id", id),
    supabase
      .from(TABLES.shares)
      .select("id, household_label, amount_mxn, paid")
      .eq("delivery_id", id),
    supabase
      .from(TABLES.challenges)
      .select("id, raised_by, note, created_at")
      .eq("delivery_id", id)
      .order("created_at"),
  ]);
  if (cistern.error) throw cistern.error;
  if (readings.error) throw readings.error;
  if (shares.error) throw shares.error;
  if (challenges.error) throw challenges.error;

  // The bucket is private: photos are shown through links that expire in 1 hour
  const paths = readings.data.flatMap((r) => (r.photo_path ? [r.photo_path] : []));
  const urls = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 3600);
    signed?.forEach((s) => s.path && s.signedUrl && urls.set(s.path, s.signedUrl));
  }

  return {
    delivery,
    cistern: cistern.data,
    readings: readings.data.map((r) => ({
      ...r,
      photoUrl: r.photo_path ? (urls.get(r.photo_path) ?? null) : null,
    })),
    // Same order as the organizer typed the households ("Depto 2" before "Depto 10")
    shares: shares.data.toSorted(
      (a, b) =>
        cistern.data.household_labels.indexOf(a.household_label) -
        cistern.data.household_labels.indexOf(b.household_label),
    ),
    challenges: challenges.data,
  };
}

// ---------------------------------------------------------------------------
// Collections ("Juntar antes de pedir", F1). Status is derived, never stored.
// ---------------------------------------------------------------------------

export type CollectionShareRow = {
  id: string;
  household_label: string;
  amount_mxn: number;
  state: "pending" | "promised" | "received";
  promised_for: string | null;
};

export type CollectionDetail = {
  id: string;
  cistern_id: string;
  price_mxn: number;
  fee_mxn: number;
  agreed_date: string | null;
  created_at: string;
  shares: CollectionShareRow[];
  // The delivery registered from it; null while collecting / ready
  deliveryId: string | null;
};

const COLLECTION_COLUMNS = `id, cistern_id, price_mxn, fee_mxn, agreed_date, created_at, ${TABLES.collectionShares}(id, household_label, amount_mxn, state, promised_for), ${TABLES.deliveries}(id)`;

type RawCollection = Omit<CollectionDetail, "shares" | "deliveryId"> & Record<string, unknown>;

function toCollection(raw: RawCollection, labels: string[]): CollectionDetail {
  const { [TABLES.collectionShares]: shares, [TABLES.deliveries]: deliveries, ...rest } = raw;
  // One-to-one through the unique collection_id: PostgREST may return an object or a list
  const linked = Array.isArray(deliveries) ? deliveries[0] : deliveries;
  return {
    ...(rest as Omit<CollectionDetail, "shares" | "deliveryId">),
    // Same order as the organizer typed the households
    shares: (shares as CollectionShareRow[]).toSorted(
      (a, b) => labels.indexOf(a.household_label) - labels.indexOf(b.household_label),
    ),
    deliveryId: (linked as { id: string } | null | undefined)?.id ?? null,
  };
}

// Her collections for this cistern, newest first
export async function getCollections(cistern: CisternRow): Promise<CollectionDetail[]> {
  const { supabase } = await requireUser();
  const { data, error } = await retryOnFutureToken("getCollections", () =>
    supabase
      .from(TABLES.collections)
      .select(COLLECTION_COLUMNS)
      .eq("cistern_id", cistern.id)
      .order("created_at", { ascending: false }),
  );
  if (error) throw error;
  return (data as unknown as RawCollection[]).map((c) => toCollection(c, cistern.household_labels));
}

export async function getCollection(id: string): Promise<{ collection: CollectionDetail; cistern: CisternRow } | null> {
  const { supabase } = await requireUser();
  const { data, error } = await retryOnFutureToken("getCollection", () =>
    supabase.from(TABLES.collections).select(COLLECTION_COLUMNS).eq("id", id).maybeSingle(),
  );
  if (error?.code === "22P02") return null;
  if (error) throw error;
  if (!data) return null;
  const raw = data as unknown as RawCollection;
  const { data: cistern, error: cisternError } = await supabase
    .from(TABLES.cisterns)
    .select("id, name, length_m, width_m, max_height_cm, households_count, household_labels")
    .eq("id", raw.cistern_id)
    .single();
  if (cisternError) throw cisternError;
  return { collection: toCollection(raw, cistern.household_labels), cistern };
}
