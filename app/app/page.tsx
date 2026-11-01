import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Entrar",
};

// Placeholder so "Entrar" never leads to a 404; replaced by Google sign-in in F2
export default function AppPage() {
  return (
    <div className="space-y-5 rounded-2xl border border-line bg-white p-6 text-center">
      <h1 className="text-3xl font-bold">Muy pronto</h1>
      <p className="text-lg leading-relaxed text-muted">
        Aquí vas a entrar con tu cuenta de Google para registrar tu cisterna y tus pipas.
      </p>
      <Link
        href="/product"
        className="inline-block rounded-xl bg-teal px-6 py-4 text-lg font-semibold text-white hover:bg-teal-dark"
      >
        Ver cómo funciona
      </Link>
    </div>
  );
}
