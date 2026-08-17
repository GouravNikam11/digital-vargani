import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

export type StoredFile = {
  key: string;
  url: string;
  contentType: string;
  size: number;
};

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function validateUpload(file: { type: string; size: number }) {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("INVALID_FILE_TYPE");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }
}

function localRoot() {
  return path.join(/* turbopackIgnore: true */ process.cwd(), "uploads");
}

export async function putFile(key: string, data: Buffer, contentType: string): Promise<StoredFile> {
  validateUpload({ type: contentType, size: data.byteLength });
  const driver = process.env.STORAGE_DRIVER || "local";

  if (driver === "s3") {
    throw new Error("S3 storage is configured but not connected yet");
  }

  const fullPath = path.join(localRoot(), key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, data);

  return {
    key,
    url: `/api/files/${key}`,
    contentType,
    size: data.byteLength,
  };
}

export async function deleteFile(key: string) {
  const fullPath = path.join(localRoot(), key);
  await unlink(fullPath).catch(() => undefined);
}
