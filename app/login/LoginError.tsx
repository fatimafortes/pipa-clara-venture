"use client";

import { useSearchParams } from "next/navigation";

export function LoginError() {
  const searchParams = useSearchParams();
  if (!searchParams.get("error")) return null;

  return (
    <p role="alert" className="rounded-xl border-2 border-amber bg-amber-soft p-4 text-amber">
      No se pudo entrar. Intenta otra vez.
    </p>
  );
}
