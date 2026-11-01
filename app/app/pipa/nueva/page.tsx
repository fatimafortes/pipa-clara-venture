import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCistern, requireUser } from "@/lib/data";
import { DeliveryForm } from "./DeliveryForm";

export const metadata: Metadata = {
  title: "Nueva pipa",
};

export default function NewDeliveryPage() {
  return (
    <Suspense fallback={<p className="text-lg text-muted">Cargando…</p>}>
      <NewDelivery />
    </Suspense>
  );
}

async function NewDelivery() {
  const { user } = await requireUser();
  const cistern = await getCistern();
  if (!cistern) redirect("/app");

  return <DeliveryForm userId={user.id} maxHeightCm={Number(cistern.max_height_cm)} />;
}
