"use client";

import { useState, useTransition } from "react";
import { completeOnboardingAction } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input, Label, NativeSelect } from "@/components/ui/input";
import { useT } from "@/i18n/provider";
import { CURRENT_FESTIVAL_YEAR } from "@/config/constants";

const emptyInvite = { name: "", mobile: "", role: "VOLUNTEER" };

export function OnboardingWizard() {
  const { t } = useT();
  const [step, setStep] = useState(1);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mandal, setMandal] = useState({
    name: "",
    ganpatiYear: CURRENT_FESTIVAL_YEAR,
    address: "",
    city: "",
    district: "",
    taluka: "",
    pinCode: "",
    mobile: "",
    email: "",
  });
  const [festival, setFestival] = useState({
    name: "गणपती उत्सव",
    startDate: `${CURRENT_FESTIVAL_YEAR}-08-27`,
    endDate: `${CURRENT_FESTIVAL_YEAR}-09-06`,
    year: CURRENT_FESTIVAL_YEAR,
  });
  const [settings, setSettings] = useState({
    receiptPrefix: "GM",
    startingReceiptNumber: 1,
    receiptTemplate: "TRADITIONAL",
    authorizedSignatory: "",
    treasurerName: "",
  });
  const [invites, setInvites] = useState([emptyInvite]);

  function submit() {
    setError(null);
    start(async () => {
      const result = await completeOnboardingAction({
        mandal,
        festival,
        settings,
        invites: invites.filter((invite) => invite.name && invite.mobile),
      });
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 py-8">
      <p className="text-xs text-accent">॥ श्री गणेशाय नमः ॥</p>
      <h1 className="mt-1 text-2xl font-bold text-primary">{t(`onboarding.step${step}Title`)}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {step}/5
      </p>
      <div className="mt-6 space-y-4 rounded-[2rem] border border-border bg-white p-5">
        {step === 1 ? (
          <>
            <Field label={t("onboarding.mandalName")} value={mandal.name} onChange={(value) => setMandal({ ...mandal, name: value })} />
            <Field label={t("onboarding.ganpatiYear")} value={String(mandal.ganpatiYear)} onChange={(value) => setMandal({ ...mandal, ganpatiYear: Number(value) })} />
            <Field label={t("common.address")} value={mandal.address} onChange={(value) => setMandal({ ...mandal, address: value })} />
            <Field label={t("common.city")} value={mandal.city} onChange={(value) => setMandal({ ...mandal, city: value })} />
            <Field label={t("onboarding.district")} value={mandal.district} onChange={(value) => setMandal({ ...mandal, district: value })} />
            <Field label={t("onboarding.taluka")} value={mandal.taluka} onChange={(value) => setMandal({ ...mandal, taluka: value })} />
            <Field label={t("onboarding.pinCode")} value={mandal.pinCode} onChange={(value) => setMandal({ ...mandal, pinCode: value })} />
            <Field label={t("common.mobile")} value={mandal.mobile} onChange={(value) => setMandal({ ...mandal, mobile: value })} />
            <Field label={t("common.email")} value={mandal.email} onChange={(value) => setMandal({ ...mandal, email: value })} />
          </>
        ) : null}
        {step === 2 ? (
          <>
            <Field label={t("onboarding.festivalName")} value={festival.name} onChange={(value) => setFestival({ ...festival, name: value })} />
            <Field type="date" label={t("onboarding.startDate")} value={festival.startDate} onChange={(value) => setFestival({ ...festival, startDate: value })} />
            <Field type="date" label={t("onboarding.endDate")} value={festival.endDate} onChange={(value) => setFestival({ ...festival, endDate: value })} />
            <Field label={t("common.year")} value={String(festival.year)} onChange={(value) => setFestival({ ...festival, year: Number(value) })} />
          </>
        ) : null}
        {step === 3 ? (
          <>
            <Field label={t("onboarding.receiptPrefix")} value={settings.receiptPrefix} onChange={(value) => setSettings({ ...settings, receiptPrefix: value })} />
            <Field label={t("onboarding.startingNumber")} value={String(settings.startingReceiptNumber)} onChange={(value) => setSettings({ ...settings, startingReceiptNumber: Number(value) })} />
            <div>
              <Label>{t("onboarding.template")}</Label>
              <NativeSelect
                value={settings.receiptTemplate}
                onChange={(event) => setSettings({ ...settings, receiptTemplate: event.target.value })}
              >
                <option value="TRADITIONAL">{t("templates.TRADITIONAL")}</option>
                <option value="MODERN">{t("templates.MODERN")}</option>
                <option value="PREMIUM">{t("templates.PREMIUM")}</option>
              </NativeSelect>
            </div>
            <Field label={t("onboarding.signatory")} value={settings.authorizedSignatory} onChange={(value) => setSettings({ ...settings, authorizedSignatory: value })} />
            <Field label={t("onboarding.treasurerName")} value={settings.treasurerName} onChange={(value) => setSettings({ ...settings, treasurerName: value })} />
          </>
        ) : null}
        {step === 4 ? (
          <>
            <p className="text-sm text-muted-foreground">{t("onboarding.inviteHint")}</p>
            {invites.map((invite, index) => (
              <div key={index} className="grid gap-3 rounded-2xl bg-muted p-3">
                <Field label={t("common.name")} value={invite.name} onChange={(value) => {
                  const next = [...invites];
                  next[index] = { ...invite, name: value };
                  setInvites(next);
                }} />
                <Field label={t("common.mobile")} value={invite.mobile} onChange={(value) => {
                  const next = [...invites];
                  next[index] = { ...invite, mobile: value };
                  setInvites(next);
                }} />
                <div>
                  <Label>{t("onboarding.role")}</Label>
                  <NativeSelect
                    value={invite.role}
                    onChange={(event) => {
                      const next = [...invites];
                      next[index] = { ...invite, role: event.target.value };
                      setInvites(next);
                    }}
                  >
                    <option value="VOLUNTEER">{t("roles.VOLUNTEER")}</option>
                    <option value="TREASURER">{t("roles.TREASURER")}</option>
                    <option value="ADMIN">{t("roles.ADMIN")}</option>
                  </NativeSelect>
                </div>
              </div>
            ))}
            <Button variant="outline" type="button" onClick={() => setInvites([...invites, emptyInvite])}>
              {t("volunteers.add")}
            </Button>
          </>
        ) : null}
        {step === 5 ? (
          <div className="space-y-3 py-6 text-center">
            <p className="text-3xl">🙏</p>
            <p className="text-lg font-semibold">{t("onboarding.success")}</p>
          </div>
        ) : null}
        {error ? <p className="text-sm text-danger">{t("errors.generic")}</p> : null}
        <div className="flex gap-3">
          {step > 1 && step < 5 ? (
            <Button variant="outline" type="button" onClick={() => setStep(step - 1)}>
              {t("common.back")}
            </Button>
          ) : null}
          {step < 4 ? (
            <Button className="flex-1" type="button" onClick={() => setStep(step + 1)}>
              {t("common.next")}
            </Button>
          ) : null}
          {step === 4 ? (
            <Button className="flex-1" type="button" onClick={() => setStep(5)}>
              {t("onboarding.skipInvite")}
            </Button>
          ) : null}
          {step === 5 ? (
            <Button className="flex-1" disabled={pending} type="button" onClick={submit}>
              {pending ? t("common.loading") : t("onboarding.firstReceipt")}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
