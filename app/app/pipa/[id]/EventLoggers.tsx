"use client";

import { useEffect, useRef } from "react";
import { logDeliveryEvent } from "../actions";

// verdict_viewed once per opening of the page. Logged from the browser, not the server
// render, because a payment tap re-renders the page (refresh()) and that isn't a new view.
export function LogVerdictViewed({ deliveryId }: { deliveryId: string }) {
  const logged = useRef(false);
  useEffect(() => {
    // React's dev mode runs effects twice; the ref keeps it to one row
    if (logged.current) return;
    logged.current = true;
    void logDeliveryEvent("verdict_viewed", deliveryId);
  }, [deliveryId]);
  return null;
}

// A plain link, so WhatsApp opens right away. The log call starts on the same tap
// without waiting: phones block a link that opens only after a server answer.
export function SummaryButton({ href, deliveryId }: { href: string; deliveryId: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => void logDeliveryEvent("summary_sent", deliveryId)}
      className="block w-full rounded-xl bg-whatsapp px-6 py-4 text-center text-lg font-semibold text-white"
    >
      Mandar resumen por WhatsApp
    </a>
  );
}
