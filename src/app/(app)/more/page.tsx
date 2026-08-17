import Link from "next/link";
import { requireMandalContext } from "@/lib/auth/tenant";
import { getMessages } from "@/i18n/get-messages";
import { getMessage } from "@/i18n/translate";
import { can } from "@/lib/permissions";
import { logoutAction } from "@/actions/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";

export default async function MorePage() {
  const { session, role } = await requireMandalContext();
  const messages = await getMessages(session.language);
  const t = (path: string) => getMessage(messages, path);

  const links = [
    { href: "/pending", key: "nav.pending", show: can(role, "pending", "view") },
    { href: "/reports", key: "nav.reports", show: can(role, "reports", "financial") },
    { href: "/volunteers", key: "nav.volunteers", show: can(role, "members", "view") },
    { href: "/settings", key: "nav.settings", show: can(role, "branding", "manage") },
    { href: "/subscription", key: "nav.subscription", show: can(role, "subscription", "view") },
  ].filter((item) => item.show);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("nav.more")}</h1>
      <LanguageSwitcher />
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="block rounded-2xl border bg-white px-4 py-4 font-medium">
          {t(link.key)}
        </Link>
      ))}
      {session.isSuperAdmin ? (
        <Link href="/admin" className="block rounded-2xl border bg-white px-4 py-4 font-medium">
          {t("nav.admin")}
        </Link>
      ) : null}
      <form action={logoutAction}>
        <Button variant="outline" className="w-full" type="submit">{t("common.logout")}</Button>
      </form>
    </div>
  );
}
