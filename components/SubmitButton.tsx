"use client";

import { useFormStatus } from "react-dom";

// A button that says "Guardando…" while its form is saving, so she doesn't tap twice
export function SubmitButton({ children, className }: { children: React.ReactNode; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-60`}>
      {pending ? "Guardando…" : children}
    </button>
  );
}
