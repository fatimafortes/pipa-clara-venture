"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCistern, getDelivery, requireUser } from "@/lib/data";
import { logEvent } from "@/lib/events";
import { isOwnPhotoPath } from "@/lib/photo";
import { splitShares } from "@/lib/shares";
import { PHOTO_BUCKET, TABLES } from "@/lib/supabase/names";
import { validateChallenge, validateDelivery, validateDriverPayment, type FieldErrors } from "@/lib/validation";
import { computeVerdict } from "@/lib/verdict";

export type DeliveryFormState = {
  errors: FieldErrors;
  values: Record<string, string>;
};

// When Supabase received the photo: the reading's timestamp, set by the server, not the phone
async function photoUploadedAt(supabase: SupabaseClient, path: string): Promise<string | null> {
  const [folder, file] = path.split("/");
  const { data } = await supabase.storage.from(PHOTO_BUCKET).list(folder, { search: file, limit: 1 });
  return data?.find((object) => object.name === file)?.created_at ?? null;
}

export async function createDelivery(
  _prev: DeliveryFormState,
  formData: FormData,
): Promise<DeliveryFormState> {
  const { supabase, user } = await requireUser();
  const cistern = await getCistern();
  if (!cistern) redirect("/app");

  const field = (key: string) => String(formData.get(key) ?? "");
  const values = {
    litersClaimed: field("litersClaimed"),
    priceMxn: field("priceMxn"),
    feeMxn: field("feeMxn"),
    beforeCm: field("beforeCm"),
    beforeRepeatCm: field("beforeRepeatCm"),
    afterCm: field("afterCm"),
    driverPresent: field("driverPresent"),
    pumpRan: field("pumpRan"),
    overflowed: field("overflowed"),
  };

  const result = validateDelivery(
    { ...values, pumpRan: values.pumpRan === "on", overflowed: values.overflowed === "on" },
    Number(cistern.max_height_cm),
  );
  if (!result.ok) {
    console.warn("[createDelivery] validation failed:", Object.keys(result.errors).join(", "));
    return { errors: result.errors, values };
  }
  const input = result.value;

  // Only accept photo paths inside her own folder
  const photo = (key: string) => (isOwnPhotoPath(field(key), user.id) ? field(key) : null);
  const beforePhoto = photo("beforePhoto");
  const afterPhoto = photo("afterPhoto");
  const now = new Date().toISOString();
  const [beforeTakenAt, afterTakenAt] = await Promise.all([
    beforePhoto ? photoUploadedAt(supabase, beforePhoto) : null,
    afterPhoto ? photoUploadedAt(supabase, afterPhoto) : null,
  ]);

  const verdict = computeVerdict({
    lengthM: Number(cistern.length_m),
    widthM: Number(cistern.width_m),
    maxHeightCm: Number(cistern.max_height_cm),
    beforeCm: input.beforeCm,
    beforeRepeatCm: input.beforeRepeatCm,
    afterCm: input.afterCm,
    litersClaimed: input.litersClaimed,
    pumpRan: input.pumpRan,
    overflowed: input.overflowed,
  });

  const { data: delivery, error: deliveryError } = await supabase
    .from(TABLES.deliveries)
    .insert({
      cistern_id: cistern.id,
      liters_claimed: input.litersClaimed,
      price_mxn: input.priceMxn,
      fee_mxn: input.feeMxn,
      pump_ran: input.pumpRan,
      overflowed: input.overflowed,
      measured_liters: verdict.measuredLiters,
      verdict: verdict.verdict,
    })
    .select("id")
    .single();

  const failed = (where: string, error: { code?: string; message: string; details?: string | null }) => {
    console.error(`[createDelivery] ${where} failed:`, error.code, error.message, error.details);
    return {
      errors: { form: `No se pudo guardar la pipa. Intenta otra vez. (código: ${error.code ?? "?"})` },
      values,
    };
  };
  if (deliveryError) return failed("delivery", deliveryError);

  const readings = [
    {
      delivery_id: delivery.id,
      kind: "before",
      level_cm: input.beforeCm,
      repeat_level_cm: input.beforeRepeatCm,
      photo_path: beforePhoto,
      driver_present: values.driverPresent === "on",
      taken_at: beforeTakenAt ?? now,
    },
    ...(input.afterCm === null
      ? []
      : [
          {
            delivery_id: delivery.id,
            kind: "after",
            level_cm: input.afterCm,
            photo_path: afterPhoto,
            driver_present: false,
            taken_at: afterTakenAt ?? now,
          },
        ]),
  ];

  const total = input.priceMxn + input.feeMxn * cistern.households_count;
  const shares = splitShares(total, cistern.households_count).map((amount, i) => ({
    delivery_id: delivery.id,
    household_label: cistern.household_labels[i],
    amount_mxn: amount,
  }));

  const [readingsResult, sharesResult] = await Promise.all([
    supabase.from(TABLES.readings).insert(readings),
    supabase.from(TABLES.shares).insert(shares),
  ]);
  const childError = readingsResult.error ?? sharesResult.error;
  if (childError) {
    // Don't leave a delivery without its readings or shares; deleting it removes its children too
    await supabase.from(TABLES.deliveries).delete().eq("id", delivery.id);
    return failed("readings/shares", childError);
  }

  console.info("[createDelivery] saved", delivery.id, verdict.verdict);
  await logEvent("delivery_saved", delivery.id);
  redirect(`/app/pipa/${delivery.id}`);
}

