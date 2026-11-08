// "¿Cómo mido?" (persona test, Don Chuy): he didn't know what to measure with, from where,
// or his cistern's size, and the driver won't wait. Plain <details>: opens without JavaScript.

const box = "rounded-2xl border-2 border-teal bg-teal-soft p-5";
const summary = "cursor-pointer py-1 text-xl font-bold text-teal";

// At the start of "Nueva pipa": what, where and when. Open until her first pipa is saved.
export function MeasureGuide({ open }: { open: boolean }) {
  return (
    <details open={open} className={box}>
      <summary className={summary}>¿Cómo mido?</summary>
      <ul className="mt-3 space-y-3 text-lg leading-relaxed">
        <li>
          <strong>Con qué:</strong> un palo o una cinta métrica. Un palo con marcas cada centímetro
          sirve.
        </li>
        <li>
          <strong>Dónde:</strong> mide la altura del agua desde el fondo de la cisterna. Mete el palo
          derecho hasta el fondo, sácalo y mira hasta dónde se mojó. Mide siempre en el mismo lugar.
        </li>
        <li>
          <strong>Cuándo:</strong> antes de que metan la manguera. Y después, cuando la manguera ya
          paró y el agua está quieta.
        </li>
      </ul>
    </details>
  );
}

// Next to the dimensions on the cistern form: the size is measured once, with time
export function CisternSizeGuide() {
  return (
    <details open className={box}>
      <summary className={summary}>¿Cómo mido mi cisterna?</summary>
      <ul className="mt-3 space-y-3 text-lg leading-relaxed">
        <li>
          <strong>Se mide una sola vez,</strong> con calma. No lo hagas mientras espera el pipero.
        </li>
        <li>
          <strong>Largo y ancho:</strong> por dentro, de pared a pared, en metros. Por ejemplo: 2.5.
        </li>
        <li>
          <strong>Altura máxima:</strong> desde el fondo hasta donde se sale el agua cuando está
          llena, en centímetros.
        </li>
        <li>Usa una cinta métrica. Si no sabes una medida, mídela antes de registrar tu primera pipa.</li>
      </ul>
    </details>
  );
}
