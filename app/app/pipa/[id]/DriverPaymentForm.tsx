"use client";

import { useActionState, useState } from "react";
import { SubmitErrors } from "@/components/Field";
import { formatMxn } from "@/lib/format";
import { setDriverPayment, type DriverPaymentState } from "../actions";

const initialState: DriverPaymentState = { errors: {}, values: {} };

// Shown only for a "short" verdict (persona test): the verdict has a consequence,
// but the organizer decides it. The app only does the arithmetic.
export function DriverPaymentForm({
  deliveryId,
  priceMxn,
  worthMxn,
  paidMxn,
}: {
  deliveryId: string;
  priceMxn: number;
  worthMxn: number;
  paidMxn: number;
}) {
  const [state, action, pending] = useActionState(setDriverPayment.bind(null, deliveryId), initialState);
  const [choice, setChoice] = useState(state.values.choice ?? (paidMxn < priceMxn ? "other" : "full"));

  return (
    <form action={action} className="space-y-4 rounded-2xl border-2 border-amber bg-white p-5">
      <div className="space-y-1">
        <p className="text-lg">
          Lo que sí entró vale <strong className="text-2xl text-amber">{formatMxn(worthMxn)}</strong>
        </p>
        <p className="text-base text-muted">
          Es la parte del precio que corresponde a los litros que entraron. Tú decides cuánto pagar.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-lg font-semibold">¿Cuánto le pagaste al pipero?</legend>
        <label className="flex items-center gap-3 rounded-xl border-2 border-line p-3 text-lg">
          <input
            type="radio"
            name="choice"
            value="full"
            checked={choice === "full"}
            onChange={() => setChoice("full")}
            className="h-6 w-6 accent-teal"
          />
          El precio completo: {formatMxn(priceMxn)}
        </label>
        <label className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-line p-3 text-lg">
          <input
            type="radio"
            name="choice"
            value="other"
            checked={choice === "other"}
            onChange={() => setChoice("other")}
            className="h-6 w-6 accent-teal"
          />
          Otro monto:
          <input
            name="otherMxn"
            inputMode="numeric"
            aria-label="Otro monto en pesos"
            placeholder={`ej. ${worthMxn}`}
            defaultValue={state.values.otherMxn ?? (paidMxn < priceMxn ? String(paidMxn) : "")}
            onFocus={() => setChoice("other")}
            className="w-32 rounded-xl border-2 border-line px-3 py-2 text-xl outline-none placeholder:italic placeholder:text-muted/50 focus:border-teal"
          />
        </label>
        {state.errors.otherMxn && <p className="text-base font-medium text-amber">{state.errors.otherMxn}</p>}
      </fieldset>

      {!pending && <SubmitErrors errors={state.errors} />}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-teal px-6 py-4 text-lg font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar y recalcular lo que paga cada hogar"}
      </button>
    </form>
  );
}
