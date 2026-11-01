import { createBrowserClient } from "@supabase/ssr";

// Supabase client for Client Components (runs in the browser).
// Only the public URL and publishable/anon key: never the service-role key.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
