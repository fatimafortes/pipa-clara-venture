import type { Metadata } from "next";
import Link from "next/link";
import { formatLitersWord, formatMxn } from "@/lib/format";
import {
  DEFAULTS,
  defaultFeePerHousehold,
  detectability,
  minDetectablePct,
  ratios,
  valuePerDelivery,
} from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Por qué",
};

const fam = DEFAULTS.familias;
const v = valuePerDelivery(fam);
const r = ratios(fam);
const low = ratios({ ...fam, collectHours: 1 });
const high = ratios({ ...fam, collectHours: 2 });
const det = detectability(fam);
const minPct = minDetectablePct(fam);
const atMinScenario = { ...fam, shortfallPct: minPct ?? fam.shortfallPct };
const atMin = valuePerDelivery(atMinScenario);
const ratio = (x: number | null) => (x === null ? "—" : `${(Math.round(x * 10) / 10).toLocaleString("es-MX")} a 1`);

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold leading-tight">Por qué Pipa Clara</h1>
        <p className="text-xl leading-relaxed text-muted">
          Cuando llega la pipa, el único número que hay es el que dice el pipero.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">La necesidad</h2>
        <p className="leading-relaxed">
          Quien organiza la pipa le paga completo al pipero en la puerta y después tiene que cobrarle
          a una docena de hogares. Cuando el agua se acaba antes de tiempo, nadie puede saber si la
          pipa dejó menos o si un hogar gastó más, y el pleito queda entre vecinos.
        </p>
        <p className="leading-relaxed">
          Una queja a la compañía no llega a nada porque es una sospecha, no una prueba. Las pipas
          incompletas son raras y espaciadas, y justo por eso nadie tiene pruebas el día que pasa.
        </p>
        <blockquote className="rounded-xl border-l-4 border-teal bg-white p-4 italic leading-relaxed">
          &quot;Cuando faltó agua, los vecinos empezaron a decir que unos gastaban más que otros, y
          yo no tenía cómo demostrar nada.&quot;
          <footer className="mt-2 text-sm not-italic text-muted">
            Rosa, organizadora: persona basada en nuestra investigación (nombre inventado)
          </footer>
        </blockquote>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Quién paga</h2>
        <p className="leading-relaxed">
          Los hogares que comparten la cisterna: {formatMxn(fam.feeMxn)} por pipa, sumados al costo y repartidos en la
          misma parte que ya cobra quien organiza (unos {formatMxn(defaultFeePerHousehold(fam.households))} por hogar en
          una cisterna de {fam.households}). Desde la primera pipa. Los detalles están en{" "}
          <Link href="/pricing" className="font-semibold text-teal underline">
            Precios
          </Link>
          .
        </p>
        <p className="leading-relaxed">
          La compañía de agua y el pipero nunca pagan ni patrocinan nada: quien es medido no puede pagar la medición.
        </p>
      </section>

      {/* Week 14 memo: same numbers as the simulator, from lib/pricing.ts */}
      <section id="caso-10-a-1" className="scroll-mt-4 space-y-5">
        <h2 className="text-2xl font-bold">El caso 10 a 1</h2>
        <p className="leading-relaxed">
          <strong>Usuaria:</strong> quien organiza la pipa privada de una cisterna compartida.{" "}
          <strong>Pagan:</strong> los {fam.households} hogares, dentro de su parte. <strong>La misma tarea:</strong>{" "}
          una pipa de {formatMxn(fam.pipaPriceMxn)}, desde que se pide hasta que todos pagaron.
        </p>

        <div className="space-y-2 rounded-2xl border-2 border-amber bg-amber-soft p-5">
          <p className="text-sm font-bold tracking-widest text-amber">HOY</p>
          <ul className="list-disc space-y-1 pl-5 leading-relaxed">
            <li>
              <strong>Dinero:</strong> paga los {formatMxn(fam.pipaPriceMxn)} de su bolsa y cobra después, casa por
              casa. Nadie sabe si la pipa dejó menos.
            </li>
            <li>
              <strong>Tiempo:</strong> de 1 a 2 horas cobrando y anotando en la libreta.
            </li>
            <li>
              <strong>Riesgo:</strong> si el agua se acaba antes, no hay cómo probar nada y el pleito queda entre
              vecinos.
            </li>
          </ul>
          <p className="text-sm italic">
            «Esto me serviría para no tener que estar anotando todo en mi libreta.» Organizadora, sesión real, semana
            13.
          </p>
        </div>

        <div className="space-y-2 rounded-2xl border-2 border-teal bg-white p-5">
          <p className="text-sm font-bold tracking-widest text-teal">CON PIPA CLARA</p>
          <ul className="list-disc space-y-1 pl-5 leading-relaxed">
            <li>
              <strong>Precio:</strong> {formatMxn(fam.feeMxn)} por pipa.
            </li>
            <li>
              <strong>Tiempo:</strong> unos {fam.measureMinutes} minutos midiendo, a cambio del cobro y la libreta.
            </li>
            <li>
              <strong>Riesgo:</strong> un veredicto con su margen, con foto y hora, que los dos lados vieron.
            </li>
          </ul>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-base">
            <thead className="bg-teal-soft text-teal">
              <tr>
                <th className="p-3">Valor por pipa</th>
                <th className="p-3">Pesos</th>
                <th className="p-3">¿Qué tan cierto?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr>
                <td className="p-3">
                  Tiempo ahorrado: {fam.collectHours} h − {fam.measureMinutes} min, a {formatMxn(fam.wageMxnHour)} la
                  hora
                </td>
                <td className="p-3 font-semibold">{formatMxn(v.time)}</td>
                <td className="p-3">Salario medido; horas supuestas</td>
              </tr>
              <tr>
                <td className="p-3">Pipa incompleta: {fam.shortfallPct}% de {formatMxn(fam.pipaPriceMxn)}</td>
                <td className="p-3 font-semibold">{formatMxn(v.shortfall)}</td>
                <td className="p-3">Analogía con la gasolina, sin validar</td>
              </tr>
              <tr className="bg-page font-bold">
                <td className="p-3">Total</td>
                <td className="p-3">{formatMxn(Math.round(v.total))}</td>
                <td className="p-3">—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-3 rounded-2xl bg-white p-5">
          <p className="text-xl font-bold">La cuenta honesta: todavía no es 10 a 1.</p>
          <ul className="list-disc space-y-1 pl-5 leading-relaxed">
            <li>
              Para el grupo: <strong>{ratio(r.group)}</strong> (entre {ratio(low.group)} y {ratio(high.group)} si cobrar
              toma 1 o 2 horas).
            </li>
            <li>
              Para cada hogar: <strong>{ratio(r.household)}</strong>. El tiempo ahorrado es de quien organiza; a cada
              hogar solo le toca su parte de la protección.
            </li>
            <li>
              Lo que no tiene precio todavía: terminar el pleito de «unos gastan más». En la semana 13, 3 de 5 personas
              dijeron que un vecino que no paga es peor que una pipa incompleta. Pipa Clara lo hace visible; no obliga a
              pagar, así que no lo sumamos.
            </li>
          </ul>
        </div>

        <div className="space-y-2 rounded-2xl bg-teal-soft p-5">
          <p className="text-xl font-bold">Qué tendría que ser cierto</p>
          <p className="leading-relaxed">
            Con un margen de {formatLitersWord(det.marginLiters)}, esta medición solo distingue faltantes de más del{" "}
            {minPct}% de la pipa. Si las pipas dejan ese {minPct}% menos, el valor sube a{" "}
            {formatMxn(Math.round(atMin.total))} y la cuenta da <strong>{ratio(ratios(atMinScenario).group)}</strong>.
            Si dejan menos, la medición no lo ve y el caso descansa en el tiempo ahorrado.
          </p>
          <p className="leading-relaxed">
            <strong>El riesgo principal:</strong> nadie ha medido cuánto faltan las pipas de agua. Las primeras 10
            pipas medidas reemplazan la analogía con la gasolina. No bajamos la cuota para que la cuenta salga: lo que
            falta es medir.
          </p>
          <Link href="/pricing#simulador" className="inline-block py-2 font-semibold text-teal underline">
            Cambia los supuestos en el simulador
          </Link>
        </div>
      </section>
    </div>
  );
}
