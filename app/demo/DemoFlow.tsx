"use client";

import Link from "next/link";
import { useState } from "react";
import { CollectionProgress, NEVER_HOLDS_MONEY, NotReadyButton, shareStateText } from "@/components/CollectionProgress";
import { ExampleBadge } from "@/components/ExampleBadge";
import { isReady, type CollectionShare } from "@/lib/collection";
import { DEMO, demoStartShares, demoSummary, demoVerdict } from "@/lib/demo";
import { formatLiters, formatLitersWord, formatMxn, formatTime } from "@/lib/format";
import { buildProgressMessage } from "@/lib/progress";
import { VERDICT_LABEL } from "@/lib/verdict";

const STEPS = ["Juntar", "Pedir", "Medir", "Veredicto", "Resumen"] as const;

const primary = "block w-full rounded-xl bg-teal px-6 py-4 text-center text-lg font-semibold text-white hover:bg-teal-dark";
const secondary = "block w-full rounded-xl border-2 border-teal bg-white px-6 py-3 text-center text-lg font-semibold text-teal";

export function DemoFlow() {
  const [step, setStep] = useState(0);
  const [shares, setShares] = useState<CollectionShare[]>(demoStartShares);
  const { result, note } = demoVerdict();

  const toggle = (label: string) =>
    setShares((all) =>
      all.map((s) =>
        s.label === label
          ? { ...s, state: s.state === "received" ? "pending" : "received", promisedFor: null }
          : s,
      ),
    );
  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0 });
  };
  const restart = () => {
    setShares(demoStartShares());
    go(0);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ExampleBadge label="DEMO · DATOS DE EJEMPLO" />
        <span className="text-base text-muted">
          Paso {step + 1} de {STEPS.length}: {STEPS[step]}
        </span>
      </div>
      <p className="text-base text-muted">
        Así funciona Pipa Clara, con datos inventados. No necesitas cuenta y no se guarda nada.
      </p>

      {step === 0 && (
        <>
          <h1 className="text-3xl font-bold">Juntando para la pipa</h1>
          <p className="text-lg text-muted">
            Pipa de {formatLiters(DEMO.litersClaimed)} · {DEMO.labels.length} hogares
          </p>
          <CollectionProgress
            priceMxn={DEMO.priceMxn}
            feeMxn={DEMO.feeMxn}
            amounts={shares.map((s) => s.amountMxn)}
            states={shares.map((s) => s.state)}
            agreedDate={DEMO.agreedDate}
          />
          <section className="space-y-2">
            <h2 className="text-xl font-bold">
              <span aria-hidden="true">🔒 </span>Solo tú ves esta lista
            </h2>
            <p className="text-base text-muted">Toca una casa para marcar que ya dio su parte. Prueba con Casa 4.</p>
            <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
              {shares.map((s) => (
                <li key={s.label}>
                  <button
                    type="button"
                    onClick={() => toggle(s.label)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-lg"
                  >
                    <span className="shrink-0 font-semibold">{s.label}</span>
                    <span
                      className={
                        s.state === "received" ? "font-semibold text-teal" : s.state === "promised" ? "text-amber" : "text-muted"
                      }
                    >
                      {shareStateText(s.state, s.promisedFor ?? null)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          {isReady(shares) ? (
            <button type="button" onClick={() => go(1)} className={primary}>
              Listo para pedir
            </button>
          ) : (
            <NotReadyButton states={shares.map((s) => s.state)} />
          )}
          <section className="space-y-2 rounded-2xl border border-line bg-white p-5">
            <h2 className="text-lg font-bold">Avance que le mandas al grupo por WhatsApp</h2>
            <p className="whitespace-pre-wrap rounded-xl bg-page p-4 text-base">
              {buildProgressMessage({ shares, agreedDate: DEMO.agreedDate })}
            </p>
            <p className="text-base text-muted">Solo cuántos, nunca quién. (En la demo no se manda nada.)</p>
          </section>
          <p className="text-center text-base text-muted">{NEVER_HOLDS_MONEY}</p>
        </>
      )}

      {step === 1 && (
        <>
          <h1 className="text-3xl font-bold">Listo para pedir</h1>
          <section className="space-y-3 rounded-2xl border-2 border-teal bg-white p-5 text-lg">
            <p className="text-xl font-bold text-teal">
              {DEMO.labels.length} de {DEMO.labels.length} ya dieron su parte.
            </p>
            <p>
              Tienes {formatMxn(DEMO.priceMxn + DEMO.feeMxn)}: {formatMxn(DEMO.priceMxn)} para el pipero y{" "}
              {formatMxn(DEMO.feeMxn)} de Pipa Clara. Ahora sí, pide la pipa. Nadie puso de su bolsa.
            </p>
            <p className="text-base text-muted">Por ahora no cobramos la cuota de $10. Si ya la juntaste, déjala para la siguiente pipa.</p>
          </section>
          <button type="button" onClick={() => go(2)} className={primary}>
            Llegó la pipa: medir
          </button>
          <button type="button" onClick={() => go(0)} className={secondary}>
            ← Volver
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="text-3xl font-bold">Medir frente al pipero</h1>
          <p className="text-lg text-muted">
            {DEMO.cistern.name}: {DEMO.cistern.lengthM} × {DEMO.cistern.widthM} m. Cada centímetro son{" "}
            {formatLiters(DEMO.cistern.lengthM * DEMO.cistern.widthM * 10)}.
          </p>
          <dl className="divide-y divide-line rounded-2xl border border-line bg-white px-5">
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="text-lg text-muted">Litros que dice el pipero</dt>
              <dd className="whitespace-nowrap text-2xl font-bold">{formatLiters(DEMO.litersClaimed)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="text-lg text-muted">
                Antes, {formatTime(DEMO.beforeAt)}
                <span className="block text-base">con el pipero presente</span>
              </dt>
              <dd className="whitespace-nowrap text-2xl font-bold">{DEMO.beforeCm} cm</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="text-lg text-muted">Después, {formatTime(DEMO.afterAt)}</dt>
              <dd className="whitespace-nowrap text-2xl font-bold">{DEMO.afterCm} cm</dd>
            </div>
          </dl>
          <p className="rounded-xl bg-page p-4 text-base text-muted">
            En la app tomas una foto de la cinta en cada lectura, avisándole al pipero. En la demo no hay fotos.
          </p>
          <button type="button" onClick={() => go(3)} className={primary}>
            Ver veredicto
          </button>
          <button type="button" onClick={() => go(1)} className={secondary}>
            ← Volver
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <h1 className="text-3xl font-bold">Veredicto</h1>
          <dl className="divide-y divide-line rounded-2xl border border-line bg-white px-5">
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="text-lg text-muted">Litros que dijo el pipero</dt>
              <dd className="whitespace-nowrap text-2xl font-bold">{formatLiters(DEMO.litersClaimed)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="text-lg text-muted">Litros que entraron (medidos)</dt>
              <dd className="whitespace-nowrap text-2xl font-bold">{formatLiters(result.measuredLiters ?? 0)}</dd>
            </div>
          </dl>
          <section className="space-y-2 rounded-2xl border-2 border-teal bg-white p-5">
            <p className="text-sm font-bold tracking-widest text-teal">VEREDICTO</p>
            <p className="text-3xl font-bold text-teal">{VERDICT_LABEL.consistent}</p>
            <p className="text-lg leading-relaxed">{note ?? result.reason}</p>
            <p className="text-base text-muted">
              La medición con cinta puede variar hasta {formatLitersWord(result.toleranceLiters)} en esta cisterna (2 cm
              por lectura). Aún no verificado en cisternas reales.
            </p>
          </section>
          <p className="text-base text-muted">
            El veredicto es evidencia, no sentencia: el pipero, un vecino o tú pueden registrar un desacuerdo.
          </p>
          <button type="button" onClick={() => go(4)} className={primary}>
            Ver resumen para el grupo
          </button>
          <button type="button" onClick={() => go(2)} className={secondary}>
            ← Volver
          </button>
        </>
      )}

      {step === 4 && (
        <>
          <h1 className="text-3xl font-bold">Resumen para el grupo</h1>
          <p className="text-lg">Esto es lo que mandarías por WhatsApp. Sin nombres de casas.</p>
          <pre className="whitespace-pre-wrap rounded-2xl border border-line bg-white p-5 font-sans text-base">
            {demoSummary(shares)}
          </pre>
          <button type="button" onClick={restart} className={secondary}>
            Empezar otra vez
          </button>
          <Link href="/login" className={primary}>
            Usar Pipa Clara con mi cisterna
          </Link>
        </>
      )}
    </div>
  );
}