const isUuid = (value: string) => /^[0-9a-f-]{36}$/.test(value);

// Paid / pending for one household. Only the organizer sees which; neighbors get a count.
export async function setSharePaid(formData: FormData) {
  const { supabase } = await requireUser();
  const deliveryId = String(formData.get("deliveryId") ?? "");
  const shareId = String(formData.get("shareId") ?? "");
  const paid = formData.get("paid") === "true";
  if (!isUuid(deliveryId) || !isUuid(shareId)) redirect("/app");

  const { data, error } = await supabase
    .from(TABLES.shares)
    .update({ paid })
    .eq("id", shareId)
    .eq("delivery_id", deliveryId)
    .select("id")
    .single();
  if (error || !data) {
    console.error("[setSharePaid] update failed:", error?.code, error?.message);
    redirect(`/app/pipa/${deliveryId}?error=pago`);
  }

  console.info("[setSharePaid]", shareId, paid ? "paid" : "pending");
  // Re-renders this page with the saved value, without jumping back to the top
  refresh();
}

export type ChallengeFormState = { errors: FieldErrors; values: Record<string, string> };

// A challenge is evidence too: the database allows adding it, never editing or deleting it
export async function createChallenge(
  deliveryId: string,
  _prev: ChallengeFormState,
  formData: FormData,
): Promise<ChallengeFormState> {
  const { supabase } = await requireUser();
  const values = { raisedBy: String(formData.get("raisedBy") ?? ""), note: String(formData.get("note") ?? "") };

  const result = validateChallenge(values);
  if (!result.ok) {
    console.warn("[createChallenge] validation failed:", Object.keys(result.errors).join(", "));
    return { errors: result.errors, values };
  }

  const { data, error } = await supabase
    .from(TABLES.challenges)
    .insert({ delivery_id: deliveryId, raised_by: result.value.raisedBy, note: result.value.note })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[createChallenge] insert failed:", error?.code, error?.message, error?.details);
    return {
      errors: { form: `No se pudo guardar el desacuerdo. Intenta otra vez. (código: ${error?.code ?? "sin fila"})` },
      values,
    };
  }

  console.info("[createChallenge] saved", data.id);
  await logEvent("challenge_saved", deliveryId);
  redirect(`/app/pipa/${deliveryId}#desacuerdos`);
}

// Called from the verdict page in the browser: when it opens, and when she presses
// "Mandar resumen por WhatsApp". Only these two names; anything else is ignored.
export async function logDeliveryEvent(name: "verdict_viewed" | "summary_sent", deliveryId: string) {
  if ((name !== "verdict_viewed" && name !== "summary_sent") || !isUuid(deliveryId)) return;
  // No requireUser(): its redirect would move her to /login from a background call.
  // Without a session the insert is simply rejected by RLS and logged.
  await logEvent(name, deliveryId);
}

// Called from /app in the browser when it opens: the visit, even without a new sign-in
export async function logAppOpened() {
  await logEvent("app_opened");
}

export type DriverPaymentState = { errors: FieldErrors; values: Record<string, string> };

// "¿Cuánto le pagaste al pipero?" (persona-test fix): the app labels, the organizer decides.
// Saves what she actually paid and re-splits the households' shares on that amount.
export async function setDriverPayment(
  deliveryId: string,
  _prev: DriverPaymentState,
  formData: FormData,
): Promise<DriverPaymentState> {
  const { supabase } = await requireUser();
  const detail = await getDelivery(deliveryId);
  if (!detail) redirect("/app");
  const { delivery, shares } = detail;

  const values = { choice: String(formData.get("choice") ?? ""), otherMxn: String(formData.get("otherMxn") ?? "") };
  const result = validateDriverPayment(values, delivery.price_mxn);
  if (!result.ok) return { errors: result.errors, values };
  const paidMxn = result.value;

  const failed = (where: string, error: { code?: string; message: string } | null) => {
    console.error(`[setDriverPayment] ${where} failed:`, error?.code, error?.message);
    return { errors: { form: `No se pudo guardar el pago. Intenta otra vez. (código: ${error?.code ?? "sin fila"})` }, values };
  };

  const { data, error } = await supabase
    .from(TABLES.deliveries)
    .update({ paid_mxn: paidMxn })
    .eq("id", deliveryId)
    .select("id")
    .single();
  if (error || !data) return failed("delivery", error);

  // Shares follow the money actually paid; who already paid stays as it was
  const amounts = splitShares(paidMxn + delivery.fee_mxn * shares.length, shares.length);
  const updates = await Promise.all(
    shares.map((share, i) =>
      supabase.from(TABLES.shares).update({ amount_mxn: amounts[i] }).eq("id", share.id).select("id").single(),
    ),
  );
  const shareError = updates.find((u) => u.error || !u.data);
  if (shareError) return failed("shares", shareError.error);

  console.info("[setDriverPayment]", deliveryId, paidMxn, "of", delivery.price_mxn);
  redirect(`/app/pipa/${deliveryId}`);
}
