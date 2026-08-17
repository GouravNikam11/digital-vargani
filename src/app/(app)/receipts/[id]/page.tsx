import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/tenant";
import { getReceiptForMandal } from "@/services/receipt.service";
import { getMessages } from "@/i18n/get-messages";
import { getMessage } from "@/i18n/translate";
import { formatINR } from "@/lib/money";
import { WhatsAppPdfButton } from "@/components/receipts/whatsapp-pdf-button";
import { ReceiptPavti } from "@/components/receipts/receipt-pavti";
import { cancelReceiptAction } from "@/actions/receipts";

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { session, mandal, role } = await requirePermission("receipts", "view");
  const { id } = await params;
  const receipt = await getReceiptForMandal(mandal.id, id).catch(() => null);
  if (!receipt) notFound();
  const messages = await getMessages(session.language);
  const t = (path: string, vars?: Record<string, string | number>) => getMessage(messages, path, vars);
  const message = t("whatsapp.message", {
    amount: formatINR(receipt.amount.toString()),
    receiptNumber: receipt.receiptNumber,
  });

  return (
    <div className="space-y-4">
      <ReceiptPavti
        receipt={{
          mandalName: receipt.mandal.name,
          address: receipt.mandal.address,
          city: receipt.mandal.city,
          festivalName: receipt.festival.name,
          year: receipt.festival.year,
          ganpatiPhotoUrl: receipt.mandal.ganpatiPhotoUrl,
          receiptNumber: receipt.receiptNumber,
          receiptDate: receipt.receiptDate,
          donorName: receipt.donor.fullName,
          mobile: receipt.donor.mobile,
          amount: receipt.amount.toString(),
          amountInWords: receipt.amountInWordsMr,
          paymentMethodLabel: t(`paymentMethods.${receipt.paymentMethod}`),
          collectedBy: receipt.createdBy.name,
          status: receipt.status,
          statusLabel: t(`status.${receipt.status}`),
          thanks: t("receipts.thanks"),
        }}
      />
      <div className="grid gap-3">
        {receipt.pdfUrl ? (
          <a className="rounded-2xl bg-primary px-4 py-3 text-center font-semibold text-primary-foreground" href={receipt.pdfUrl}>
            {t("common.download")}
          </a>
        ) : null}
        <WhatsAppPdfButton
          receiptId={receipt.id}
          receiptNumber={receipt.receiptNumber}
          mobile={receipt.donor.mobile}
          message={message}
          pdfUrl={receipt.pdfUrl}
        />
        {role !== "VOLUNTEER" && receipt.status === "ACTIVE" ? (
          <form
            action={async () => {
              "use server";
              await cancelReceiptAction(receipt.id, "Cancelled by mandal");
            }}
          >
            <button className="w-full rounded-2xl border border-danger px-4 py-3 font-semibold text-danger" type="submit">
              {t("receipts.cancelReceipt")}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
