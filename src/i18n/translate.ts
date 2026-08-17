import type { Locale } from "@/config/constants";
import { DEFAULT_LOCALE } from "@/config/constants";

export type Messages = Record<string, unknown>;

export function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

export function getMessage(
  messages: Messages,
  path: string,
  vars?: Record<string, string | number>,
): string {
  const parts = path.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (typeof current !== "object" || current === null || !(part in current)) {
      return path;
    }
    current = (current as Record<string, unknown>)[part];
  }

  if (typeof current !== "string") {
    return path;
  }

  return interpolate(current, vars);
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "mr" || value === "en";
}

export function resolveLocale(value?: string | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
