"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "@/config/constants";
import { getMessage, type Messages } from "@/i18n/translate";

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  t: (path: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      messages,
      t: (path, vars) => getMessage(messages, path, vars),
    }),
    [locale, messages],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useT must be used within I18nProvider");
  }
  return context;
}
