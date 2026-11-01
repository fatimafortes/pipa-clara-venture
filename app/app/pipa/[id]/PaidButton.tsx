"use client";

import { useFormStatus } from "react-dom";

// Without feedback, a tap that is still saving looks like a tap that failed,
// and she taps again (the logs showed one share marked "paid" 9 times in a row)
export function PaidButton({ label, paid }: { label: string; paid: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`${label}: ${paid ? "pagado, tocar para marcar pendiente" : "pendiente, tocar para marcar pagado"}`}
      className={`min-w-32 rounded-full px-4 py-2 text-lg font-semibold disabled:opacity-60 ${
        paid ? "bg-teal text-white" : "border-2 border-amber bg-white text-amber"
      }`}
    >
      {pending ? "Guardando…" : paid ? "Pagado ✓" : "Pendiente"}
    </button>
  );
}
