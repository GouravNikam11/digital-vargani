import { requireSuperAdmin } from "@/lib/auth/tenant";
import { getAdminOverview, listAdminMandals } from "@/services/admin.service";
import { listPlans } from "@/services/subscription.service";
import { getMessages } from "@/i18n/get-messages";
import { getMessage } from "@/i18n/translate";
import { Card } from "@/components/ui/card";
import { adminActivateAction, adminChangePlanAction, adminExtendTrialAction, adminSuspendAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  const session = await requireSuperAdmin();
  const [overview, mandals, plans] = await Promise.all([
    getAdminOverview(),
    listAdminMandals(),
    listPlans(),
  ]);
  const messages = await getMessages(session.language);
  const t = (path: string) => getMessage(messages, path);

  const cards = [
    [t("admin.totalMandals"), overview.totalMandals],
    [t("admin.activeMandals"), overview.activeMandals],
    [t("admin.trialMandals"), overview.trialMandals],
    [t("admin.paidMandals"), overview.paidMandals],
    [t("admin.totalReceipts"), overview.totalReceipts],
    [t("admin.totalCollection"), overview.totalCollection],
    [t("admin.totalExpenses"), overview.totalExpenses],
    [t("admin.monthlyRevenue"), overview.monthlyRevenue],
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-8">
      <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={String(label)}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-xl font-bold text-primary">{value}</p>
          </Card>
        ))}
      </div>
      <div className="space-y-3">
        {mandals.map((mandal) => (
          <Card key={mandal.id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{mandal.name}</p>
                <p className="text-sm text-muted-foreground">
                  {mandal.plan} · {t(`status.${mandal.status}`)} · {mandal.receipts} {t("dashboard.totalReceipts")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={async () => { "use server"; await adminSuspendAction(mandal.id); }}>
                  <Button size="sm" variant="danger" type="submit">{t("admin.suspend")}</Button>
                </form>
                <form action={async () => { "use server"; await adminActivateAction(mandal.id); }}>
                  <Button size="sm" type="submit">{t("admin.activate")}</Button>
                </form>
                <form action={async () => { "use server"; await adminExtendTrialAction(mandal.id); }}>
                  <Button size="sm" variant="outline" type="submit">{t("admin.extendTrial")}</Button>
                </form>
              </div>
            </div>
            <form
              className="flex gap-2"
              action={async (formData) => {
                "use server";
                await adminChangePlanAction(mandal.id, String(formData.get("planId")));
              }}
            >
              <select name="planId" className="h-10 flex-1 rounded-xl border px-3">
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.nameMr}</option>
                ))}
              </select>
              <Button size="sm" type="submit">{t("admin.changePlan")}</Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
