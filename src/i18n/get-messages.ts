import { cookies } from "next/headers";
import { DEFAULT_LOCALE, type Locale } from "@/config/constants";
import { LANGUAGE_COOKIE } from "@/lib/auth/session";
import { resolveLocale, type Messages } from "@/i18n/translate";

import mr from "../../messages/mr.json";
import en from "../../messages/en.json";

const dictionaries: Record<Locale, Messages> = {
  mr: mr as Messages,
  en: en as Messages,
};

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  return resolveLocale(jar.get(LANGUAGE_COOKIE)?.value ?? DEFAULT_LOCALE);
}

export async function getMessages(locale?: Locale): Promise<Messages> {
  const resolved = locale ?? (await getLocale());
  return dictionaries[resolved];
}

export function getMessagesSync(locale: Locale): Messages {
  return dictionaries[locale];
}
