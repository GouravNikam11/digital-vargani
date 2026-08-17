import Link from "next/link";
import { requireMandalContext } from "@/lib/auth/tenant";
import { getDashboardData } from "@/services/dashboard.service";
import { getMessages } from "@/i18n/get-messages";
import { getMessage } from "@/i18n/translate";
import { Card } from "@/components/ui/card";
import { BreakdownChart, CollectionChart } from "@/components/charts";

export default async function DashboardPage() {
  const { session, mandal, role } = await requireMandalContext();
  const data = await getDashboardData(mandal.id, role);
  const messages = await getMessages(session.language);
  const t = (path: string, vars?: Record<string, string | number>) => getMessage(messages, path, vars);

  const cards = data
    ? [
        [t("dashboard.totalCollection"), data.totals.collection],
        [t("dashboard.totalExpense"), data.showFinance ? data.totals.expenses : "—"],
        [t("dashboard.balance"), data.showFinance ? data.totals.balance : "—"],
        [t("dashboard.totalReceipts"), String(data.receiptCount)],
        [t("dashboard.todayCollection"), data.today.collection],
        [t("dashboard.todayExpense"), data.showFinance ? data.today.expenses : "—"],
        [t("dashboard.pendingVargani"), String(data.pendingCount)],
        [t("dashboard.activeVolunteers"), String(data.volunteerCount)],
      ]
    : [];

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-bold text-primary">{t("dashboard.greeting", { name: session.mandalName ?? session.name })}</h1>
        <p className="text-muted-foreground">
          {t("dashboard.festival", { year: data?.festival.year ?? mandal.ganpatiYear })}
        </p>
      </section>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-xl font-bold text-primary">{value}</p>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["/receipts/new", t("dashboard.quickReceipt")],
          ["/expenses", t("dashboard.quickExpense")],
          ["/donors", t("dashboard.quickDonors")],
          ["/reports", t("dashboard.quickReports")],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="rounded-2xl bg-primary px-3 py-3 text-center text-sm font-semibold text-primary-foreground">
            {label}
          </Link>
        ))}
      </div>
      {data?.showFinance ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="mb-3 font-semibold">{t("dashboard.dailyCollection")}</h2>
            <CollectionChart data={data.daily} />
          </Card>
          <Card>
            <h2 className="mb-3 font-semibold">{t("dashboard.paymentBreakdown")}</h2>
            <BreakdownChart
              data={data.paymentBreakdown.map((row) => ({ name: t(`paymentMethods.${row.method}`), value: row.value }))}
            />
          </Card>
          <Card>
            <h2 className="mb-3 font-semibold">{t("dashboard.expenseBreakdown")}</h2>
            <BreakdownChart
              data={data.expenseBreakdown.map((row) => ({
                name: session.language === "en" ? row.nameEn : row.nameMr,
                value: row.value,
              }))}
            />
          </Card>
        </div>
      ) : null}
    </div>
  );
}
