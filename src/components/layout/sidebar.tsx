"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { logoutAction } from "@/actions/auth";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/dashboard", key: "nav.dashboard" },
  { href: "/receipts", key: "nav.receipts" },
  { href: "/donors", key: "nav.donors" },
  { href: "/expenses", key: "nav.expenses" },
  { href: "/pending", key: "nav.pending" },
  { href: "/reports", key: "nav.reports" },
  { href: "/volunteers", key: "nav.volunteers" },
  { href: "/settings", key: "nav.settings" },
  { href: "/subscription", key: "nav.subscription" },
];

export function Sidebar({
  mandalName,
  isSuperAdmin,
}: {
  mandalName: string;
  isSuperAdmin: boolean;
}) {
  const pathname = usePathname();
  const { t } = useT();

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-white md:flex">
      <div className="border-b border-border px-5 py-5">
        <p className="text-xs text-accent">॥ श्री गणेशाय नमः ॥</p>
        <p className="mt-1 text-lg font-bold leading-tight text-primary">{mandalName}</p>
        <p className="text-sm text-muted-foreground">{t("app.name")}</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "block rounded-2xl px-3 py-2.5 text-sm font-medium",
              pathname === link.href || pathname.startsWith(`${link.href}/`)
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted",
            )}
          >
            {t(link.key)}
          </Link>
        ))}
        {isSuperAdmin ? (
          <Link
            href="/admin"
            className={cn(
              "block rounded-2xl px-3 py-2.5 text-sm font-medium",
              pathname.startsWith("/admin") ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {t("nav.admin")}
          </Link>
        ) : null}
      </nav>
      <div className="space-y-3 border-t border-border p-4">
        <LanguageSwitcher />
        <form action={logoutAction}>
          <Button variant="outline" className="w-full" type="submit">
            {t("common.logout")}
          </Button>
        </form>
      </div>
    </aside>
  );
}
