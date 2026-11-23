import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cómo funciona",
};

// The flow, condensed into the steps the organizer actually does.
// Week 15 (F6): step 0 is collecting before ordering, so she never covers anyone.
const steps = [
  {
    title: "Junten antes de pedir",
    body: "Abre una colecta: el precio del pipero más $10 de Pipa Clara, en partes iguales. Marca cada parte cuando te la den, o la fecha que prometieron. La pipa se pide cuando ya juntaron todos: tú no pones de tu bolsa. Al grupo le mandas el avance: cuántos ya dieron, nunca quién.",
  },
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
          Una cinta métrica, tu celular y cinco pasos. Lo hace quien organiza la pipa; los vecinos
          solo reciben el resumen.
        </p>
      </section>

      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4 rounded-2xl border border-line bg-white p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal text-xl font-bold text-white">
              {i}
            </span>
            <div className="space-y-1">
              <h2 className="text-xl font-bold">{step.title}</h2>
              <p className="leading-relaxed text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="space-y-3 rounded-2xl border-2 border-teal bg-white p-5">
        <h2 className="text-xl font-bold">Pipa Clara nunca guarda dinero</h2>
        <p className="leading-relaxed">
          Tú cobras como siempre, en efectivo o como lo hagan en tu grupo. La app solo anota quién ya dio su
          parte, para que no lo tengas que recordar.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Los tres veredictos</h2>
        <ul className="space-y-3">
          <li className="rounded-xl border-2 border-teal bg-white p-4">
            <strong className="text-teal">Llegó lo que dijo el pipero:</strong> entraron los litros
            que dijo el pipero, dentro de lo que puede variar la medición con cinta.
          </li>
          <li className="rounded-xl border-2 border-amber bg-amber-soft p-4">
            <strong className="text-amber">Entraron menos litros:</strong> la diferencia es mayor de lo
            que puede variar la medición con cinta.
          </li>
          <li className="rounded-xl border-2 border-line bg-white p-4">
            <strong>No se pudo medir:</strong> faltó una lectura, la bomba estuvo prendida o la
            cisterna se desbordó. Es una respuesta honesta, no una adivinanza.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Si alguien no está de acuerdo</h2>
        <p className="leading-relaxed">
          Una diferencia es evidencia, no sentencia. El pipero, un vecino o quien organiza pueden registrar un
          desacuerdo. Queda guardado junto al veredicto y nunca se borra.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Las fotos</h2>
        <p className="leading-relaxed">
          Antes de tomar la foto, dile al pipero cuándo y para qué: es la prueba del nivel de la cisterna, para
          los dos. Las fotos se guardan en una carpeta privada de tu cuenta y nunca se publican.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl bg-teal-soft p-5">
        <h2 className="text-xl font-bold">Cuentas que puedes hacer a mano</h2>
        <p className="leading-relaxed">
          <strong>Litros medidos</strong> = (nivel después − nivel antes, en cm) × largo × ancho ×
          10.
        </p>
        <p className="leading-relaxed">
          <strong>Cuánto puede variar la medición con cinta</strong> = 2 cm por lectura, para arriba o
          para abajo. En una cisterna de 2 × 2 m puede variar hasta 160 litros, menos del 2% de una pipa
          de 10,000 L.
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
