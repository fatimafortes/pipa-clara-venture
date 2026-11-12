"use client";

import { useEffect, useState } from "react";
import { formatLitersWord, formatMxn } from "@/lib/format";
import {
  DEFAULTS,
  FIELDS,
  SOURCES,
  STATUS_LABEL,
  clamp,
  costToServe,
  decodeScenario,
  detectability,
  encodeScenario,
  minDetectablePct,
  payingCisterns,
  priceAt10to1,
  ratios,
  revenue,
  valuePerDelivery,
  type Scenario,
  type Segment,
  type Status,
} from "@/lib/pricing";

type Key = Exclude<keyof Scenario, "segment">;
type Saved = { name: string; query: string };

const STORAGE_KEY = "pc_pricing_scenarios";
const MAX_NAME = 40;
const MAX_SAVED = 20;

const GROUPS: { title: string; keys: Key[] }[] = [
  { title: "Mercado", keys: ["cisterns", "conversionPct", "deliveriesPerMonth"] },
  { title: "Precio y costo de la pipa", keys: ["feeMxn", "pipaPriceMxn", "litersClaimed"] },
  { title: "Valor para quien paga", keys: ["shortfallPct", "collectHours", "measureMinutes", "wageMxnHour", "households"] },
  { title: "Medición", keys: ["lengthM", "widthM", "errorCm"] },
  { title: "Costo de atender", keys: ["setupMinutes", "supportMinutesMonth"] },
];

const STATUS_STYLE: Record<Status, string> = {
  measured: "bg-teal-soft text-teal",
  assumed: "bg-line text-muted",
  analogy: "bg-amber-soft text-amber",
};

const number = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 });
const ratioText = (r: number | null) => (r === null ? "—" : `${number.format(Math.round(r * 10) / 10)} a 1`);

function readSaved(): Saved[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list
      .filter((x) => typeof x?.name === "string" && typeof x?.query === "string")
      .slice(0, MAX_SAVED)
      .map((x) => ({ name: x.name.slice(0, MAX_NAME), query: x.query }));
  } catch {
    return null; // storage blocked (private window, preview): the simulator still works
  }
}

