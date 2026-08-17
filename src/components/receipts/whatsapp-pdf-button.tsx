"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ensureReceiptPdfAction } from "@/actions/receipts";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/provider";
import { buildWhatsAppShareUrl } from "@/lib/whatsapp";

type WhatsAppPdfButtonProps = {
  receiptId: string;
  receiptNumber: string;
  mobile: string;
  message: string;
  pdfUrl?: string | null;
};

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function canShareFiles(file: File) {
  try {
    return typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export function WhatsAppPdfButton({
  receiptId,
  receiptNumber,
  mobile,
  message,
}: WhatsAppPdfButtonProps) {
  const { t } = useT();
  const [pending, setPending] = useState(false);

  async function sharePdf() {
    setPending(true);
    try {
      const result = await ensureReceiptPdfAction(receiptId);
      if (!result.ok) {
        toast.error(t("errors.generic"));
        return;
      }

      const absolutePdfUrl = new URL(result.pdfUrl, window.location.origin).toString();
      const response = await fetch(absolutePdfUrl);
      if (!response.ok) {
        toast.error(t("errors.generic"));
        return;
      }

      const blob = await response.blob();
      const file = new File([blob], `${receiptNumber}.pdf`, { type: "application/pdf" });

      if (canShareFiles(file) && typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: receiptNumber,
            text: message,
            files: [file],
          });
          return;
        } catch (error) {
          if (isAbort(error)) return;
        }
      }

      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: receiptNumber,
            text: message,
            url: absolutePdfUrl,
          });
          return;
        } catch (error) {
          if (isAbort(error)) return;
        }
      }

      const chatUrl = buildWhatsAppShareUrl(mobile, `${message}\n\n${absolutePdfUrl}`);
      window.open(chatUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Button className="w-full" type="button" disabled={pending} onClick={sharePdf} variant="outline">
      {pending ? t("receipts.sharingPdf") : t("receipts.whatsapp")}
    </Button>
  );
}
