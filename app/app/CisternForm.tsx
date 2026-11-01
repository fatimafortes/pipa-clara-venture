"use client";

import { useActionState, useState } from "react";
import { Field, FormError } from "@/components/Field";
import { createCistern, type CisternFormState } from "./actions";

const initialState: CisternFormState = { errors: {}, values: {}, labels: [] };

const defaultLabel = (i: number) => `Hogar ${i + 1}`;

export function CisternForm() {
  const [state, action, pending] = useActionState(createCistern, initialState);
  const [count, setCount] = useState(state.values.householdsCount ?? "");

  // One label box per household, pre-filled so she only changes what she wants
  const households = Number.parseInt(count, 10);
  const labelCount = households >= 2 && households <= 40 ? households : 0;

  return (
    <form action={action} className="space-y-5 rounded-2xl border border-line bg-white p-5">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Registra tu cisterna</h1>
        <p className="text-lg text-muted">Solo una vez. Mide por dentro, con una cinta métrica.</p>
      </div>

      <FormError message={state.errors.form} />

      <Field
        label="Nombre"
        hint="Por ejemplo: Cisterna de la vecindad"
        name="name"
        defaultValue={state.values.name}
        maxLength={60}
        error={state.errors.name}
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Largo (m)"
          name="lengthM"
          inputMode="decimal"
          placeholder="3"
          defaultValue={state.values.lengthM}
          error={state.errors.lengthM}
        />
        <Field
          label="Ancho (m)"
          name="widthM"
          inputMode="decimal"
          placeholder="2.5"
          defaultValue={state.values.widthM}
          error={state.errors.widthM}
        />
      </div>
      <Field
        label="Altura máxima (cm)"
        hint="Hasta dónde se puede llenar sin desbordarse."
        name="maxHeightCm"
        inputMode="decimal"
        placeholder="180"
        defaultValue={state.values.maxHeightCm}
        error={state.errors.maxHeightCm}
      />
      <Field
        label="¿Cuántos hogares la comparten?"
        hint="Entre 2 y 40."
        name="householdsCount"
        inputMode="numeric"
        value={count}
        onChange={(e) => setCount(e.target.value)}
        error={state.errors.householdsCount}
      />

      {labelCount > 0 && (
        <fieldset className="space-y-3">
          <legend className="text-lg font-semibold">Etiqueta de cada hogar</legend>
          <p className="text-base text-muted">
            Algo corto como &quot;Depto 3&quot; o &quot;Casa azul&quot;. Nunca nombres completos.
          </p>
          {state.errors.labels && (
            <p className="text-base font-medium text-amber">{state.errors.labels}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: labelCount }, (_, i) => (
              <input
                key={i}
                name="labels"
                aria-label={`Hogar ${i + 1}`}
                defaultValue={state.labels[i] ?? defaultLabel(i)}
                maxLength={30}
                className="block w-full rounded-xl border-2 border-line bg-white px-3 py-3 text-lg outline-none focus:border-teal"
              />
            ))}
          </div>
        </fieldset>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-teal px-6 py-4 text-lg font-semibold text-white hover:bg-teal-dark disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar cisterna"}
      </button>
    </form>
  );
}