function writeSaved(list: Saved[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function Simulator() {
  const [s, setS] = useState<Scenario>(DEFAULTS.familias);
  // What the visitor is typing, so "1." or an empty box isn't overwritten mid-edit
  const [drafts, setDrafts] = useState<Partial<Record<Key, string>>>({});
  const [saved, setSaved] = useState<Saved[] | null>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  // On mount: restore a shared link, then the saved list
  // Reading the URL and localStorage only exists in the browser, so it happens after mount
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const fromLink = decodeScenario(window.location.search.slice(1));
    if (fromLink) {
      setS(fromLink);
      setMessage("Abriste un escenario compartido.");
    }
    setSaved(readSaved());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setSegment = (segment: Segment) => {
    setS(DEFAULTS[segment]);
    setDrafts({});
    setMessage(null);
  };

  const onChange = (key: Key, raw: string) => {
    setDrafts((d) => ({ ...d, [key]: raw }));
    const n = Number(raw.replace(",", "."));
    if (raw.trim() !== "" && Number.isFinite(n)) setS((prev) => ({ ...prev, [key]: clamp(key, n) }));
  };

  // On leaving the box, show the clamped value actually used
  const onBlur = (key: Key) => setDrafts((d) => ({ ...d, [key]: undefined }));

  const save = () => {
    const clean = name.trim().slice(0, MAX_NAME);
    if (!clean) {
      setMessage("Ponle un nombre al escenario.");
      return;
    }
    const current = readSaved();
    if (current === null) {
      setMessage("Este navegador no deja guardar. Usa «Copiar enlace» para conservarlo.");
      return;
    }
    const next = [{ name: clean, query: encodeScenario(s) }, ...current.filter((x) => x.name !== clean)].slice(
      0,
      MAX_SAVED,
    );
    if (!writeSaved(next)) {
      setMessage("No se pudo guardar en este navegador. Usa «Copiar enlace».");
      return;
    }
    setSaved(next);
    setName("");
    setMessage(`Guardado: «${clean}». Solo en este navegador.`);
  };

  const load = (item: Saved) => {
    const scenario = decodeScenario(item.query);
    if (!scenario) return;
    setS(scenario);
    setDrafts({});
    setMessage(`Abriste «${item.name}».`);
  };

  const remove = (item: Saved) => {
    const next = (saved ?? []).filter((x) => x.name !== item.name);
    writeSaved(next);
    setSaved(next);
  };

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?${encodeScenario(s)}#simulador`;
    window.history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Enlace copiado. Quien lo abra ve estos mismos números.");
    } catch {
      setMessage("El enlace ya está en la barra de direcciones: cópialo de ahí.");
    }
  };

  const rev = revenue(s);
  const cost = costToServe(s);
  const value = valuePerDelivery(s);
  const r = ratios(s);
  const det = detectability(s);
  const minPct = minDetectablePct(s);
  const margin = Math.round((rev.monthly - cost.monthly) * 100) / 100;
  const isFamily = s.segment === "familias";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-amber-soft px-3 py-1 text-sm font-bold tracking-wide text-amber">
          SIMULACIÓN
        </span>
        <span className="text-muted">Supuestos, no resultados. Cambia cualquier número.</span>
      </div>

      <div role="tablist" className="grid grid-cols-2 gap-2 rounded-xl bg-white p-1">
        {(["familias", "negocios"] as Segment[]).map((seg) => (
          <button
            key={seg}
            role="tab"
            aria-selected={s.segment === seg}
            onClick={() => setSegment(seg)}
            className={`rounded-lg px-4 py-3 text-lg font-semibold ${
              s.segment === seg ? "bg-teal text-white" : "text-teal"
            }`}
          >
            {seg === "familias" ? "Familias" : "Negocios"}
          </button>
        ))}
      </div>

      {/* Results first: on a phone, the answer shouldn't be ten boxes down */}
      <section aria-live="polite" className="space-y-4 rounded-2xl border-2 border-teal bg-white p-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm text-muted">Valor por pipa</p>
            <p className="text-2xl font-bold">{formatMxn(Math.round(value.total))}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Cuota</p>
            <p className="text-2xl font-bold">{formatMxn(s.feeMxn)}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Proporción</p>
            <p className="text-2xl font-bold">{ratioText(r.group)}</p>
          </div>
        </div>

        {r.group !== null && r.group >= 10 ? (
          <p className="rounded-xl bg-teal-soft p-3 font-semibold text-teal">Con estos supuestos se sostiene 10 a 1.</p>
        ) : (
          <p className="rounded-xl bg-amber-soft p-3 font-semibold text-amber">
            Todavía no llega a 10 a 1. Para llegar, la cuota tendría que ser {formatMxn(priceAt10to1(s))} o el valor
            por pipa {formatMxn(Math.round(s.feeMxn * 10))}.
          </p>
        )}

        <ul className="space-y-1 text-base leading-relaxed">
          {isFamily && <li>Tiempo de cobro ahorrado (menos el tiempo midiendo): {formatMxn(value.time)}</li>}
          <li>Protección contra pipa incompleta: {formatMxn(value.shortfall)}</li>
          {isFamily && (
            <li>
              Para cada hogar, solo cuenta su parte de la protección: <strong>{ratioText(r.household)}</strong>. El
              tiempo ahorrado es de quien organiza.
            </li>
          )}
          {!isFamily && <li>Un negocio no reparte entre vecinos: su único valor medible es el faltante.</li>}
        </ul>

        <div
          className={`rounded-xl border-2 p-3 ${det.detectable ? "border-teal bg-teal-soft" : "border-amber bg-amber-soft"}`}
        >
          {det.detectable ? (
            <p>
              Un faltante de {formatLitersWord(det.expectedShortfallLiters)} sí se distingue del margen de medición de{" "}
              {formatLitersWord(det.marginLiters)}.
            </p>
          ) : (
            <p className="text-amber">
              <strong>
                Con un margen de {formatLitersWord(det.marginLiters)}, un faltante de{" "}
                {formatLitersWord(det.expectedShortfallLiters)} no se puede detectar.
              </strong>{" "}
              {minPct !== null && `Esta medición solo distingue faltantes de más del ${number.format(minPct)}% de la pipa.`}{" "}
              Medir dos veces baja el error.
            </p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-3 border-t border-line pt-4">
          <div>
            <dt className="text-sm text-muted">{isFamily ? "Cisternas que pagan" : "Negocios que pagan"}</dt>
            <dd className="text-xl font-bold">{number.format(payingCisterns(s))}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Ingresos al mes</dt>
            <dd className="text-xl font-bold">{formatMxn(rev.monthly)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Ingresos al año</dt>
            <dd className="text-xl font-bold">{formatMxn(rev.annual)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Costo de atender al mes</dt>
            <dd className="text-xl font-bold">{formatMxn(cost.monthly)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Queda al mes</dt>
            <dd className={`text-xl font-bold ${margin < 0 ? "text-amber" : ""}`}>{formatMxn(margin)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Arranque (una vez)</dt>
            <dd className="text-xl font-bold">{formatMxn(cost.setupOnce)}</dd>
          </div>
        </dl>
        <p className="text-sm text-muted">
          Costo de atender = tu tiempo de alta y soporte, valuado igual que la hora de quien organiza. Hosting: $0
          (planes gratis).
        </p>
      </section>

      {GROUPS.map((g) => (
        <fieldset key={g.title} className="space-y-4 rounded-2xl border border-line bg-white p-5">
          <legend className="px-1 text-xl font-bold">{g.title}</legend>
          {g.keys.map((key) => {
            const f = FIELDS[key];
            const src = SOURCES[key];
            return (
              <label key={key} className="block space-y-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold">
                    {f.label}
                    {f.unit && ` (${f.unit})`}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-sm font-semibold ${STATUS_STYLE[src.status]}`}>
                    {STATUS_LABEL[src.status]}
                  </span>
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  maxLength={10}
                  value={drafts[key] ?? String(s[key])}
                  onChange={(e) => onChange(key, e.target.value)}
                  onBlur={() => onBlur(key)}
                  className="block w-full rounded-xl border-2 border-line bg-white px-4 py-3 text-xl outline-none focus:border-teal"
                />
                <span className="block text-sm text-muted">{src.source}</span>
              </label>
            );
          })}
        </fieldset>
      ))}

      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <h3 className="text-xl font-bold">Guardar este escenario</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={name}
            maxLength={MAX_NAME}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej. Fondas en temporada seca"
            aria-label="Nombre del escenario"
            className="block w-full rounded-xl border-2 border-line bg-white px-4 py-3 text-lg placeholder:italic placeholder:text-muted/50 outline-none focus:border-teal"
          />
          <button
            onClick={save}
            className="rounded-xl bg-teal px-6 py-3 text-lg font-semibold text-white hover:bg-teal-dark"
          >
            Guardar
          </button>
        </div>
        <button
          onClick={copyLink}
          className="w-full rounded-xl border-2 border-teal bg-white px-6 py-3 text-lg font-semibold text-teal"
        >
          Copiar enlace con estos números
        </button>
        {message && (
          <p role="status" className="rounded-xl bg-teal-soft p-3 text-teal">
            {message}
          </p>
        )}
        {saved === null ? (
          <p className="text-muted">Este navegador no permite guardar escenarios; el enlace sí funciona.</p>
        ) : saved.length > 0 ? (
          <ul className="divide-y divide-line">
            {saved.map((item) => (
              <li key={item.name} className="flex items-center justify-between gap-3 py-2">
                <button onClick={() => load(item)} className="text-left text-lg font-semibold text-teal underline">
                  {item.name}
                </button>
                <button onClick={() => remove(item)} className="text-sm text-muted underline">
                  Borrar
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Aún no guardas escenarios. Se guardan solo en este navegador.</p>
        )}
        <p className="text-sm text-muted">
          Los escenarios no tienen datos personales y no salen de tu navegador, salvo que compartas el enlace.
        </p>
      </section>
    </div>
  );
}
