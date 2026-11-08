import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidad",
};

// Same address as "User support email" in Google Auth Platform → Branding
const SUPPORT_EMAIL = "fatimafortes.builds@gmail.com";

// Only say what the app really does today; update the date with every change
export default function PrivacyPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold leading-tight">Privacidad</h1>
        <p className="text-xl leading-relaxed text-muted">
          Pipa Clara guarda solo lo necesario para medir tu pipa y repartir el costo.
        </p>
        <p className="text-sm text-muted">Actualizado el 8 de noviembre de 2026.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Qué guardamos</h2>
        <ul className="space-y-2">
          <li className="rounded-xl bg-white p-4 leading-relaxed">
            <strong>Para entrar:</strong> tu correo y tu nombre de Google, y el enlace a tu foto de
            perfil. Google nos los manda cuando entras. Nunca vemos tu contraseña.
          </li>
          <li className="rounded-xl bg-white p-4 leading-relaxed">
            <strong>Tu cisterna:</strong> sus medidas y cuántos hogares la comparten, con nombres
            como &quot;Depto 3&quot;. No escribas nombres de personas.
          </li>
          <li className="rounded-xl bg-white p-4 leading-relaxed">
            <strong>Cada pipa:</strong> los litros que dijo el pipero, el precio, la cuota, el
            nivel de antes y de después con su hora, si el pipero estuvo presente, si la bomba
            estuvo prendida y el resultado.
          </li>
          <li className="rounded-xl bg-white p-4 leading-relaxed">
            <strong>Fotos de las lecturas:</strong> antes de subirlas, tu teléfono las hace más
            chicas y les quita los datos ocultos, también la ubicación.
          </li>
          <li className="rounded-xl bg-white p-4 leading-relaxed">
            <strong>Pagos:</strong> qué hogar ya pagó su parte y cuánto le pagaste al pipero.
          </li>
          <li className="rounded-xl bg-white p-4 leading-relaxed">
            <strong>Desacuerdos:</strong> quién no estuvo de acuerdo y la nota que escribiste.
          </li>
          <li className="rounded-xl bg-white p-4 leading-relaxed">
            <strong>Registro de acciones:</strong> cuándo entras, registras tu cisterna, guardas
            una pipa, ves un resultado, mandas el resumen o registras un desacuerdo. Solo la acción
            y la hora: sin tu dirección de internet (IP) y sin datos de tu teléfono.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Para qué</h2>
        <p className="leading-relaxed">
          Para que puedas entrar, ver el resultado de cada pipa, saber cuánto paga cada hogar y
          tener las pruebas guardadas si alguien no está de acuerdo. El registro de acciones nos
          dice si la gente regresa a usar Pipa Clara y dónde se atora, para mejorarla.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Quién lo puede ver</h2>
        <ul className="space-y-2">
          <li className="rounded-xl bg-white p-4 leading-relaxed">
            <strong>Solo tú,</strong> la persona que organiza. La base de datos tiene reglas por
            cuenta: otra cuenta no puede ver ni cambiar tus datos.
          </li>
          <li className="rounded-xl bg-white p-4 leading-relaxed">
            <strong>Tus vecinos no entran a la app.</strong> Solo ven el resumen que tú decidas
            mandar por WhatsApp: los litros, el resultado, cuánto paga cada hogar, cuántos hogares
            ya pagaron (no cuáles) y las notas de desacuerdo. Lo que mandas por WhatsApp queda en
            WhatsApp.
          </li>
          <li className="rounded-xl bg-white p-4 leading-relaxed">
            <strong>Quien administra Pipa Clara</strong> tiene acceso técnico a la base de datos
            para mantenerla y arreglar errores.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Tus fotos son privadas</h2>
        <p className="leading-relaxed">
          Se guardan en una carpeta privada de tu cuenta. Para mostrártelas, la app crea un enlace
          que deja de servir en una hora. Desde la app no se pueden cambiar ni borrar, porque son la
          prueba de la lectura.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Lo que no hacemos</h2>
        <ul className="list-disc space-y-1 pl-5 leading-relaxed">
          <li>No vendemos ni compartimos tus datos.</li>
          <li>No hay anuncios.</li>
          <li>
            No usamos Google Analytics ni otros rastreadores. Solo usamos las cookies necesarias
            para que tu sesión siga abierta.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Servicios que usamos</h2>
        <p className="leading-relaxed">
          Pipa Clara funciona sobre tres servicios: <strong>Google</strong> (para entrar),{" "}
          <strong>Supabase</strong> (guarda los datos y las fotos) y <strong>Vercel</strong> (muestra
          la página). Vercel recibe datos técnicos de cada visita, como la dirección de internet,
          para poder entregar la página.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Borrar tus datos</h2>
        <p className="leading-relaxed">
          Escribe a{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-teal underline">
            {SUPPORT_EMAIL}
          </a>{" "}
          desde el correo con el que entras a Pipa Clara. Borramos tu cuenta y todo lo que guardaste:
          cisterna, pipas, lecturas, fotos, pagos, desacuerdos y registro de acciones. Te avisamos
          por correo cuando esté hecho.
        </p>
      </section>
    </div>
  );
}
