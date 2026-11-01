"use server";

import { refresh } from "next/cache";
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
  if (!result.ok) return { errors: result.errors, values, labels };

  const cistern = result.value;
  const { error } = await supabase.from(TABLES.cisterns).insert({
    name: cistern.name,
    length_m: cistern.lengthM,
    width_m: cistern.widthM,
    max_height_cm: cistern.maxHeightCm,
    households_count: cistern.householdsCount,
    household_labels: cistern.labels,
  });

  if (error) {
    console.error("[createCistern]", error.code, error.message);
    return { errors: { form: "No se pudo guardar. Revisa tu conexión e intenta otra vez." }, values, labels };
  }

  refresh();
  return { errors: {}, values: {}, labels: [] };
}
