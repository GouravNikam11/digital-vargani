import Link from "next/link";
import { Plus } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { SessionPayload } from "@/lib/auth/session";
import { getMessage, type Messages } from "@/i18n/translate";

export function AppShell({
  session,
  messages,
  children,
}: {
  session: SessionPayload;
  messages: Messages;
  children: React.ReactNode;
}) {
  const t = (path: string) => getMessage(messages, path);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        mandalName={session.mandalName ?? t("app.name")}
        isSuperAdmin={session.isSuperAdmin}
        role={session.role}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <div>
            <p className="text-xs text-accent">॥ श्री गणेशाय नमः ॥</p>
            <p className="font-semibold text-primary">{session.mandalName ?? t("app.name")}</p>
          </div>
          <LanguageSwitcher />
        </header>
        <main className="flex-1 px-4 py-4 pb-28 md:px-8 md:pb-8">{children}</main>
        <Link
          href="/receipts/new"
          className="fixed right-4 bottom-20 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:bottom-8"
          aria-label={t("nav.newReceipt")}
        >
          <Plus className="h-7 w-7" />
        </Link>
        <BottomNav role={session.role} />
      </div>
    </div>
  );
}
