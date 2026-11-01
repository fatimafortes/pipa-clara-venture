"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleButton() {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    // Return to the same site she started on (localhost, Vercel URL or the real domain)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={loading}
      className="w-full rounded-xl bg-teal px-6 py-4 text-lg font-semibold text-white hover:bg-teal-dark disabled:opacity-60"
    >
      {loading ? "Abriendo Google…" : "Entrar con Google"}
    </button>
  );
}
