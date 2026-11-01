import type { Metadata } from "next";
import { Suspense } from "react";
import { getCistern, requireUser } from "@/lib/data";
import { formatLiters } from "@/lib/format";
import { litersPerCm } from "@/lib/verdict";
import { signOut } from "./actions";
import { CisternForm } from "./CisternForm";

export const metadata: Metadata = {
  title: "Mi cisterna",
};

export default function AppPage() {
  return (
    // Reading the session cookie must happen behind Suspense (Next 16 cacheComponents)
    <Suspense fallback={<p className="text-lg text-muted">Cargando…</p>}>
      <OrganizerHome />
    </Suspense>
  );
}

async function OrganizerHome() {
  const { user } = await requireUser();
  const cistern = await getCistern();

  return (
    <div className="space-y-6">
      {cistern ? (
        <section className="space-y-3 rounded-2xl border border-line bg-white p-5">
          <h1 className="text-3xl font-bold">{cistern.name}</h1>
          <p className="text-lg text-muted">
            {Number(cistern.length_m)} × {Number(cistern.width_m)} m · altura máxima{" "}
            {Number(cistern.max_height_cm)} cm · {cistern.households_count} hogares
          </p>
          <p className="rounded-xl bg-teal-soft p-3 text-lg">
            Cada centímetro de nivel son{" "}
            <strong>{formatLiters(Math.round(litersPerCm(cistern.length_m, cistern.width_m)))}</strong>.
          </p>
          <p className="text-base text-muted">{cistern.household_labels.join(" · ")}</p>
        </section>
      ) : (
        <CisternForm />
      )}

      <form action={signOut} className="space-y-2 text-center">
        <p className="text-base text-muted">Entraste como {user.email}</p>
        <button
          type="submit"
          className="w-full rounded-xl border-2 border-teal bg-white px-6 py-4 text-lg font-semibold text-teal"
        >
          Salir
        </button>
      </form>
    </div>
  );
}
