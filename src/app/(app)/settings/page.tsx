import { requirePermission } from "@/lib/auth/tenant";
import { prisma } from "@/lib/db";
import { getMessages } from "@/i18n/get-messages";
import { getMessage } from "@/i18n/translate";
import { saveSettingsAction } from "@/actions/mandal";
import { Button } from "@/components/ui/button";
import { ganpatiImageUrl } from "@/lib/ganpati-image";

export default async function SettingsPage() {
  const { session, mandal } = await requirePermission("branding", "manage");
  const [settings, publicPage, mandalRecord] = await Promise.all([
    prisma.mandalSettings.findUnique({ where: { mandalId: mandal.id } }),
    prisma.publicPage.findUnique({ where: { mandalId: mandal.id } }),
    prisma.mandal.findUnique({ where: { id: mandal.id }, select: { ganpatiPhotoUrl: true } }),
  ]);
  const messages = await getMessages(session.language);
  const t = (path: string) => getMessage(messages, path);
  const photo = ganpatiImageUrl(mandalRecord?.ganpatiPhotoUrl);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
      <form
        action={async (formData) => {
          "use server";
          await saveSettingsAction(formData);
        }}
        className="space-y-3 rounded-[2rem] border bg-white p-5"
      >
        <div>
          <p className="mb-2 text-sm font-medium">{t("settings.ganpatiPhoto")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="mb-3 h-36 w-28 rounded-2xl object-cover" />
          <p className="mb-2 text-xs text-muted-foreground">{t("settings.ganpatiPhotoHint")}</p>
          <input name="ganpatiPhoto" type="file" accept="image/png,image/jpeg,image/webp" className="w-full text-sm" />
        </div>
        <input name="receiptPrefix" defaultValue={settings?.receiptPrefix} className="h-12 w-full rounded-2xl border px-4" />
        <select name="receiptTemplate" defaultValue={settings?.receiptTemplate} className="h-12 w-full rounded-2xl border px-4">
          <option value="TRADITIONAL">{t("templates.TRADITIONAL")}</option>
          <option value="MODERN">{t("templates.MODERN")}</option>
          <option value="PREMIUM">{t("templates.PREMIUM")}</option>
        </select>
        <input name="authorizedSignatory" defaultValue={settings?.authorizedSignatory ?? ""} placeholder={t("onboarding.signatory")} className="h-12 w-full rounded-2xl border px-4" />
        <input name="treasurerName" defaultValue={settings?.treasurerName ?? ""} placeholder={t("onboarding.treasurerName")} className="h-12 w-full rounded-2xl border px-4" />
        <textarea name="footerMessage" defaultValue={settings?.footerMessage ?? ""} className="min-h-24 w-full rounded-2xl border px-4 py-3" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="showPublicFinancials" defaultChecked={publicPage?.showFinancialSummary} />
          {t("settings.showFinance")}
        </label>
        <Button type="submit">{t("common.save")}</Button>
      </form>
    </div>
  );
}
