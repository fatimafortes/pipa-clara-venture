"use client";

import { useEffect } from "react";

// "Ver pagos" / "Mandar resumen" on /app link to #pagos / #resumen. The verdict streams in
// behind Suspense, so the browser's own jump can happen before that part exists; this
// mounts with it and scrolls once it's there.
export function ScrollToHash() {
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    // After the router's own scroll handling for this navigation
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, []);
  return null;
}
