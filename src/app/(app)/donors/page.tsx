import Link from "next/link";
import { requirePermission } from "@/lib/auth/tenant";
import { listDonors } from "@/services/receipt.service";
import { getMessages } from "@/i18n/get-messages";
import { getMessage } from "@/i18n/translate";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";

export default async function DonorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { session, mandal } = await requirePermission("donors", "view");
  const params = await searchParams;
  const data = await listDonors({
    mandalId: mandal.id,
    query: params.q,
    page: Number(params.page ?? 1),
    pageSize: 20,
  });
  const messages = await getMessages(session.language);
  const t = (path: string) => getMessage(messages, path);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("donors.title")}</h1>
      <form>
        <input name="q" defaultValue={params.q} placeholder={t("donors.searchPlaceholder")} className="h-12 w-full rounded-2xl border bg-white px-4" />
      </form>
      {data.items.length === 0 ? (
        <EmptyState title={t("donors.empty")} />
      ) : (
        data.items.map((donor) => (
          <Link key={donor.id} href={`/donors/${donor.id}`}>
            <Card className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{donor.fullName}</p>
                <p className="text-sm text-muted-foreground">{donor.mobile} {donor.area ? `· ${donor.area}` : ""}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{donor.totalFormatted}</p>
                <p className="text-xs text-muted-foreground">{donor.receiptCount} {t("donors.receiptCount")}</p>
              </div>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}
