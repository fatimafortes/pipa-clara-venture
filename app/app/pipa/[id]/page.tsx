import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getDelivery, type DeliveryDetail } from "@/lib/data";
import { formatDay, formatLiters, formatMxn, formatNumber, formatTime } from "@/lib/format";
import { buildSummary, whatsappLink } from "@/lib/summary";
import { computeVerdict, insideMarginNote, precisionNote } from "@/lib/verdict";
import { setSharePaid } from "../actions";
import { valueOfMeasured } from "@/lib/shares";
import { ChallengeForm } from "./ChallengeForm";
import { DriverPaymentForm } from "./DriverPaymentForm";
import { LogVerdictViewed, SummaryButton } from "./EventLoggers";
import { PaidButton } from "./PaidButton";

export const metadata: Metadata = {
  title: "Veredicto",
};

export default function DeliveryPage({ params, searchParams }: PageProps<"/app/pipa/[id]">) {
  return (
    // The id, the ?error flag and the session are request-time data (Next 16 cacheComponents)
    <Suspense fallback={<p className="text-lg text-muted">Cargando…</p>}>
      {Promise.all([params, searchParams]).then(([{ id }, query]) => (
        <DeliveryVerdict id={id} paymentError={query.error === "pago"} />
      ))}
    </Suspense>
  );
}

const raisedByLabel = { driver: "El pipero", neighbor: "Un vecino", organizer: "Yo" } as const;

const cardStyle = {
  consistent: { box: "border-teal bg-white", text: "text-teal" },
  short: { box: "border-amber bg-amber-soft", text: "text-amber" },
  couldnt_measure: { box: "border-line bg-page", text: "text-ink" },
} as const;

