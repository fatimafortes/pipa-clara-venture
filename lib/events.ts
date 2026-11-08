import "server-only";
import { after } from "next/server";
import { createClient } from "./supabase/server";
import { TABLES } from "./supabase/names";
import { retryOnFutureToken } from "./supabase/retry";

// Same fixed list as the CHECK constraint on pc_events
export type EventName =
  | "signed_in"
  | "cistern_created"
  | "delivery_saved"
  | "verdict_viewed"
  | "summary_sent"
  | "challenge_saved";

// Records one action in pc_events: only the name, the delivery and the time
// (no free text, no IP, no device data). The insert runs after the response is sent,
// so it never slows down or breaks what the organizer did; a failure is only logged.
// Call it during the request (page, Server Action or Route Handler), never inside after().
export async function logEvent(name: EventName, deliveryId: string | null = null) {
  try {
    // Read the session cookies now: pages can't read them once the response is sent
    const supabase = await createClient();
    after(async () => {
      try {
        // signed_in runs a moment after Google sign-in, exactly when PGRST303 can happen
        const { data, error } = await retryOnFutureToken(`logEvent ${name}`, () =>
          supabase.from(TABLES.events).insert({ name, delivery_id: deliveryId }).select("id").single(),
        );
        if (error || !data) console.error("[logEvent] insert failed:", name, error?.code, error?.message);
        else console.info("[logEvent]", name, data.id);
      } catch (error) {
        console.error("[logEvent] insert threw:", name, error);
      }
    });
  } catch (error) {
    console.error("[logEvent] not scheduled:", name, error);
  }
}
