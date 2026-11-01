import type { Metadata } from "next";
import { ExampleBadge } from "@/components/ExampleBadge";

export const metadata: Metadata = {
  title: "Por qué",
};

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
          Los hogares que comparten la cisterna. Se suma una cuota pequeña a cada pipa, dentro de
          la misma parte que ya cobra quien organiza:
        </p>
        <ul className="space-y-2">
          <li className="rounded-xl bg-white p-4">
            <strong>Precio piloto:</strong> $2 por hogar por pipa (unos $10 en una cisterna de 5
            hogares).
          </li>
          <li className="rounded-xl bg-white p-4">
            <strong>Precio sostenible:</strong> unos $4 por hogar, cerca del 1% de una pipa de
            $1,800.
          </li>
        </ul>
        <p className="leading-relaxed">
          La compañía de agua y el pipero nunca pagan ni patrocinan nada: quien es medido no puede
          pagar la medición.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-bold">El caso 10 a 1</h2>
          <ExampleBadge />
        </div>
        <p className="leading-relaxed">
          Una vecindad de 12 hogares paga $1,800 por una pipa de 10,000 L. Llegan 8,700 L: faltan
          1,300 L.
        </p>
        <dl className="divide-y divide-line">
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-muted">Pagado por agua que no llegó</dt>
            <dd className="text-2xl font-bold text-amber">$234</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-muted">Cuota de Pipa Clara por esa pipa (12 × $2)</dt>
            <dd className="text-2xl font-bold text-teal">$24</dd>
          </div>
        </dl>
        <p className="leading-relaxed">
          Un solo faltante como éste cuesta casi lo mismo que <strong>10 pipas medidas</strong>.
          Por eso vale la pena medir siempre, aunque casi nunca falte agua: el día que falta, ya
          tienes la prueba.
        </p>
      </section>
    </div>
  );
}
