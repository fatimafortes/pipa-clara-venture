import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { isReady } from "@/lib/collection";
import { getCistern, getCollection, getDeliveries, requireUser } from "@/lib/data";
import { DeliveryForm } from "./DeliveryForm";

export const metadata: Metadata = {
  title: "Nueva pipa",
};

export default function NewDeliveryPage({ searchParams }: PageProps<"/app/pipa/nueva">) {
  return (
    <Suspense fallback={<p className="text-lg text-muted">Cargando…</p>}>
      {searchParams.then((query) => (
        <NewDelivery collectionId={typeof query.colecta === "string" ? query.colecta : null} />
      ))}
    </Suspense>
  );
}

async function NewDelivery({ collectionId }: { collectionId: string | null }) {
  const { user } = await requireUser();
  const [cistern, deliveries] = await Promise.all([getCistern(), getDeliveries()]);
  if (!cistern) redirect("/app");

  // From "Registrar la pipa": only a ready collection of this cistern, never twice
  let fromCollection: { id: string; priceMxn: number; feeMxn: number } | null = null;
  if (collectionId) {
    const found = await getCollection(collectionId);
    if (!found || found.collection.cistern_id !== cistern.id) redirect("/app");
    const { collection } = found;
    if (collection.deliveryId) redirect(`/app/pipa/${collection.deliveryId}`);
    if (!isReady(collection.shares)) {
      return (
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Todavía no</h1>
          <p className="text-lg">La pipa se pide cuando todos ya dieron su parte.</p>
          <Link href={`/app/colecta/${collection.id}`} className="block rounded-xl bg-teal px-6 py-4 text-center text-lg font-semibold text-white">
            Volver a la colecta
          </Link>
        </div>
      );
    }
    fromCollection = { id: collection.id, priceMxn: collection.price_mxn, feeMxn: collection.fee_mxn };
  }

  return (
    <DeliveryForm
      userId={user.id}
      maxHeightCm={Number(cistern.max_height_cm)}
      households={Number(cistern.households_count)}
      // "¿Cómo mido?" starts open until her first pipa is saved; no new data needed
      firstDelivery={deliveries.length === 0}
      fromCollection={fromCollection}
    />
  );
}
