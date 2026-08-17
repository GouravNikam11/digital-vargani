"use client";

import { useT } from "@/i18n/provider";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useT();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="whitespace-pre-line text-lg font-semibold">{t("errors.generic")}</p>
      <Button className="mt-6" onClick={reset} type="button">
        {t("common.retry")}
      </Button>
    </div>
  );
}
