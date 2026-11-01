import type { Metadata } from "next";
import { Suspense } from "react";
import { GoogleButton } from "./GoogleButton";
import { LoginError } from "./LoginError";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <div className="space-y-5 rounded-2xl border border-line bg-white p-6">
      <h1 className="text-3xl font-bold">Entrar</h1>
      <p className="text-lg leading-relaxed text-muted">
        Entra con tu cuenta de Google para registrar tu cisterna y tus pipas. Solo tú ves tus
        datos.
      </p>
      {/* Reads ?error from the URL, so it renders at request time */}
      <Suspense>
        <LoginError />
      </Suspense>
      <GoogleButton />
    </div>
  );
}
