import Link from "next/link";
import { ExampleBadge } from "@/components/ExampleBadge";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <h1 className="text-4xl font-bold leading-tight">
          ¿Cuántos litros entraron de verdad?
        </h1>
        <p className="text-xl leading-relaxed text-muted">
          Los hogares que comparten una cisterna revisan cuánta agua dejó la pipa: los litros que
          dice el pipero contra los litros que entraron. Y reparten el costo con pruebas, no con
          sospechas.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/product"
            className="rounded-xl bg-teal px-6 py-4 text-center text-lg font-semibold text-white hover:bg-teal-dark"
          >
            Ver cómo funciona
          </Link>
          <Link
            href="/about"
            className="rounded-xl border-2 border-teal bg-white px-6 py-4 text-center text-lg font-semibold text-teal"
          >
            ¿Por qué Pipa Clara?
          </Link>
        </div>
      </section>

      {/* Example summary, same numbers as the mockup */}
      <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">Así se ve una pipa medida</h2>
          <ExampleBadge />
        </div>
        <dl className="divide-y divide-line">
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-muted">Litros que dijo el pipero</dt>
            <dd className="text-2xl font-bold">10,000 L</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-muted">Litros que entraron (medidos)</dt>
            <dd className="text-2xl font-bold">8,700 L</dd>
          </div>
        </dl>
        <div className="rounded-xl border-2 border-amber bg-amber-soft p-4">
          <p className="text-sm font-bold tracking-widest text-amber">VEREDICTO</p>
          <p className="text-3xl font-bold text-amber">Faltante: 1,300 L</p>
          <p className="mt-1 text-amber">
            Entraron menos litros de los que dijo el pipero, más allá del margen de medición de 300
            litros.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>
            <span className="block text-muted">Cada hogar paga</span>
            <span className="text-3xl font-bold">$152</span>
          </p>
          <span className="rounded-full bg-teal-soft px-4 py-2 font-semibold text-teal">
            Ya pagaron: 7 de 12
          </span>
        </div>
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
