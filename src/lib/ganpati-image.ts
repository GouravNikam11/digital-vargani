import path from "node:path";

export const DEFAULT_GANPATI_IMAGE = "/images/default-ganpati.png";

export function ganpatiImageUrl(ganpatiPhotoUrl?: string | null) {
  return ganpatiPhotoUrl || DEFAULT_GANPATI_IMAGE;
}

export function ganpatiImageForPdf(ganpatiPhotoUrl?: string | null) {
  if (!ganpatiPhotoUrl) {
    return path.join(process.cwd(), "public/images/default-ganpati.png");
  }
  if (ganpatiPhotoUrl.startsWith("/api/files/")) {
    const key = ganpatiPhotoUrl.replace(/^\/api\/files\//, "");
    return path.join(process.cwd(), "uploads", key);
  }
  if (ganpatiPhotoUrl.startsWith("/")) {
    return path.join(process.cwd(), "public", ganpatiPhotoUrl);
  }
  return ganpatiPhotoUrl;
}
