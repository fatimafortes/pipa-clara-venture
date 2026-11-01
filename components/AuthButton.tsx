import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const buttonClass =
  "rounded-xl bg-teal px-5 py-2.5 text-lg font-semibold text-white hover:bg-teal-dark sm:order-last";

// Header button: "Mi cisterna" with a session, "Entrar" without one
export async function AuthButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return (
    <Link href={data?.claims ? "/app" : "/login"} className={buttonClass}>
      {data?.claims ? "Mi cisterna" : "Entrar"}
    </Link>
  );
}

// Same size as the button, so the header doesn't jump while the session loads
export function AuthButtonPlaceholder() {
  return (
    <span aria-hidden="true" className={`${buttonClass} invisible`}>
      Mi cisterna
    </span>
  );
}
