import type { Metadata } from "next";

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

      {/* The 10:1 case from the founder's Verdict, gate 2: impossible proof vs. near-free witnessed evidence */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">El caso 10 a 1</h2>
        <p className="leading-relaxed">
          Las pipas incompletas son raras. Lo que cambia no es cuánto dinero se recupera, sino que
          por fin se puede probar.
        </p>

        <div className="space-y-2 rounded-2xl border-2 border-amber bg-amber-soft p-5">
          <p className="text-sm font-bold tracking-widest text-amber">HOY</p>
          <p className="text-xl font-bold">Probar un faltante es imposible.</p>
          <ul className="list-disc space-y-1 pl-5 leading-relaxed">
            <li>Es la palabra del pipero contra una sospecha.</li>
            <li>La pelea cae entre vecinos.</li>
            <li>El reclamo a la compañía se ignora.</li>
          </ul>
        </div>

        <div className="space-y-2 rounded-2xl border-2 border-teal bg-white p-5">
          <p className="text-sm font-bold tracking-widest text-teal">CON PIPA CLARA</p>
          <p className="text-xl font-bold">Una cinta métrica y dos fotos con hora.</p>
          <p className="leading-relaxed">
            Eso convierte la sospecha en evidencia que los dos lados atestiguaron: la lectura de
            &quot;antes&quot; se toma con el pipero presente. Y casi no cuesta: $2 por hogar por
            pipa.
          </p>
        </div>

        <div className="space-y-2 rounded-2xl bg-teal-soft p-5">
          <p className="text-xl font-bold">Y en las pipas normales, también sirve.</p>
          <p className="leading-relaxed">
            Un veredicto <strong>consistente</strong> les dice a los vecinos que, si el agua se
            acaba antes, es por consumo, no por el pipero. Eso termina la pelea.
          </p>
        </div>
      </section>
    </div>
  );
}
