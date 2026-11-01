import type { InputHTMLAttributes } from "react";

// Large labeled input for a 55-year-old user on a phone, with its error under it
export function Field({
  label,
  hint,
  error,
  ...input
}: { label: string; hint?: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const errorId = error ? `${input.name}-error` : undefined;
  return (
    <label className="block space-y-1">
      <span className="text-lg font-semibold">{label}</span>
      {hint && <span className="block text-base text-muted">{hint}</span>}
      <input
        {...input}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={`block w-full rounded-xl border-2 bg-white px-4 py-3 text-xl ${
          error ? "border-amber" : "border-line focus:border-teal"
        } outline-none`}
      />
      {error && (
        <span id={errorId} className="block text-base font-medium text-amber">
          {error}
        </span>
      )}
    </label>
  );
}

export function Checkbox({ label, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-start gap-3 rounded-xl border-2 border-line bg-white p-4 text-lg">
      <input type="checkbox" {...input} className="mt-1 h-6 w-6 shrink-0 accent-teal" />
      <span>{label}</span>
    </label>
  );
}

// Shown right above the submit button: on a phone, a message at the top of a long
// form is off-screen, and a failed save looks like nothing happened
export function SubmitErrors({ errors }: { errors: Record<string, string> }) {
  const count = Object.keys(errors).length;
  if (count === 0) return null;
  return (
    <p role="alert" className="rounded-xl border-2 border-amber bg-amber-soft p-4 text-lg font-medium text-amber">
      {errors.form ?? (count === 1 ? "Revisa el dato marcado arriba." : `Revisa los ${count} datos marcados arriba.`)}
    </p>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border-2 border-amber bg-amber-soft p-4 text-lg text-amber">
      {message}
    </p>
  );
}
