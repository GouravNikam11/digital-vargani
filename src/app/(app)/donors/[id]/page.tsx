import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/tenant";
import { getDonorProfile } from "@/services/receipt.service";
import { getMessages } from "@/i18n/get-messages";
import { getMessage } from "@/i18n/translate";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/money";

export default async function DonorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { session, mandal } = await requirePermission("donors", "view");
  const { id } = await params;
  const donor = await getDonorProfile(mandal.id, id).catch(() => null);
  if (!donor) notFound();
  const messages = await getMessages(session.language);
  const t = (path: string) => getMessage(messages, path);

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-bold">श्री. {donor.fullName}</h1>
        <p className="text-muted-foreground">{donor.mobile}</p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">{t("donors.totalContribution")}</p>
            <p className="font-bold text-primary">{donor.totalFormatted}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("donors.receiptCount")}</p>
            <p className="font-bold">{donor.receiptCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("donors.lastContribution")}</p>
            <p className="font-bold">{donor.lastContribution ?? "—"}</p>
          </div>
        </div>
      </Card>
      <h2 className="font-semibold">{t("donors.history")}</h2>
      {donor.receipts.map((receipt) => (
        <Card key={receipt.id} className="flex justify-between">
          <div>
            <p className="font-medium">{receipt.receiptNumber}</p>
            <p className="text-xs text-muted-foreground">{receipt.receiptDate.toISOString().slice(0, 10)}</p>
          </div>
          <p className="font-bold text-primary">{formatINR(receipt.amount.toString())}</p>
        </Card>
      ))}
    </div>
  );
}
