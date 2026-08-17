import { requirePermission } from "@/lib/auth/tenant";
import { listVolunteers } from "@/services/volunteer.service";
import { getMessages } from "@/i18n/get-messages";
import { getMessage } from "@/i18n/translate";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { inviteVolunteerAction } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";

export default async function VolunteersPage() {
  const { session, mandal } = await requirePermission("members", "view");
  const volunteers = await listVolunteers(mandal.id);
  const messages = await getMessages(session.language);
  const t = (path: string) => getMessage(messages, path);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t("volunteers.title")}</h1>
      {session.role === "ADMIN" ? (
        <form
          action={async (formData) => {
            "use server";
            await inviteVolunteerAction(formData);
          }}
          className="space-y-3 rounded-[2rem] border bg-white p-5"
        >
          <input name="name" placeholder={t("common.name")} required className="h-12 w-full rounded-2xl border px-4" />
          <input name="mobile" placeholder={t("common.mobile")} required className="h-12 w-full rounded-2xl border px-4" />
          <select name="role" className="h-12 w-full rounded-2xl border px-4">
            <option value="VOLUNTEER">{t("roles.VOLUNTEER")}</option>
            <option value="TREASURER">{t("roles.TREASURER")}</option>
            <option value="ADMIN">{t("roles.ADMIN")}</option>
          </select>
          <Button type="submit">{t("volunteers.add")}</Button>
        </form>
      ) : null}
      {volunteers.length === 0 ? (
        <EmptyState title={t("volunteers.empty")} />
      ) : (
        volunteers.map((volunteer) => (
          <Card key={volunteer.id} className="flex justify-between">
            <div>
              <p className="font-semibold">{volunteer.name}</p>
              <p className="text-sm text-muted-foreground">{t(`roles.${volunteer.role}`)} · {volunteer.mobile}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">{volunteer.collection}</p>
              <p className="text-xs">{volunteer.receiptCount} {t("volunteers.receipts")}</p>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
