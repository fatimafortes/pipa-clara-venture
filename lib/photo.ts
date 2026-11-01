// Shrinks a phone photo before upload (browser only). Redrawing it on a canvas
// also drops the EXIF data, including the GPS location phones embed in photos.
export async function compressPhoto(file: File, maxSide = 1600, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file); // applies the photo's rotation
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not compress photo"))),
      "image/jpeg",
      quality,
    ),
  );
}

// Every photo lives in the organizer's own folder with a random name: <user id>/<uuid>.jpg
export function isOwnPhotoPath(path: string, userId: string): boolean {
  return new RegExp(`^${userId}/[0-9a-f-]{36}\\.jpg$`).test(path);
}
