"use client";

import { useState } from "react";
import { compressPhoto } from "@/lib/photo";
import { createClient } from "@/lib/supabase/client";
import { PHOTO_BUCKET } from "@/lib/supabase/names";
import { validatePhoto } from "@/lib/validation";

type Status =
  | { state: "empty" }
  | { state: "uploading" }
  | { state: "done"; path: string; previewUrl: string; time: string }
  | { state: "error"; message: string };

// Uploads the photo the moment it is taken, so each reading keeps its own time.
// The time stored as evidence is the one Supabase records on arrival, not the phone's.
export function PhotoField({
  name,
  label,
  userId,
  onUploadingChange,
}: {
  name: string;
  label: string;
  userId: string;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const [status, setStatus] = useState<Status>({ state: "empty" });

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const problem = validatePhoto(file);
    if (problem) {
      setStatus({ state: "error", message: problem });
      return;
    }

    setStatus({ state: "uploading" });
    onUploadingChange(true);
    try {
      const blob = await compressPhoto(file);
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error } = await createClient()
        .storage.from(PHOTO_BUCKET)
        .upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      setStatus({
        state: "done",
        path,
        previewUrl: URL.createObjectURL(blob),
        time: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
      });
    } catch (error) {
      console.error("[PhotoField] upload failed", error);
      setStatus({ state: "error", message: "No se pudo subir la foto. Revisa tu conexión e intenta otra vez." });
    } finally {
      onUploadingChange(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-lg font-semibold">{label}</span>
      <input type="hidden" name={name} value={status.state === "done" ? status.path : ""} />

      {status.state === "done" ? (
        <div className="flex items-center gap-3 rounded-xl border-2 border-teal bg-teal-soft p-3">
          {/* Local preview of the compressed photo, not a remote image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={status.previewUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
          <span className="text-lg font-semibold text-teal">Foto guardada · {status.time}</span>
        </div>
      ) : (
        <label
          className={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-lg font-semibold ${
            status.state === "uploading" ? "border-line text-muted" : "border-teal text-teal"
          }`}
        >
          {status.state === "uploading" ? "Subiendo foto…" : "Tomar foto"}
          <input
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
            className="sr-only"
            disabled={status.state === "uploading"}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      )}

      {status.state === "error" && <p className="text-base font-medium text-amber">{status.message}</p>}
    </div>
  );
}
