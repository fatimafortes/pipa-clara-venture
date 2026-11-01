"use client";

import { useActionState, useState } from "react";
import { SubmitErrors } from "@/components/Field";
import { createChallenge, type ChallengeFormState } from "../actions";

const initialState: ChallengeFormState = { errors: {}, values: {} };

const options = [
  { value: "driver", label: "El pipero" },
  { value: "neighbor", label: "Un vecino" },
  { value: "organizer", label: "Yo" },
];

export function ChallengeForm({ deliveryId }: { deliveryId: string }) {
  const [state, action, pending] = useActionState(createChallenge.bind(null, deliveryId), initialState);
  const [open, setOpen] = useState(Object.keys(state.errors).length > 0);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border-2 border-teal bg-white px-6 py-4 text-lg font-semibold text-teal"
      >
        Registrar desacuerdo
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border-2 border-teal bg-white p-5">
      <h2 className="text-xl font-bold">Registrar desacuerdo</h2>

      <fieldset className="space-y-2">
        <legend className="text-lg font-semibold">¿Quién no está de acuerdo?</legend>
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-3 rounded-xl border-2 border-line p-3 text-lg">
            <input
              type="radio"
              name="raisedBy"
              value={o.value}
              defaultChecked={state.values.raisedBy === o.value}
              className="h-6 w-6 accent-teal"
            />
            {o.label}
          </label>
        ))}
        {state.errors.raisedBy && <p className="text-base font-medium text-amber">{state.errors.raisedBy}</p>}
      </fieldset>

      <label className="block space-y-1">
        <span className="text-lg font-semibold">¿Qué dice?</span>
        <textarea
          name="note"
          rows={4}
          maxLength={500}
          defaultValue={state.values.note}
          className="block w-full rounded-xl border-2 border-line px-4 py-3 text-lg outline-none focus:border-teal"
        />
        <span className="block text-base text-muted">Máximo 500 letras. Queda guardado y no se puede borrar.</span>
        {state.errors.note && <span className="block text-base font-medium text-amber">{state.errors.note}</span>}
      </label>

      {!pending && <SubmitErrors errors={state.errors} />}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-teal px-6 py-4 text-lg font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar desacuerdo"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="w-full py-2 text-lg text-muted">
        Cancelar
      </button>
    </form>
  );
}
