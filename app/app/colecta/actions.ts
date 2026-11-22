"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { collectionShares } from "@/lib/collection";
import { getCistern, getCollection, getCollections, requireUser } from "@/lib/data";
import { TABLES } from "@/lib/supabase/names";
import { validateCollection, validateShareState, type FieldErrors } from "@/lib/validation";

export type CollectionFormState = { errors: FieldErrors; values: Record<string, string> };

const isUuid = (value: string) => /^[0-9a-f-]{36}$/.test(value);

// "Nueva colecta": one open collection per cistern, with one share per household
export async function createCollection(
  _prev: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  const { supabase } = await requireUser();
  const cistern = await getCistern();
  if (!cistern) redirect("/app");

  const values = {
    priceMxn: String(formData.get("priceMxn") ?? ""),
    feeMxn: String(formData.get("feeMxn") ?? ""),
    agreedDate: String(formData.get("agreedDate") ?? ""),
  };
  const result = validateCollection(values);
  if (!result.ok) return { errors: result.errors, values };

  // Only one at a time: otherwise the same households would be asked twice
  const open = (await getCollections(cistern)).find((c) => !c.deliveryId);
  if (open) redirect(`/app/colecta/${open.id}`);

  const { data: collection, error } = await supabase
    .from(TABLES.collections)
    .insert({
      cistern_id: cistern.id,
      price_mxn: result.value.priceMxn,
      fee_mxn: result.value.feeMxn,
      agreed_date: result.value.agreedDate,
    })
    .select("id")
    .single();
  const failed = (where: string, e: { code?: string; message: string } | null) => {
    console.error(`[createCollection] ${where} failed:`, e?.code, e?.message);
    return { errors: { form: `No se pudo abrir la colecta. Intenta otra vez. (código: ${e?.code ?? "?"})` }, values };
  };
  if (error || !collection) return failed("collection", error);

  const shares = collectionShares(result.value.priceMxn, result.value.feeMxn, cistern.household_labels).map((s) => ({
    collection_id: collection.id,
    household_label: s.label,
    amount_mxn: s.amountMxn,
  }));
  const { error: sharesError } = await supabase.from(TABLES.collectionShares).insert(shares);
  if (sharesError) {
    // Never leave a collection without its shares
    await supabase.from(TABLES.collections).delete().eq("id", collection.id);
    return failed("shares", sharesError);
  }

  console.info("[createCollection] opened", collection.id);
  redirect(`/app/colecta/${collection.id}`);
}

// Received / promised for a date / back to pending, for one household. Only she sees which.
export async function setCollectionShare(formData: FormData) {
  const { supabase } = await requireUser();
  const collectionId = String(formData.get("collectionId") ?? "");
  const shareId = String(formData.get("shareId") ?? "");
  if (!isUuid(collectionId) || !isUuid(shareId)) redirect("/app");

  const result = validateShareState({
    state: String(formData.get("state") ?? ""),
    promisedFor: String(formData.get("promisedFor") ?? ""),
  });
  if (!result.ok) redirect(`/app/colecta/${collectionId}?error=fecha`);

  // Zero rows when the pipa was already registered (the database freezes the shares)
  const { data, error } = await supabase
    .from(TABLES.collectionShares)
    .update({ state: result.value.state, promised_for: result.value.promisedFor })
    .eq("id", shareId)
    .eq("collection_id", collectionId)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    console.error("[setCollectionShare] update failed:", error?.code ?? "no row", error?.message);
    redirect(`/app/colecta/${collectionId}?error=parte`);
  }

  console.info("[setCollectionShare]", shareId, result.value.state);
  refresh();
}

// Cancel a collection that has no pipa yet (e.g. she typed the wrong price)
export async function deleteCollection(formData: FormData) {
  const { supabase } = await requireUser();
  const collectionId = String(formData.get("collectionId") ?? "");
  if (!isUuid(collectionId)) redirect("/app");

  const found = await getCollection(collectionId);
  if (!found) redirect("/app");
  if (found.collection.deliveryId) redirect(`/app/colecta/${collectionId}`);

  const { error } = await supabase.from(TABLES.collections).delete().eq("id", collectionId);
  if (error) {
    console.error("[deleteCollection] failed:", error.code, error.message);
    redirect(`/app/colecta/${collectionId}?error=cancelar`);
  }
  console.info("[deleteCollection]", collectionId);
  redirect("/app");
}
