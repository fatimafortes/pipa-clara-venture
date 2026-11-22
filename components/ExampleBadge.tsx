// Amber, as in docs/BRAND.md (labels like DATOS DE EJEMPLO). Every screen that shows invented numbers must carry this label (PACKET §6, §11.5)
export function ExampleBadge({ label = "DATOS DE EJEMPLO" }: { label?: string }) {
  return (
    <span className="inline-block rounded-full bg-amber-soft px-3 py-1 text-sm font-semibold tracking-wide text-amber">
      {label}
    </span>
  );
}
