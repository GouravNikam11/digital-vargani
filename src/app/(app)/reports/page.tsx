import { requirePermission } from "@/lib/auth/tenant";
import { getFestivalSummary, getReceiptRegister, mapReceiptsToRows } from "@/services/report.service";
import { getVolunteerCollection } from "@/services/finance.service";
import { getMessages } from "@/i18n/get-messages";
import { getMessage } from "@/i18n/translate";
import { Card } from "@/components/ui/card";
import { getActiveFestival } from "@/services/finance.service";

export default async function ReportsPage() {
  const { session, mandal } = await requirePermission("reports", "financial");
  const summary = await getFestivalSummary(mandal.id);
  const festival = await getActiveFestival(mandal.id);
  const register = festival
    ? await getReceiptRegister(mandal.id)
    : [];
  const volunteers = festival
    ? await getVolunteerCollection({ mandalId: mandal.id, festivalId: festival.id })
    : [];
  const messages = await getMessages(session.language);
  const t = (path: string, vars?: Record<string, string | number>) => getMessage(messages, path, vars);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t("reports.title")}</h1>
      {summary ? (
        <Card>
          <h2 className="text-xl font-bold">{t("reports.summaryTitle", { year: summary.festival.year })}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label={t("dashboard.totalCollection")} value={summary.totals.collectionFormatted} />
            <Stat label={t("dashboard.totalExpense")} value={summary.totals.expensesFormatted} />
            <Stat label={t("dashboard.balance")} value={summary.totals.balanceFormatted} />
            <Stat label={t("reports.totalDonors")} value={String(summary.donorCount)} />
            <Stat label={t("dashboard.totalReceipts")} value={String(summary.totals.receiptCount)} />
          </div>
          <div className="mt-4 space-y-2">
            {summary.payments.map((row) => (
              <div key={row.method} className="flex justify-between text-sm">
                <span>{t(`paymentMethods.${row.method}`)}</span>
                <span className="font-semibold">{row.formatted}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
      <Card>
        <h2 className="mb-3 font-semibold">{t("reports.volunteer")}</h2>
        <div className="space-y-2">
          {volunteers.map((row) => (
            <div key={row.userId} className="flex justify-between text-sm">
              <span>{row.name} · {row.receiptCount}</span>
              <span className="font-semibold">{row.formatted}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">{t("reports.expense")}</h2>
        {summary?.expenses.map((row) => (
          <div key={row.categoryId} className="flex justify-between text-sm">
            <span>{session.language === "en" ? row.nameEn : row.nameMr}</span>
            <span className="font-semibold">{row.formatted}</span>
          </div>
        ))}
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">{t("reports.register")}</h2>
        <p className="text-sm text-muted-foreground">{mapReceiptsToRows(register).length} {t("dashboard.totalReceipts")}</p>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-bold text-primary">{value}</p>
    </div>
  );
}
