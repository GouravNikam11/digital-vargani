import { requirePermission } from "@/lib/auth/tenant";
import { listPendingCollections } from "@/services/pending.service";
import { listDonors } from "@/services/receipt.service";
import { listVolunteers } from "@/services/volunteer.service";
import { getMessages } from "@/i18n/get-messages";
import { getMessage } from "@/i18n/translate";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { collectPendingAction, createPendingAction } from "@/actions/mandal";
import { Button } from "@/components/ui/button";

export default async function PendingPage() {
  const { session, mandal, role } = await requirePermission("pending", "view");
  const assignedToId = role === "VOLUNTEER" ? session.userId : undefined;
  const [pending, donors, volunteers] = await Promise.all([
    listPendingCollections({ mandalId: mandal.id, assignedToId, page: 1, pageSize: 50 }),
    listDonors({ mandalId: mandal.id, page: 1, pageSize: 50 }),
    listVolunteers(mandal.id),
  ]);
  const messages = await getMessages(session.language);
  const t = (path: string) => getMessage(messages, path);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t("pending.title")}</h1>
      {role !== "VOLUNTEER" ? (
        <form
          className="space-y-3 rounded-[2rem] border bg-white p-5"
          action={async (formData) => {
            "use server";
            await createPendingAction({
              donorId: formData.get("donorId"),
              expectedAmount: formData.get("expectedAmount"),
              dueDate: formData.get("dueDate") || undefined,
              assignedToId: formData.get("assignedToId") || undefined,
              notes: formData.get("notes") || undefined,
            });
          }}
        >
          <select name="donorId" required className="h-12 w-full rounded-2xl border px-4">
            {donors.items.map((donor) => (
              <option key={donor.id} value={donor.id}>
                {donor.fullName} · {donor.mobile}
              </option>
            ))}
          </select>
          <input name="expectedAmount" placeholder={t("pending.expected")} required className="h-12 w-full rounded-2xl border px-4" />
          <input name="dueDate" type="date" className="h-12 w-full rounded-2xl border px-4" />
          <select name="assignedToId" className="h-12 w-full rounded-2xl border px-4">
            <option value="">{t("pending.assignedTo")}</option>
            {volunteers.map((volunteer) => (
              <option key={volunteer.userId} value={volunteer.userId}>
                {volunteer.name}
              </option>
            ))}
          </select>
          <Button type="submit">{t("pending.add")}</Button>
        </form>
      ) : null}
      {pending.items.length === 0 ? (
        <EmptyState title={t("pending.empty")} />
      ) : (
        pending.items.map((item) => (
          <Card key={item.id} className="space-y-2">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{item.donorName}</p>
                <p className="text-sm text-muted-foreground">{item.mobile}</p>
              </div>
              <p className="font-bold text-primary">{item.expectedAmount}</p>
            </div>
            <p className="text-sm">{t(`status.${item.status}`)} {item.assignedTo ? `· ${item.assignedTo}` : ""}</p>
            {item.status !== "PAID" && item.status !== "CANCELLED" ? (
              <form
                action={async () => {
                  "use server";
                  await collectPendingAction(item.id);
                }}
              >
                <Button size="sm" type="submit">{t("pending.markCollected")}</Button>
              </form>
            ) : null}
          </Card>
        ))
      )}
    </div>
  );
}
