"use client";

import Link from "next/link";
import { useT } from "@/i18n/provider";
import { Button } from "@/components/ui/button";

export default function AppErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useT();
  const forbidden = error.message === "FORBIDDEN";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="whitespace-pre-line text-lg font-semibold">
        {forbidden ? t("errors.forbidden") : t("errors.generic")}
      </p>
      {forbidden ? (
        <Button className="mt-6" asChild>
          <Link href="/dashboard">{t("nav.home")}</Link>
        </Button>
      ) : (
        <Button className="mt-6" onClick={reset} type="button">
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}