async function DeliveryVerdict({ id, paymentError }: { id: string; paymentError: boolean }) {
  const detail = await getDelivery(id);
  if (!detail) notFound();
  const { delivery, cistern, readings, shares, challenges } = detail;

  const before = readings.find((r) => r.kind === "before");
  const after = readings.find((r) => r.kind === "after");

  // Recomputed from the saved numbers, only for the explanation and the margin
  const explained = computeVerdict({
    lengthM: Number(cistern.length_m),
    widthM: Number(cistern.width_m),
    maxHeightCm: Number(cistern.max_height_cm),
    beforeCm: before ? Number(before.level_cm) : null,
    // Without it the margin on screen wouldn't match the saved verdict
    beforeRepeatCm: before?.repeat_level_cm == null ? null : Number(before.repeat_level_cm),
    afterCm: after ? Number(after.level_cm) : null,
    litersClaimed: delivery.liters_claimed,
    pumpRan: delivery.pump_ran,
    overflowed: delivery.overflowed,
  });

  const measured = delivery.measured_liters;
  const title =
    delivery.verdict === "short" && measured !== null
      ? `Faltante: ${formatLiters(delivery.liters_claimed - measured)}`
      : delivery.verdict === "consistent"
        ? "Consistente"
        : "No se pudo medir";
  const style = cardStyle[delivery.verdict];
  // Below the claim but inside the margin: say so instead of "entraron los litros que dijo"
  const insideNote = delivery.verdict === "consistent" ? insideMarginNote(explained, delivery.liters_claimed) : null;
  const range = measured === null ? null : explained.measuredRange;

  const amounts = shares.map((s) => s.amount_mxn);
  const low = Math.min(...amounts);
  const high = Math.max(...amounts);
  const paid = shares.filter((s) => s.paid).length;
  const fee = delivery.fee_mxn * shares.length;
  // What she actually paid the driver (persona test); null = the full price
  const paidToDriver = delivery.paid_mxn ?? delivery.price_mxn;
  const worth = measured === null ? null : valueOfMeasured(measured, delivery.liters_claimed, delivery.price_mxn);

  // No household labels: the summary function doesn't even receive them
  const summary = buildSummary({
    deliveredAt: delivery.delivered_at,
    litersClaimed: delivery.liters_claimed,
    measuredLiters: measured,
    verdict: delivery.verdict,
    toleranceLiters: explained.toleranceLiters,
    insideMarginNote: insideNote,
    before: before ? { takenAt: before.taken_at, hasPhoto: Boolean(before.photo_path) } : null,
    after: after ? { takenAt: after.taken_at, hasPhoto: Boolean(after.photo_path) } : null,
    driverPresent: before?.driver_present ?? false,
    priceMxn: delivery.price_mxn,
    paidMxn: paidToDriver,
    feeMxn: delivery.fee_mxn,
    shareAmounts: amounts,
    paidCount: paid,
    challenges: challenges.map((c) => ({ raisedBy: c.raised_by, note: c.note })),
  });

  return (
    <div className="space-y-5">
      <LogVerdictViewed deliveryId={delivery.id} />
      <Link href="/app" className="inline-block py-1 text-lg font-medium text-teal">
        ← Mi cisterna
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Pipa del {formatDay(delivery.delivered_at)}</h1>
        <p className="text-lg text-muted">
          {cistern.name} · {Number(cistern.length_m)} × {Number(cistern.width_m)} m ·{" "}
          {cistern.households_count} hogares
        </p>
      </div>

      <dl className="divide-y divide-line rounded-2xl border border-line bg-white px-5">
        <div className="flex items-baseline justify-between gap-4 py-4">
          <dt className="text-lg text-muted">Litros que dijo el pipero</dt>
          <dd className="text-2xl font-bold">{formatLiters(delivery.liters_claimed)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-4">
          <dt className="text-lg text-muted">Litros que entraron (medidos)</dt>
          {measured === null ? (
            // Said in words, so an empty value never looks like a broken screen
            <dd className="text-right text-lg font-semibold text-muted">— (no se pudo medir)</dd>
          ) : (
            <dd className="text-right">
              <span className="block text-2xl font-bold">{formatLiters(measured)}</span>
              {range && (
                <span className="block text-base text-muted">
                  entre {formatNumber(range.low)} y {formatLiters(range.high)}
                </span>
              )}
            </dd>
          )}
        </div>
      </dl>

      <section className={`space-y-3 rounded-2xl border-2 p-5 ${style.box}`}>
        <p className={`text-sm font-bold tracking-widest ${style.text}`}>VEREDICTO</p>
        <p className={`text-3xl font-bold ${style.text}`}>{title}</p>
        <p className="text-lg leading-relaxed">{insideNote ?? explained.reason}</p>
        {/* How precise this measurement was; meaningless when it couldn't be measured */}
        {measured !== null && (
          <p className="rounded-xl bg-page px-4 py-3 text-base leading-relaxed text-muted">
            {precisionNote(explained)}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <ReadingThumb
            label="Antes"
            reading={before}
            note={before?.driver_present ? "con el pipero presente" : "sin el pipero"}
          />
          <ReadingThumb label="Después" reading={after} />
        </div>
      </section>

      {delivery.verdict === "short" && worth !== null && (
        <DriverPaymentForm
          key={paidToDriver}
          deliveryId={delivery.id}
          priceMxn={delivery.price_mxn}
          worthMxn={worth}
          paidMxn={paidToDriver}
        />
      )}

      <section className="space-y-3 rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>
            <span className="block text-lg text-muted">Cada hogar paga</span>
            <span className="text-3xl font-bold">
              {low === high ? formatMxn(low) : `${formatMxn(low)} o ${formatMxn(high)}`}
            </span>
          </p>
          <span className="rounded-full bg-teal-soft px-4 py-2 text-lg font-semibold text-teal">
            Ya pagaron: {paid} de {shares.length}
          </span>
        </div>
        <p className="text-base text-muted">
          {paidToDriver < delivery.price_mxn
            ? `Le pagaste al pipero ${formatMxn(paidToDriver)} de ${formatMxn(delivery.price_mxn)}. `
            : ""}
          Pipa {formatMxn(paidToDriver)} + cuota de Pipa Clara {formatMxn(fee)} ({shares.length} ×{" "}
          {formatMxn(delivery.fee_mxn)}) = {formatMxn(paidToDriver + fee)}, en partes iguales.
        </p>
      </section>

      <SummaryButton href={whatsappLink(summary)} deliveryId={delivery.id} />
      <ChallengeForm key={challenges.length} deliveryId={delivery.id} />
      <p className="text-center text-base text-muted">
        El veredicto es evidencia, no sentencia. Cualquier desacuerdo queda guardado junto a él.
      </p>

      {challenges.length > 0 && (
        <section id="desacuerdos" className="space-y-3">
          <h2 className="text-xl font-bold">Desacuerdos</h2>
          <ul className="space-y-3">
            {challenges.map((c) => (
              <li key={c.id} className="rounded-xl border-l-4 border-amber bg-white p-4">
                <p className="text-base font-semibold text-muted">
                  {raisedByLabel[c.raised_by]} · {formatDay(c.created_at)}, {formatTime(c.created_at)}
                </p>
                <p className="whitespace-pre-wrap text-lg">{c.note}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="pagos" className="space-y-3">
        <div>
          <h2 className="text-xl font-bold">Pagos</h2>
          <p className="text-base text-muted">
            Solo tú ves quién ya pagó. Los vecinos solo ven &quot;Ya pagaron: {paid} de {shares.length}&quot;.
          </p>
        </div>
        {paymentError && (
          <p role="alert" className="rounded-xl border-2 border-amber bg-amber-soft p-4 text-lg text-amber">
            No se pudo guardar el pago. Intenta otra vez.
          </p>
        )}
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
          {shares.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-lg">
                <span className="font-semibold">{s.household_label}</span>
                <span className="block text-base text-muted">{formatMxn(s.amount_mxn)}</span>
              </span>
              <form action={setSharePaid}>
                <input type="hidden" name="deliveryId" value={delivery.id} />
                <input type="hidden" name="shareId" value={s.id} />
                <input type="hidden" name="paid" value={s.paid ? "false" : "true"} />
                <PaidButton label={s.household_label} paid={s.paid} />
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ReadingThumb({
  label,
  reading,
  note,
}: {
  label: string;
  reading: DeliveryDetail["readings"][number] | undefined;
  note?: string;
}) {
  if (!reading) {
    return (
      <div className="rounded-xl border border-line bg-white p-3 text-base text-muted">
        <strong className="block text-ink">{label}</strong>
        Sin lectura
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-3 text-base">
      {reading.photoUrl ? (
        <a href={reading.photoUrl} target="_blank" rel="noopener noreferrer">
          {/* Signed URL from the private bucket, expires in 1 hour */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={reading.photoUrl}
            alt={`Foto de la lectura de ${label.toLowerCase()}`}
            className="aspect-square w-full rounded-lg object-cover"
          />
        </a>
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-page text-muted">
          Sin foto
        </div>
      )}
      <p>
        <strong>
          {label} · {formatTime(reading.taken_at)}
        </strong>
        <span className="block">nivel {Number(reading.level_cm)} cm</span>
        {note && <span className="block">{note}</span>}
      </p>
    </div>
  );
}
