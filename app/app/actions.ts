"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/names";
import { validateCistern, type FieldErrors } from "@/lib/validation";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export type CisternFormState = {
  errors: FieldErrors;
  // What she typed, so the form doesn't empty itself when there is a mistake
  values: Record<string, string>;
  labels: string[];
};

export async function createCistern(
  _prev: CisternFormState,
  formData: FormData,
): Promise<CisternFormState> {
  const { supabase } = await requireUser();

  const values = {
    name: String(formData.get("name") ?? ""),
    lengthM: String(formData.get("lengthM") ?? ""),
    widthM: String(formData.get("widthM") ?? ""),
    maxHeightCm: String(formData.get("maxHeightCm") ?? ""),
    householdsCount: String(formData.get("householdsCount") ?? ""),
  };
  const labels = formData.getAll("labels").map(String);

  const result = validateCistern({ ...values, labels });
  if (!result.ok) {
    console.warn("[createCistern] validation failed:", Object.keys(result.errors).join(", "));
    return { errors: result.errors, values, labels };
  }

  const cistern = result.value;
  // .select().single() makes Supabase return the saved row, so "no error" can't hide "nothing saved"
  const { data, error } = await supabase
    .from(TABLES.cisterns)
    .insert({
      name: cistern.name,
      length_m: cistern.lengthM,
      width_m: cistern.widthM,
      max_height_cm: cistern.maxHeightCm,
      households_count: cistern.householdsCount,
      household_labels: cistern.labels,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createCistern] insert failed:", error?.code, error?.message, error?.details, error?.hint);
    return {
      errors: { form: `No se pudo guardar la cisterna. Intenta otra vez. (código: ${error?.code ?? "sin fila"})` },
      values,
      labels,
    };
  }

  console.info("[createCistern] saved", data.id);
  // A full redirect re-reads /app from the database instead of trusting any cached page
  redirect("/app");
}
