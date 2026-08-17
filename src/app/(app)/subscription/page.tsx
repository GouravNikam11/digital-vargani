import { requirePermission } from "@/lib/auth/tenant";
import { getMandalSubscription, listPlans } from "@/services/subscription.service";
import { getMessages } from "@/i18n/get-messages";
import { getMessage } from "@/i18n/translate";
import { formatINR } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { choosePlanAction } from "@/actions/mandal";
import { Button } from "@/components/ui/button";

export default async function SubscriptionPage() {
  const { session, mandal } = await requirePermission("subscription", "view");
  const [{ subscription, usageCount, remaining }, plans] = await Promise.all([
    getMandalSubscription(mandal.id),
    listPlans(),
  ]);
  const messages = await getMessages(session.language);
  const t = (path: string) => getMessage(messages, path);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t("subscription.title")}</h1>
      <Card>
        <p className="text-sm text-muted-foreground">{t("subscription.current")}</p>
        <p className="text-xl font-bold">{session.language === "en" ? subscription.plan.nameEn : subscription.plan.nameMr}</p>
        <p className="mt-2">{t("subscription.receiptsUsed")}: {usageCount}
          {subscription.plan.receiptLimit ? ` / ${subscription.plan.receiptLimit}` : " / ∞"}
        </p>
        {remaining !== null ? <p className="text-sm text-muted-foreground">{remaining}</p> : null}
      </Card>
      <h2 className="font-semibold">{t("subscription.choosePlan")}</h2>
      {plans.map((plan) => (
        <Card key={plan.id} className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{session.language === "en" ? plan.nameEn : plan.nameMr}</p>
            <p className="text-primary font-bold">
              {formatINR(plan.price.toString())}
              <span className="text-sm font-medium text-muted-foreground">{t("subscription.perFestival")}</span>
            </p>
          </div>
          <form action={async () => { "use server"; await choosePlanAction(plan.id); }}>
            <Button type="submit" variant={plan.id === subscription.planId ? "secondary" : "default"}>
              {plan.id === subscription.planId ? t("common.done") : t("receipts.upgrade")}
            </Button>
          </form>
        </Card>
      ))}
    </div>
  );
}
