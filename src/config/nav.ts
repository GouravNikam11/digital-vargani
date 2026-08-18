import { can, type MandalRole, type PermissionModule } from "@/lib/permissions";

type NavLink = {
  href: string;
  key: string;
  module: PermissionModule;
  action: string;
};

export const SIDEBAR_LINKS: NavLink[] = [
  { href: "/dashboard", key: "nav.dashboard", module: "dashboard", action: "volunteer" },
  { href: "/receipts", key: "nav.receipts", module: "receipts", action: "view" },
  { href: "/donors", key: "nav.donors", module: "donors", action: "view" },
  { href: "/expenses", key: "nav.expenses", module: "expenses", action: "view" },
  { href: "/pending", key: "nav.pending", module: "pending", action: "view" },
  { href: "/reports", key: "nav.reports", module: "reports", action: "financial" },
  { href: "/volunteers", key: "nav.volunteers", module: "members", action: "view" },
  { href: "/settings", key: "nav.settings", module: "branding", action: "manage" },
  { href: "/subscription", key: "nav.subscription", module: "subscription", action: "view" },
];

export function visibleSidebarLinks(role: MandalRole | null | undefined) {
  return SIDEBAR_LINKS.filter((link) => can(role, link.module, link.action));
}
