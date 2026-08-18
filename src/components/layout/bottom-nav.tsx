"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, Users, Wallet, Menu, ClipboardList } from "lucide-react";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { can, type MandalRole } from "@/lib/permissions";

export function BottomNav({ role }: { role: MandalRole | null }) {
  const pathname = usePathname();
  const { t } = useT();
  const accountsItem = can(role, "expenses", "view")
    ? { href: "/expenses", key: "nav.accounts", icon: Wallet }
    : { href: "/pending", key: "nav.pending", icon: ClipboardList };
  const items = [
    { href: "/dashboard", key: "nav.home", icon: Home },
    { href: "/receipts", key: "nav.receipts", icon: Receipt },
    { href: "/donors", key: "nav.donors", icon: Users },
    accountsItem,
    { href: "/more", key: "nav.more", icon: Menu },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
