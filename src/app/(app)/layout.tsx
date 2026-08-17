import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth/tenant";
import { getMessages } from "@/i18n/get-messages";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/login");
  if (!session.mandalId) redirect("/onboarding");
  const messages = await getMessages(session.language);

  return (
    <AppShell session={session} messages={messages}>
      {children}
    </AppShell>
  );
}
