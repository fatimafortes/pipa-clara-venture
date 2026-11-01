import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cómo funciona",
};

// The flow from PACKET §5, condensed into the 4 steps the organizer actually does
const steps = [
  {
    title: "Registra tu cisterna, una sola vez",
    body: "Largo, ancho y altura máxima, y cuántos hogares la comparten. Con eso sabemos cuántos litros vale cada centímetro: largo × ancho × 10.",
  },
  {
    title: "Antes de que descargue: mide y toma foto",
    body: "Anota los litros que dice el pipero y el precio. Mide el nivel de la cisterna en centímetros y toma una foto con el pipero presente. La foto guarda la hora.",
  },
  {
    title: "Después de que descargue: mide otra vez",
    body: "Mide el nivel de nuevo y toma otra foto. Si la bomba al tinaco estuvo prendida o la cisterna se desbordó, lo marcas: así no se puede medir y la app lo dice claro.",
  },
  {
    title: "Veredicto, reparto y resumen",
    body: "La app compara los litros que dijo el pipero con los que entraron, reparte el costo en partes iguales y te deja mandar el resumen al grupo de WhatsApp.",
  },
];

export default function ProductPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-4xl font-bold leading-tight">Cómo funciona</h1>
        <p className="text-xl leading-relaxed text-muted">
          Una cinta métrica, tu celular y cuatro pasos. Lo hace quien organiza la pipa; los vecinos
          solo reciben el resumen.
        </p>
      </section>

      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4 rounded-2xl border border-line bg-white p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal text-xl font-bold text-white">
              {i + 1}
            </span>
            <div className="space-y-1">
              <h2 className="text-xl font-bold">{step.title}</h2>
              <p className="leading-relaxed text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Los tres veredictos</h2>
        <ul className="space-y-3">
          <li className="rounded-xl border-2 border-teal bg-white p-4">
            <strong className="text-teal">Consistente:</strong> entraron los litros que dijo el
            pipero, dentro del margen de medición.
          </li>
          <li className="rounded-xl border-2 border-amber bg-amber-soft p-4">
            <strong className="text-amber">Faltante:</strong> entraron menos litros, más allá del
            margen.
          </li>
          <li className="rounded-xl border-2 border-line bg-white p-4">
            <strong>No se pudo medir:</strong> faltó una lectura, la bomba estuvo prendida o la
            cisterna se desbordó. Es una respuesta honesta, no una adivinanza.
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl bg-teal-soft p-5">
        <h2 className="text-xl font-bold">Cuentas que puedes hacer a mano</h2>
        <p className="leading-relaxed">
          <strong>Litros medidos</strong> = (nivel después − nivel antes, en cm) × largo × ancho ×
          10.
        </p>
        <p className="leading-relaxed">
          <strong>Margen</strong> = ±2 cm por lectura. En una cisterna de 2 × 2 m son ±160 L,
          menos del 2% de una pipa de 10,000 L.
        </p>
        <p className="leading-relaxed">
          Sin inteligencia artificial: es aritmética que cualquiera puede revisar.
        </p>
      </section>

      <Link
        href="/about"
        className="block rounded-xl border-2 border-teal bg-white px-6 py-4 text-center text-lg font-semibold text-teal"
      >
        ¿Por qué hace falta? →
      </Link>
    </div>
  );
}
