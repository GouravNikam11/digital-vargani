"use client";

import { useTransition } from "react";
import { setLanguageAction } from "@/actions/auth";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, t } = useT();
  const [pending, start] = useTransition();

  return (
    <div className="inline-flex rounded-full border border-border bg-white p-1 text-sm">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => setLanguageAction("mr"))}
        className={cn(
          "rounded-full px-3 py-1.5",
          locale === "mr" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
        )}
      >
        {t("common.marathi")}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => setLanguageAction("en"))}
        className={cn(
          "rounded-full px-3 py-1.5",
          locale === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
        )}
      >
        {t("common.english")}
      </button>
    </div>
  );
}
