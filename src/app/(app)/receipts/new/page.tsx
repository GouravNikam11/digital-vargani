import { ReceiptForm } from "@/components/receipts/receipt-form";
import { requirePermission } from "@/lib/auth/tenant";
import { getMessages } from "@/i18n/get-messages";
import { getMessage } from "@/i18n/translate";

export default async function NewReceiptPage() {
  const { session } = await requirePermission("receipts", "create");
  const messages = await getMessages(session.language);
  const t = (path: string) => getMessage(messages, path);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("receipts.new")}</h1>
      <ReceiptForm messages={messages} locale={session.language} />
    </div>
  );
}
