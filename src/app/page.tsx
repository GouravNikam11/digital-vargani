import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getMessages, getLocale } from "@/i18n/get-messages";
import { getMessage } from "@/i18n/translate";
import { listPlans } from "@/services/subscription.service";
import { formatINR } from "@/lib/money";
import { getSession } from "@/lib/auth/tenant";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await getSession();
  if (session?.mandalId) redirect("/dashboard");
  if (session && !session.mandalId) redirect("/onboarding");

  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = (path: string, vars?: Record<string, string | number>) => getMessage(messages, path, vars);
  let plans: Awaited<ReturnType<typeof listPlans>> = [];
  try {
    plans = await listPlans();
  } catch {
    plans = [];
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#fffdf8_45%,_#f5e6c8)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div>
          <p className="text-xs text-accent">॥ श्री गणेशाय नमः ॥</p>
          <p className="text-xl font-bold text-primary">{t("app.name")}</p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/login" className="rounded-2xl px-4 py-2 text-sm font-semibold text-primary">
            {t("landing.login")}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16">
        <section className="grid gap-10 py-10 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-primary md:text-5xl">{t("app.tagline")}</h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              गणपती मंडळांसाठी वर्गणी, पावती, खर्च आणि हिशोब — एका मोबाईल अॅपमध्ये.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground"
            >
              {t("landing.heroCta")}
            </Link>
          </div>
          <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">नमस्कार, श्री गणेश मित्र मंडळ 🙏</p>
            <p className="mt-1 font-medium">गणपती उत्सव २०२६</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                [t("dashboard.totalCollection"), "₹4,52,500"],
                [t("dashboard.totalExpense"), "₹2,87,300"],
                [t("dashboard.balance"), "₹1,65,200"],
                [t("dashboard.totalReceipts"), "425"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-secondary p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-xl font-bold text-primary">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section>
          <h2 className="mb-4 text-2xl font-bold">{t("landing.featuresTitle")}</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[t("landing.receipts"), t("landing.accounts"), t("landing.whatsapp"), t("landing.reports")].map((item) => (
              <div key={item} className="rounded-3xl border border-border bg-white p-5 font-medium">
                {item}
              </div>
            ))}
          </div>
        </section>
        {plans.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-4 text-2xl font-bold">{t("landing.pricingTitle")}</h2>
            <div className="grid gap-4 md:grid-cols-5">
              {plans.map((plan) => (
                <div key={plan.id} className="rounded-3xl border border-border bg-white p-5">
                  <p className="font-bold">{locale === "mr" ? plan.nameMr : plan.nameEn}</p>
                  <p className="mt-2 text-2xl font-bold text-primary">
                    {Number(plan.price) === 0 ? "Free" : formatINR(plan.price.toString())}
                    <span className="text-sm font-medium text-muted-foreground">{t("subscription.perFestival")}</span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {plan.receiptLimit ? `${plan.receiptLimit} ${t("dashboard.totalReceipts")}` : "Unlimited"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
