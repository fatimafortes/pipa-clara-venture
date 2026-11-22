import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CollectionProgress, NEVER_HOLDS_MONEY, NotReadyButton, shareStateText } from "@/components/CollectionProgress";
import { SubmitButton } from "@/components/SubmitButton";
import { collectionStatus } from "@/lib/collection";
import { getCollection, type CollectionShareRow } from "@/lib/data";
import { formatMxn } from "@/lib/format";
import { buildProgressMessage } from "@/lib/progress";
import { whatsappLink } from "@/lib/summary";
import { deleteCollection, setCollectionShare } from "../actions";

export const metadata: Metadata = {
  title: "Juntando para la pipa",
};

const errorText: Record<string, string> = {
  parte: "No se pudo guardar. Intenta otra vez.",
  fecha: "Elige la fecha que prometió y vuelve a tocar \"Promete\".",
  cancelar: "No se pudo cancelar la colecta. Intenta otra vez.",
};

export default function CollectionPage({ params, searchParams }: PageProps<"/app/colecta/[id]">) {
  return (
    <Suspense fallback={<p className="text-lg text-muted">Cargando…</p>}>
      {Promise.all([params, searchParams]).then(([{ id }, query]) => (
        <Collection id={id} error={typeof query.error === "string" ? (errorText[query.error] ?? null) : null} />
      ))}
    </Suspense>
  );
}

async function Collection({ id, error }: { id: string; error: string | null }) {
  const found = await getCollection(id);
  if (!found) notFound();
  const { collection, cistern } = found;
  const { shares } = collection;
  const states = shares.map((s) => s.state);
  const status = collectionStatus(shares, collection.deliveryId);
  const message = buildProgressMessage({ shares, agreedDate: collection.agreed_date });

  const title = { collecting: "Juntando para la pipa", ready: "Listo para pedir", ordered: "Ya se pidió la pipa" }[status];

  return (
    <div className="space-y-5">
      <Link href="/app" className="inline-block py-1 text-lg font-medium text-teal">
        ← Mi cisterna
      </Link>
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-lg text-muted">
          {cistern.name} · {cistern.households_count} hogares
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border-2 border-amber bg-amber-soft p-4 text-lg text-amber">
          {error}
        </p>
      )}

      <CollectionProgress
        priceMxn={collection.price_mxn}
        feeMxn={collection.fee_mxn}
        amounts={shares.map((s) => s.amount_mxn)}
        states={states}
        agreedDate={collection.agreed_date}
      />

      {status === "collecting" && <NotReadyButton states={states} />}
      {status === "ready" && (
        <div className="space-y-3 rounded-2xl border-2 border-teal bg-white p-5">
          <p className="text-xl font-bold text-teal">Ya juntaron todos. Ya puedes pedir la pipa.</p>
          <p className="text-lg">Cuando llegue, regístrala aquí: se mide como siempre y no se cobra dos veces.</p>
          <Link
            href={`/app/pipa/nueva?colecta=${collection.id}`}
            className="block rounded-xl bg-teal px-6 py-4 text-center text-lg font-semibold text-white hover:bg-teal-dark"
          >
            Registrar la pipa
          </Link>
        </div>
      )}
      {status === "ordered" && collection.deliveryId && (
        <Link
          href={`/app/pipa/${collection.deliveryId}`}
          className="block rounded-xl bg-teal px-6 py-4 text-center text-lg font-semibold text-white hover:bg-teal-dark"
        >
          Ver la pipa y su veredicto
        </Link>
      )}

      {status !== "ordered" && (
        <a
          href={whatsappLink(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl bg-whatsapp px-6 py-4 text-center text-lg font-semibold text-white"
        >
          Mandar avance al grupo
        </a>
      )}
      {status !== "ordered" && (
        <p className="text-base text-muted">
          El mensaje dice: &quot;{message}&quot; Solo cuántos, nunca quién.
        </p>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-2xl font-bold">
            <span aria-hidden="true">🔒 </span>Solo tú ves esta lista
          </h2>
          <p className="text-base text-muted">El grupo solo ve cuántos ya dieron su parte, nunca quién.</p>
        </div>
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
          {shares.map((s) => (
            <ShareRow key={s.id} share={s} collectionId={collection.id} locked={status === "ordered"} />
          ))}
        </ul>
      </section>

      <p className="text-center text-base text-muted">{NEVER_HOLDS_MONEY}</p>

      {status !== "ordered" && (
        <form action={deleteCollection} className="text-center">
          <input type="hidden" name="collectionId" value={collection.id} />
          <SubmitButton className="py-2 text-base font-semibold text-muted underline">
            Cancelar esta colecta
          </SubmitButton>
        </form>
      )}
    </div>
  );
}

function ShareRow({ share, collectionId, locked }: { share: CollectionShareRow; collectionId: string; locked: boolean }) {
  const received = share.state === "received";
  return (
    <li className="space-y-3 px-4 py-4">
      <p className="flex flex-wrap items-baseline justify-between gap-2 text-lg">
        <span className="shrink-0 font-semibold">{share.household_label}</span>
        <span className={received ? "font-semibold text-teal" : share.state === "promised" ? "text-amber" : "text-muted"}>
          {shareStateText(share.state, share.promised_for)}
        </span>
      </p>
      <p className="text-base text-muted">Su parte: {formatMxn(share.amount_mxn)}</p>
      {!locked && (
        <div className="flex flex-wrap gap-2">
          <form action={setCollectionShare}>
            <input type="hidden" name="collectionId" value={collectionId} />
            <input type="hidden" name="shareId" value={share.id} />
            <input type="hidden" name="state" value={received ? "pending" : "received"} />
            <SubmitButton
              className={
                received
                  ? "rounded-full border-2 border-line bg-white px-4 py-2 text-base font-semibold text-muted"
                  : "rounded-full bg-teal px-4 py-2 text-lg font-semibold text-white"
              }
            >
              {received ? "Deshacer" : "Ya dio su parte"}
            </SubmitButton>
          </form>
          {!received && (
            <form action={setCollectionShare} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="collectionId" value={collectionId} />
              <input type="hidden" name="shareId" value={share.id} />
              <input type="hidden" name="state" value="promised" />
              <label className="sr-only" htmlFor={`promise-${share.id}`}>
                Fecha que promete {share.household_label}
              </label>
              <input
                id={`promise-${share.id}`}
                type="date"
                name="promisedFor"
                required
                defaultValue={share.promised_for ?? ""}
                className="rounded-xl border-2 border-line bg-white px-3 py-2 text-base"
              />
              <SubmitButton className="rounded-full border-2 border-amber bg-white px-4 py-2 text-base font-semibold text-amber">
                Promete
              </SubmitButton>
            </form>
          )}
        </div>
      )}
    </li>
  );
}
