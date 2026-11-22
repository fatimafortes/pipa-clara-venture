"use client";

import { useActionState } from "react";
import { submitOptIn, type OptInState } from "@/app/optin/actions";
import { CONSENT_TEXT, HOUSING, HOUSING_LABEL, MAX_CONTACT } from "@/lib/optin";
import { Field, SubmitErrors } from "./Field";

const initialState: OptInState = { done: false, errors: {}, values: {} };

// "Avísame" on the homepage (F5). No countdowns, no counts, no invented lists.
export function OptInForm() {
  const [state, action, pending] = useActionState(submitOptIn, initialState);

  if (state.done) {
    return (
      <p role="status" className="rounded-xl border-2 border-teal bg-white p-4 text-lg font-semibold text-teal">
        Gracias. Te escribimos cuando haya lugar para tu grupo.
      </p>
    );
  }

  const v = state.values;
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field
        label="Tu WhatsApp o tu correo"
        hint="Solo uno. Lo usamos solo para escribirte sobre esta prueba."
        name="contact"
        autoComplete="email"
        maxLength={MAX_CONTACT}
        placeholder="ej. 55 1234 5678"
        defaultValue={v.contact}
        error={state.errors.contact}
      />

      <fieldset className="space-y-2">
        <legend className="text-lg font-semibold">¿Dónde vives?</legend>
        <div className="grid grid-cols-2 gap-2">
          {HOUSING.map((h) => (
            <label key={h} className="flex items-center gap-2 rounded-xl border-2 border-line bg-white p-3 text-lg">
              <input type="radio" name="housing" value={h} defaultChecked={v.housing === h} className="h-5 w-5 accent-teal" />
              {HOUSING_LABEL[h]}
            </label>
          ))}
        </div>
        {state.errors.housing && <p className="text-base font-medium text-amber">{state.errors.housing}</p>}
      </fieldset>

      <div>
        <label className="flex items-start gap-3 rounded-xl border-2 border-line bg-white p-4 text-lg">
          <input
            type="checkbox"
            name="consent"
            defaultChecked={v.consent === "on"}
            className="mt-1 h-6 w-6 shrink-0 accent-teal"
          />
          <span>{CONSENT_TEXT}</span>
        </label>
        {state.errors.consent && <p className="mt-1 text-base font-medium text-amber">{state.errors.consent}</p>}
      </div>

      {/* Honeypot: hidden from people and screen readers; bots fill it in */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          No llenes este campo
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {!pending && <SubmitErrors errors={state.errors} />}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-teal px-6 py-4 text-lg font-semibold text-white hover:bg-teal-dark disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Avísame"}
      </button>
    </form>
  );
}
