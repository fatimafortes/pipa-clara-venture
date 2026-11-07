// Supabase Auth and its database API can disagree on the clock by about a second.
// Right after a Google sign-in, the brand-new session token can look "issued in the
// future" and the API answers PGRST303 (Week 12, first screen after sign-in).
// Waiting a moment and asking again fixes it, so a query is retried once, never more.

export const FUTURE_TOKEN = "PGRST303";

type QueryResult = { error: { code?: string } | null };

// `run` builds and sends the query, so the retry is a fresh request, not the same promise
export async function retryOnFutureToken<T extends QueryResult>(
  name: string,
  run: () => PromiseLike<T>,
  waitMs = 1000,
): Promise<T> {
  const first = await run();
  if (first.error?.code !== FUTURE_TOKEN) return first;

  await new Promise((resolve) => setTimeout(resolve, waitMs));
  const second = await run();
  if (second.error) console.error(`[retry ${FUTURE_TOKEN}] ${name} failed:`, second.error.code);
  else console.info(`[retry ${FUTURE_TOKEN}] ${name} ok`);
  return second;
}
