import type { Metadata } from "next";
import Link from "next/link";
import { formatMxn } from "@/lib/format";
import { CONVERSATIONS, STATE_LABEL, type ConversationState } from "@/lib/pricing-conversations";
import { DEFAULTS, FAMILY_FEE_PER_DELIVERY, defaultFeePerHousehold, priceAt10to1 } from "@/lib/pricing";
import { Simulator } from "./Simulator";

export const metadata: Metadata = {
  title: "Precios",
};

const ALL_STATES: ConversationState[] = ["asked", "said_yes", "approved_in_writing", "paid", "renewed"];

export default function PricingPage() {
  const perHousehold = defaultFeePerHousehold(DEFAULTS.familias.households);
  const businessPrice = priceAt10to1(DEFAULTS.negocios);

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold leading-tight">Precios</h1>
        <p className="text-xl leading-relaxed text-muted">
          Quién paga, cuánto, por qué, y qué números son medidos y cuáles todavía son supuestos.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Tres niveles, dos segmentos</h2>

        <article className="space-y-2 rounded-2xl border border-line bg-white p-5">
          <p className="text-sm font-bold tracking-widest text-muted">VECINOS</p>
          <p className="text-3xl font-bold">Gratis</p>
          <p className="leading-relaxed">
            Los hogares que comparten la cisterna reciben el resumen por WhatsApp: cuántos litros entraron, cuánto paga
            cada hogar y cuántos ya pagaron. No necesitan la app ni pagan nada aparte.
          </p>
        </article>

        <article className="space-y-2 rounded-2xl border-2 border-teal bg-white p-5">
          <p className="text-sm font-bold tracking-widest text-teal">FAMILIAS · cisterna compartida</p>
          <p className="text-3xl font-bold">
            {formatMxn(FAMILY_FEE_PER_DELIVERY)} <span className="text-xl font-semibold">por pipa</span>
          </p>
          <ul className="list-disc space-y-1 pl-5 leading-relaxed">
            <li>
              <strong>Usa:</strong> quien organiza la pipa. <strong>Paga:</strong> los hogares, dentro de su parte
              (unos {formatMxn(perHousehold)} por hogar en una cisterna de {DEFAULTS.familias.households}).
            </li>
            <li>Desde la primera pipa. Todos ven el total con la cuota antes de comprometerse.</li>
            <li>Incluye: medición antes y después, veredicto con su margen, reparto, registro de pagos y resumen.</li>
          </ul>
        </article>

        <article className="space-y-2 rounded-2xl border-2 border-amber bg-white p-5">
          <p className="text-sm font-bold tracking-widest text-amber">NEGOCIOS · fondas, tortillerías, lavanderías</p>
          <p className="text-3xl font-bold">
            {formatMxn(Math.round(businessPrice))} <span className="text-xl font-semibold">por pipa, por ahora</span>
          </p>
          <ul className="list-disc space-y-1 pl-5 leading-relaxed">
            <li>
              <strong>Usa y paga:</strong> el dueño o encargado del negocio.
            </li>
            <li>
              <strong>Regla:</strong> precio = lo que vale una pipa medida ÷ 10. Hoy ese valor sale de una analogía con
              la gasolina, así que el precio es bajo y honesto. Se recalcula con las primeras 10 pipas medidas.
            </li>
            <li>Un negocio no reparte entre vecinos: su valor es el faltante y saber cuándo pedir la siguiente pipa.</li>
          </ul>
        </article>

        <div className="space-y-2 rounded-2xl bg-teal-soft p-5">
          <h3 className="text-xl font-bold">Dónde está la línea entre gratis y pagado</h3>
          <p className="leading-relaxed">
            Paga quien usa la medición y recibe su valor: quien organiza (con su grupo) y el negocio. Es gratis para
            quien solo lee el resultado. No hay nivel gratis para medir: un precio de casi cero se lee como algo que no
            vale, y las familias que compran pipa privada merecen una herramienta que se sostenga.
          </p>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border-2 border-ink bg-white p-5">
        <h2 className="text-2xl font-bold">Lo que el dinero nunca compra</h2>
        <ul className="list-disc space-y-1 pl-5 leading-relaxed">
          <li>Pagar o no pagar la cuota nunca cambia un veredicto.</li>
          <li>El margen de medición y las fotos con hora siempre están a la vista.</li>
          <li>Un desacuerdo queda guardado junto al veredicto y nunca se borra.</li>
          <li>La cuota nunca pasa por las manos del pipero. Ni el pipero ni la compañía pagan nunca nada.</li>
          <li>
            Cobro: quien organiza aparta la cuota y la transferirá a Pipa Clara una vez al mes.{" "}
            <strong>En el piloto todavía no está activo.</strong>
          </li>
        </ul>
      </section>

      <section id="simulador" className="scroll-mt-4 space-y-4">
        <h2 className="text-2xl font-bold">Simulador</h2>
        <p className="leading-relaxed text-muted">
          Los mismos supuestos que usa el{" "}
          <Link href="/about#caso-10-a-1" className="font-semibold text-teal underline">
            caso 10 a 1
          </Link>
          . Cada número dice si es medido, supuesto o una analogía sin validar.
        </p>
        <Simulator />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Conversaciones reales de precio</h2>
        <p className="leading-relaxed text-muted">
          Preguntarle a alguien que de verdad podría pagar. Cada paso se registra aparte: decir que sí no es pagar. Un
          «no» también cuenta. Solo roles, nunca nombres.
        </p>
        {CONVERSATIONS.map((c) => {
          const planned = c.states.includes("planned");
          return (
            <article key={c.role} className="space-y-3 rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold tracking-widest text-muted">{c.segment.toUpperCase()}</p>
                {planned && (
                  <span className="rounded-full bg-amber-soft px-3 py-1 text-sm font-semibold text-amber">
                    Pendiente
                  </span>
                )}
              </div>
              <p className="text-lg font-semibold">{c.role}</p>
              <p className="leading-relaxed">
                <span className="text-muted">Pregunta: </span>«{c.question}»
              </p>
              {c.priceAskedMxn !== null && <p>Precio preguntado: {formatMxn(c.priceAskedMxn)} por pipa</p>}
              {c.answer && (
                <blockquote className="rounded-xl border-l-4 border-teal bg-page p-3 italic">«{c.answer}»</blockquote>
              )}
              {c.whatItMeans && (
                <p className="leading-relaxed">
                  <span className="text-muted">Qué significa para el precio: </span>
                  {c.whatItMeans}
                </p>
              )}
              <ul className="flex flex-wrap gap-2">
                {[...ALL_STATES, ...(c.states.includes("said_no") ? (["said_no"] as const) : [])].map((st) => {
                  const done = c.states.includes(st);
                  return (
                    <li
                      key={st}
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        done ? "bg-teal text-white" : "bg-page text-muted"
                      }`}
                    >
                      {done ? "✓ " : ""}
                      {STATE_LABEL[st]}
                    </li>
                  );
                })}
              </ul>
              {c.date && <p className="text-sm text-muted">Fecha: {c.date}</p>}
            </article>
          );
        })}
      </section>
    </div>
  );
}
