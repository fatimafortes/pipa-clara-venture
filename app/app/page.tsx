import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCistern, getDeliveries, requireUser } from "@/lib/data";
import { formatDay, formatLiters } from "@/lib/format";
import { litersPerCm } from "@/lib/verdict";
import { signOut } from "./actions";
import { CisternForm } from "./CisternForm";
import { LogAppOpened } from "./pipa/[id]/EventLoggers";

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

const verdictLabel = {
  consistent: "Consistente",
  short: "Faltante",
  couldnt_measure: "No se pudo medir",
} as const;

async function OrganizerHome() {
  const { user } = await requireUser();
  const [cistern, deliveries] = await Promise.all([getCistern(), getDeliveries()]);

  return (
    <div className="space-y-6">
      <LogAppOpened />
      {cistern && (
        <>
          <Link
            href="/app/pipa/nueva"
            className="block rounded-xl bg-teal px-6 py-5 text-center text-xl font-semibold text-white hover:bg-teal-dark"
          >
            Nueva pipa
          </Link>

          {deliveries.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xl font-bold">Pipas registradas</h2>
              <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
                {deliveries.map((d) => (
                  <li key={d.id} className="space-y-3 px-5 py-4">
                    <Link
                      href={`/app/pipa/${d.id}`}
                      className="flex items-center justify-between gap-3 text-lg"
                    >
                      <span>
                        Pipa del {formatDay(d.delivered_at)}
                        <span className="block text-base text-muted">
                          Ya pagaron: {d.paidCount} de {d.sharesCount}
                        </span>
                      </span>
                      <span className={d.verdict === "short" ? "font-semibold text-amber" : "text-muted"}>
                        {verdictLabel[d.verdict]} →
                      </span>
                    </Link>
                    {/* What the organizer comes back for (real sessions, W7): collect and tell the neighbors */}
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href={`/app/pipa/${d.id}#pagos`}
                        className="rounded-xl border-2 border-teal bg-white px-3 py-3 text-center text-lg font-semibold text-teal"
                      >
                        Ver pagos
                      </Link>
                      <Link
                        href={`/app/pipa/${d.id}#resumen`}
                        className="rounded-xl bg-whatsapp px-3 py-3 text-center text-lg font-semibold text-white"
                      >
                        Mandar resumen
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {cistern ? (
        <section className="space-y-3 rounded-2xl border border-line bg-white p-5">
          <h1 className="text-2xl font-bold">{cistern.name}</h1>
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
