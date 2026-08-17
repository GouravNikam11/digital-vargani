import { getPublicReceipt } from "@/services/receipt.service";
import { notFound } from "next/navigation";
import { getMessages, getLocale } from "@/i18n/get-messages";
import { getMessage } from "@/i18n/translate";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";

export default async function PublicReceiptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const receipt = await getPublicReceipt(token).catch(() => null);
  if (!receipt) notFound();
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = (path: string) => getMessage(messages, path);

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-10">
      <Card className="space-y-3 text-center">
        <p className="text-sm text-accent">॥ श्री गणेशाय नमः ॥</p>
        <h1 className="text-2xl font-bold text-primary">{receipt.mandalName}</h1>
        <p>{t("public.verifyTitle")}</p>
        <p className="font-semibold">{receipt.receiptNumber}</p>
        <p>{receipt.amount}</p>
        <p className="text-sm">{t(`paymentMethods.${receipt.paymentMethod}`)}</p>
        <Badge tone={receipt.status === "CANCELLED" ? "danger" : "success"}>
          {t(`status.${receipt.status}`)}
        </Badge>
        {receipt.status === "CANCELLED" ? (
          <p className="text-danger">{t("public.cancelledNotice")}</p>
        ) : (
          <>
            <p className="font-semibold text-success">{t("public.authentic")}</p>
            <p className="text-sm text-muted-foreground">{t("public.authenticEn")}</p>
          </>
        )}
      </Card>
    </div>
  );
}
