import Link from "next/link";
import { ExampleBadge } from "@/components/ExampleBadge";
import { OptInForm } from "@/components/OptInForm";

// Week 15: the homepage speaks to the encargada (PACKET §3.1, F3). The example shows
// payment BEFORE delivery: 6 de 6 pagaron → se pidió → se midió.
const exampleSteps = [
  { n: 1, title: "6 de 6 pagaron", body: "$1,500 del pipero + $10 de Pipa Clara. Cada hogar: $251 o $252. Para que sume exacto, a algunas casas les toca $1 más." },
  { n: 2, title: "Se pidió", body: "Con todo el dinero junto. Nadie puso de su bolsa." },
  { n: 3, title: "Se midió", body: "Frente al pipero, antes y después de descargar." },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <h1 className="text-4xl font-bold leading-tight">Ya no pongas dinero de tu bolsa.</h1>
        <p className="text-xl leading-relaxed">
          La pipa se pide cuando ya juntaron todos, y tú ves quién falta.
        </p>
        <p className="text-xl leading-relaxed text-muted">
          Los litros se miden frente al pipero: evidencia, no sentencia.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/demo"
            className="rounded-xl bg-teal px-6 py-4 text-center text-lg font-semibold text-white hover:bg-teal-dark"
          >
            Probar la demo, sin cuenta
          </Link>
          <Link
            href="/product"
            className="rounded-xl border-2 border-teal bg-white px-6 py-4 text-center text-lg font-semibold text-teal"
          >
            Ver cómo funciona
          </Link>
        </div>
      </section>

      {/* Example: same numbers as the Week 15 mockup, in the new order */}
      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">Así se ve una pipa juntada y medida</h2>
          <ExampleBadge />
        </div>
        <ol className="space-y-3">
          {exampleSteps.map((step) => (
            <li key={step.n} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal font-bold text-white">
                {step.n}
              </span>
              <p>
                <strong className="block text-lg">{step.title}</strong>
                <span className="text-muted">{step.body}</span>
              </p>
            </li>
          ))}
        </ol>
        <dl className="divide-y divide-line">
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-muted">Litros que dijo el pipero</dt>
            <dd className="whitespace-nowrap text-2xl font-bold">10,000 L</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-muted">Litros que entraron (medidos)</dt>
            <dd className="whitespace-nowrap text-2xl font-bold">9,900 L</dd>
          </div>
        </dl>
        <div className="rounded-xl border-2 border-teal p-4">
          <p className="text-sm font-bold tracking-widest text-teal">VEREDICTO</p>
          <p className="text-3xl font-bold text-teal">Llegó lo que dijo el pipero</p>
          <p className="mt-1">
            Entraron unos 100 litros menos, pero la medición con cinta puede variar hasta 300 litros en esta
            cisterna de 3 × 2.5 m (2 cm por lectura). Eso aún no está verificado en cisternas reales.
          </p>
        </div>
        <span className="inline-block rounded-full bg-teal-soft px-4 py-2 font-semibold text-teal">
          Ya pagaron: 6 de 6, antes de pedir
        </span>
      </section>

      <section id="avisame" className="scroll-mt-4 space-y-4 rounded-2xl border border-line bg-teal-soft p-5">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">¿Organizas la pipa de tu vecindad o edificio?</h2>
          <p className="text-lg">
            Estamos probando Pipa Clara con pocos grupos, para poder acompañar a cada uno. Déjanos tu contacto y
            te escribimos.
          </p>
        </div>
        <OptInForm />
        <p className="text-base text-muted">
          Más en <Link href="/privacidad" className="font-semibold text-teal underline">Privacidad</Link>, también cómo
          pedir que borremos tu contacto.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Lo que nunca cambia</h2>
        <ul className="space-y-3">
          <li className="rounded-xl bg-white p-4">
            <strong>Nadie mide solo.</strong> La lectura de &quot;antes&quot; se toma con el
            pipero presente, con foto y hora.
          </li>
          <li className="rounded-xl bg-white p-4">
            <strong>Todo se puede reclamar.</strong> El veredicto es evidencia, no sentencia. Un
            desacuerdo queda guardado junto a él.
          </li>
          <li className="rounded-xl bg-white p-4">
            <strong>Los vecinos ven lo justo.</strong> Cuánta agua entró, cuánto paga cada hogar y
            cuántos ya pagaron. Nunca quién.
          </li>
        </ul>
      </section>
    </div>
  );
}
