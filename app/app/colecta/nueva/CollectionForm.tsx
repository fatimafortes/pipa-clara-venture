"use client";

import { useActionState } from "react";
import { Field, SubmitErrors } from "@/components/Field";
import { NEVER_HOLDS_MONEY } from "@/components/CollectionProgress";
import { FAMILY_FEE_PER_DELIVERY } from "@/lib/pricing";
import { createCollection, type CollectionFormState } from "../actions";

const initialState: CollectionFormState = { errors: {}, values: {} };

export function CollectionForm({ households }: { households: number }) {
  const [state, action, pending] = useActionState(createCollection, initialState);
  const v = state.values;

  return (
    <form action={action} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nueva colecta</h1>
        <p className="text-lg text-muted">
          Junten antes de pedir: la pipa se pide cuando los {households} hogares ya dieron su parte. Así tú no
          pones dinero de tu bolsa.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <Field
          label="Precio que pide el pipero ($)"
          name="priceMxn"
          inputMode="numeric"
          placeholder="ej. 1500"
          defaultValue={v.priceMxn}
          error={state.errors.priceMxn}
        />
        <Field
          label="Cuota de Pipa Clara por pipa ($)"
          hint={`$${FAMILY_FEE_PER_DELIVERY} por pipa en total, repartidos entre los ${households} hogares. Hoy no cobramos en el piloto.`}
          name="feeMxn"
          inputMode="numeric"
          defaultValue={v.feeMxn ?? String(FAMILY_FEE_PER_DELIVERY)}
          error={state.errors.feeMxn}
        />
        <Field
          label="Fecha que acordó el grupo (opcional)"
          hint="La fecha la decide el grupo, no la app."
          name="agreedDate"
          type="date"
          defaultValue={v.agreedDate}
          error={state.errors.agreedDate}
        />
      </section>

      {!pending && <SubmitErrors errors={state.errors} />}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-teal px-6 py-4 text-lg font-semibold text-white hover:bg-teal-dark disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Abrir la colecta"}
      </button>
      <p className="text-center text-base text-muted">{NEVER_HOLDS_MONEY}</p>
    </form>
  );
}
