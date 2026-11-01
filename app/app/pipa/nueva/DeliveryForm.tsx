"use client";

import { useActionState, useState } from "react";
import { Checkbox, Field, FormError, SubmitErrors } from "@/components/Field";
import { createDelivery, type DeliveryFormState } from "../actions";
import { PhotoField } from "./PhotoField";

const initialState: DeliveryFormState = { errors: {}, values: {} };

export function DeliveryForm({ userId, maxHeightCm }: { userId: string; maxHeightCm: number }) {
  const [state, action, pending] = useActionState(createDelivery, initialState);
  const [uploads, setUploads] = useState(0);
  const onUploadingChange = (uploading: boolean) => setUploads((n) => n + (uploading ? 1 : -1));
  const v = state.values;

  return (
    <form action={action} className="space-y-6">
      <h1 className="text-3xl font-bold">Nueva pipa</h1>
      <FormError message={state.errors.form} />

      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <h2 className="text-xl font-bold">1. La pipa</h2>
        <Field
          label="Litros que dice el pipero"
          name="litersClaimed"
          inputMode="numeric"
          placeholder="ej. 10000"
          defaultValue={v.litersClaimed}
          error={state.errors.litersClaimed}
        />
        <Field
          label="Precio que pide el pipero ($)"
          name="priceMxn"
          inputMode="numeric"
          placeholder="ej. 1800"
          defaultValue={v.priceMxn}
          error={state.errors.priceMxn}
        />
        <Field
          label="Cuota de Pipa Clara por hogar ($)"
          name="feeMxn"
          inputMode="numeric"
          defaultValue={v.feeMxn ?? "2"}
          error={state.errors.feeMxn}
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <h2 className="text-xl font-bold">2. Antes de que descargue</h2>
        <Field
          label="Nivel de la cisterna (cm)"
          hint={`Mide desde el fondo. Máximo ${maxHeightCm} cm.`}
          name="beforeCm"
          inputMode="decimal"
          defaultValue={v.beforeCm}
          error={state.errors.beforeCm}
        />
        <PhotoField
          name="beforePhoto"
          label="Foto de la cinta métrica"
          userId={userId}
          onUploadingChange={onUploadingChange}
        />
        <Checkbox
          name="driverPresent"
          label="El pipero estuvo presente"
          defaultChecked={v.driverPresent === "on"}
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <h2 className="text-xl font-bold">3. Después de que descargue</h2>
        <Field
          label="Nivel de la cisterna (cm)"
          hint="Si no lo pudiste medir, déjalo vacío."
          name="afterCm"
          inputMode="decimal"
          defaultValue={v.afterCm}
          error={state.errors.afterCm}
        />
        <PhotoField
          name="afterPhoto"
          label="Foto de la cinta métrica"
          userId={userId}
          onUploadingChange={onUploadingChange}
        />
        <Checkbox
          name="pumpRan"
          label="La bomba al tinaco estuvo prendida"
          defaultChecked={v.pumpRan === "on"}
        />
        <Checkbox
          name="overflowed"
          label="La cisterna se desbordó"
          defaultChecked={v.overflowed === "on"}
        />
      </section>

      {!pending && <SubmitErrors errors={state.errors} />}
      <button
        type="submit"
        disabled={pending || uploads > 0}
        className="w-full rounded-xl bg-teal px-6 py-4 text-lg font-semibold text-white hover:bg-teal-dark disabled:opacity-60"
      >
        {uploads > 0 ? "Esperando la foto…" : pending ? "Guardando…" : "Guardar y ver veredicto"}
      </button>
    </form>
  );
}
