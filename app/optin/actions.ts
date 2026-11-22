"use server";

import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/names";
import { validateOptIn } from "@/lib/optin";
import type { FieldErrors } from "@/lib/validation";

export type OptInState = { done: boolean; errors: FieldErrors; values: Record<string, string> };

// Anyone may add an opt-in; nobody can read them from the app (pc_optins: insert-only RLS).
export async function submitOptIn(_prev: OptInState, formData: FormData): Promise<OptInState> {
  const values = {
    contact: String(formData.get("contact") ?? ""),
    housing: String(formData.get("housing") ?? ""),
    consent: formData.get("consent") === "on" ? "on" : "",
  };
  const result = validateOptIn({
    contact: values.contact,
    housing: values.housing,
    consent: values.consent === "on",
    website: String(formData.get("website") ?? ""),
  });

  if (!result.ok && "bot" in result) {
    // Honeypot filled: say thanks, store nothing
    console.warn("[submitOptIn] honeypot filled, ignored");
    return { done: true, errors: {}, values: {} };
  }
  if (!result.ok) return { done: false, errors: result.errors, values };

  const supabase = await createClient();
  // No .select(): anon may insert but not read, so asking for the row back would fail
  const { error } = await supabase.from(TABLES.optins).insert({
    contact: result.value.contact,
    contact_kind: result.value.contactKind,
    housing: result.value.housing,
    consent: true,
  });
  if (error) {
    console.error("[submitOptIn] insert failed:", error.code, error.message);
    return {
      done: false,
      errors: { form: `No se pudo guardar. Intenta otra vez. (código: ${error.code ?? "?"})` },
      values,
    };
  }

  // Never log the contact itself
  console.info("[submitOptIn] saved", result.value.contactKind, result.value.housing);
  return { done: true, errors: {}, values: {} };
}
