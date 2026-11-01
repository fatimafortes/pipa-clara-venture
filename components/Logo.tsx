// Water-drop mark used in the header and as the favicon (app/icon.svg)
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path
        d="M16 2C16 2 5 14.5 5 21a11 11 0 0 0 22 0C27 14.5 16 2 16 2Z"
        fill="#12707a"
      />
      <path
        d="M11 21.5a5 5 0 0 0 5 5"
        stroke="#e2f0f1"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
