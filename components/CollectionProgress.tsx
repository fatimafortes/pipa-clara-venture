import { readyButtonLabel, receivedCount, type ShareState } from "@/lib/collection";
import { formatDateOnly, formatMxn } from "@/lib/format";
import { AGREED_DATE_LABEL } from "@/lib/progress";
import { UNEVEN_SHARES_NOTE } from "@/lib/summary";

// The top of a collection (mockup Week 15): the pipa, each household's share,
// "5 de 6 ya dieron su parte" and the date the group agreed.
// Used by the real collection screen and by /demo, so both look the same.
export function CollectionProgress({
  priceMxn,
  feeMxn,
  amounts,
  states,
  agreedDate,
}: {
  priceMxn: number;
  feeMxn: number;
  amounts: number[];
  states: ShareState[];
  agreedDate: string | null;
}) {
  const total = states.length;
  const received = receivedCount(states.map((state) => ({ state })));
  const low = Math.min(...amounts);
  const high = Math.max(...amounts);
  const percent = total === 0 ? 0 : Math.round((received / total) * 100);

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
      <p className="text-lg">
        {formatMxn(priceMxn)} del pipero + {formatMxn(feeMxn)} Pipa Clara
        <span className="block text-2xl font-bold">
          Cada hogar: {low === high ? formatMxn(low) : `${formatMxn(low)} o ${formatMxn(high)}`}
        </span>
        {low !== high && <span className="block text-base text-muted">{UNEVEN_SHARES_NOTE}</span>}
      </p>
      <div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={received}
          aria-label={`${received} de ${total} ya dieron su parte`}
          className="h-5 w-full overflow-hidden rounded-full bg-teal-soft"
        >
          <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-xl font-bold text-teal">
          {received} de {total} ya dieron su parte
        </p>
      </div>
      {agreedDate && (
        <p className="rounded-xl bg-teal-soft px-4 py-3 text-lg text-teal">
          {AGREED_DATE_LABEL}: {formatDateOnly(agreedDate)}
        </p>
      )}
    </section>
  );
}

// Greyed out until 100%: "Listo para pedir (falta 1)"
export function NotReadyButton({ states }: { states: ShareState[] }) {
  return (
    <p
      aria-disabled="true"
      className="w-full rounded-xl bg-line px-6 py-4 text-center text-lg font-semibold text-muted"
    >
      {readyButtonLabel(states.map((state) => ({ state })))}
    </p>
  );
}

export const shareStateText = (state: ShareState, promisedFor: string | null) =>
  state === "received"
    ? "Ya dio su parte ✓"
    : state === "promised" && promisedFor
      ? `Promete el ${formatDateOnly(promisedFor)}`
      : "Pendiente";

export const NEVER_HOLDS_MONEY = "Pipa Clara nunca guarda dinero: tú cobras como siempre.";
