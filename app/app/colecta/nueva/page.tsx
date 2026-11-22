import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCistern, getCollections } from "@/lib/data";
import { CollectionForm } from "./CollectionForm";

export const metadata: Metadata = {
  title: "Nueva colecta",
};

export default function NewCollectionPage() {
  return (
    <Suspense fallback={<p className="text-lg text-muted">Cargando…</p>}>
      <NewCollection />
    </Suspense>
  );
}

async function NewCollection() {
  const cistern = await getCistern();
  if (!cistern) redirect("/app");
  // One open collection at a time
  const open = (await getCollections(cistern)).find((c) => !c.deliveryId);
  if (open) redirect(`/app/colecta/${open.id}`);
  return <CollectionForm households={Number(cistern.households_count)} />;
}
