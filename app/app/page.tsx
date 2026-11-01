import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: "Mi cisterna",
};

export default function AppPage() {
  return (
    // Reading the session cookie must happen behind Suspense (Next 16 cacheComponents)
    <Suspense fallback={<p className="text-lg text-muted">Cargando…</p>}>
      <OrganizerHome />
    </Suspense>
  );
}

async function OrganizerHome() {
  const supabase = await createClient();
  // getUser() asks Supabase to validate the session; proxy.ts alone is not enough
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-5 rounded-2xl border border-line bg-white p-6">
      <h1 className="text-3xl font-bold">Hola</h1>
      <p className="text-lg leading-relaxed text-muted">
        Entraste como <strong className="text-ink">{user.email}</strong>. Aquí vas a registrar tu
        cisterna y tus pipas.
      </p>
      <form action={signOut}>
        <button
          type="submit"
          className="w-full rounded-xl border-2 border-teal bg-white px-6 py-4 text-lg font-semibold text-teal"
        >
          Salir
        </button>
      </form>
    </div>
  );
}
