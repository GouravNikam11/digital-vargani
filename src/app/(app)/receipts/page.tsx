import Link from "next/link";
import { requirePermission } from "@/lib/auth/tenant";
import { listReceipts } from "@/services/receipt.service";
import { getMessages } from "@/i18n/get-messages";
import { getMessage } from "@/i18n/translate";
import { EmptyState } from "@/components/ui/empty";
import { Badge, Card } from "@/components/ui/card";

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { session, mandal, role } = await requirePermission("receipts", "view");
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const data = await listReceipts({
    mandalId: mandal.id,
    query: params.q,
    page,
    pageSize: 20,
    createdById: role === "VOLUNTEER" ? session.userId : undefined,
  });
  const messages = await getMessages(session.language);
  const t = (path: string) => getMessage(messages, path);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("receipts.title")}</h1>
        <Link href="/receipts/new" className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          {t("receipts.new")}
        </Link>
      </div>
      <form>
        <input
          name="q"
          defaultValue={params.q}
          placeholder={t("receipts.searchPlaceholder")}
          className="h-12 w-full rounded-2xl border border-border bg-white px-4"
        />
      </form>
      {data.items.length === 0 ? (
        <EmptyState
          title={t("receipts.empty")}
          hint={t("receipts.emptyHint")}
          action={
            <Link href="/receipts/new" className="rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground">
              {t("receipts.emptyCta")}
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {data.items.map((receipt) => (
            <Link key={receipt.id} href={`/receipts/${receipt.id}`}>
              <Card className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{receipt.donorName}</p>
                  <p className="text-sm text-muted-foreground">
                    {receipt.receiptNumber} · {receipt.mobile}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{receipt.amountFormatted}</p>
                  <Badge tone={receipt.status === "CANCELLED" ? "danger" : "success"}>
                    {t(`status.${receipt.status}`)}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
