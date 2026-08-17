export function slugify(value: string) {
  const latin = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (latin.length >= 3) {
    return latin.slice(0, 60);
  }

  const compact = value.replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]+/gu, "");
  const fallback = compact || `mandal-${Date.now()}`;
  return fallback.slice(0, 60).toLowerCase();
}
