"use client";

import { useEffect, useState, useTransition } from "react";
import { createReceiptAction, lookupDonorAction } from "@/actions/receipts";
import { Button } from "@/components/ui/button";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import { useT } from "@/i18n/provider";
import { WhatsAppPdfButton } from "@/components/receipts/whatsapp-pdf-button";
import { getMessage } from "@/i18n/translate";
import type { Messages } from "@/i18n/translate";

const methods = ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"] as const;

export function ReceiptForm({
  messages,
  locale,
}: {
  messages: Messages;
  locale: "mr" | "en";
}) {
  const { t } = useT();
  const [pending, start] = useTransition();
  const [mobile, setMobile] = useState("");
  const [existing, setExisting] = useState<{ id: string; fullName: string; address: string | null; area: string | null; city: string | null } | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    address: "",
    area: "",
    city: "",
    amount: "",
    paymentMethod: "CASH",
    transactionId: "",
    chequeNumber: "",
    notes: "",
    donorId: "",
  });
  const [result, setResult] = useState<{
    receiptNumber: string;
    receiptId: string;
    pdfUrl: string | null;
    verificationToken: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (mobile.length === 10) {
        const donor = await lookupDonorAction(mobile);
        setExisting(donor);
      } else {
        setExisting(null);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [mobile]);

  function useExisting() {
    if (!existing) return;
    setForm((current) => ({
      ...current,
      fullName: existing.fullName,
      address: existing.address ?? "",
      area: existing.area ?? "",
      city: existing.city ?? "",
      donorId: existing.id,
    }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    start(async () => {
      const created = await createReceiptAction({
        ...form,
        mobile,
        amount: form.amount,
        paymentMethod: form.paymentMethod,
        donorId: form.donorId || undefined,
      });
      if (!created.ok) {
        setError(created.error);
        return;
      }
      setResult({
        receiptNumber: created.receiptNumber,
        receiptId: created.receiptId,
        pdfUrl: created.pdfUrl,
        verificationToken: created.verificationToken,
      });
    });
  }

  if (result) {
    const message = getMessage(messages, "whatsapp.message", {
      amount: `₹${form.amount}`,
      receiptNumber: result.receiptNumber,
    });
    return (
      <div className="space-y-4 rounded-[2rem] border border-border bg-white p-5">
        <h2 className="text-xl font-bold text-primary">{t("receipts.pdfReady")}</h2>
        <p className="text-lg font-semibold">{result.receiptNumber}</p>
        <div className="grid gap-3">
          {result.pdfUrl ? (
            <a className="rounded-2xl bg-primary px-4 py-3 text-center font-semibold text-primary-foreground" href={result.pdfUrl} target="_blank" rel="noreferrer">
              {t("receipts.generatePdf")}
            </a>
          ) : null}
          <WhatsAppPdfButton
            receiptId={result.receiptId}
            receiptNumber={result.receiptNumber}
            mobile={mobile}
            message={message}
            pdfUrl={result.pdfUrl}
          />
          <button className="rounded-2xl border border-border px-4 py-3 font-semibold" type="button" onClick={() => window.print()}>
            {t("receipts.print")}
          </button>
          <Button variant="outline" type="button" onClick={() => { setResult(null); setForm({ ...form, amount: "", transactionId: "", notes: "" }); }}>
            {t("receipts.recreate")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[2rem] border border-border bg-white p-5">
      <h2 className="font-semibold">{t("receipts.donorInfo")}</h2>
      <div>
        <Label>{t("common.mobile")}</Label>
        <Input value={mobile} inputMode="numeric" onChange={(event) => setMobile(event.target.value)} required />
      </div>
      {existing ? (
        <div className="rounded-2xl bg-secondary p-3 text-sm">
          <p>{t("receipts.existingDonor")}</p>
          <p className="font-semibold">{existing.fullName}</p>
          <Button className="mt-2" size="sm" type="button" onClick={useExisting}>
            {t("receipts.useDonor")}
          </Button>
        </div>
      ) : null}
      <div>
        <Label>{t("receipts.fullName")}</Label>
        <Input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
      </div>
      <div>
        <Label>{t("common.address")}</Label>
        <Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t("common.area")}</Label>
          <Input value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} />
        </div>
        <div>
          <Label>{t("common.city")}</Label>
          <Input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
        </div>
      </div>
      <h2 className="font-semibold">{t("receipts.payment")}</h2>
      <div>
        <Label>{t("common.amount")}</Label>
        <Input value={form.amount} inputMode="decimal" onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
      </div>
      <div>
        <Label>{t("receipts.paymentMethod")}</Label>
        <NativeSelect value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}>
          {methods.map((method) => (
            <option key={method} value={method}>
              {t(`paymentMethods.${method}`)}
            </option>
          ))}
        </NativeSelect>
      </div>
      {form.paymentMethod === "UPI" || form.paymentMethod === "BANK_TRANSFER" ? (
        <div>
          <Label>{t("receipts.transactionId")}</Label>
          <Input value={form.transactionId} onChange={(event) => setForm({ ...form, transactionId: event.target.value })} />
        </div>
      ) : null}
      {form.paymentMethod === "CHEQUE" ? (
        <div>
          <Label>{t("receipts.chequeNumber")}</Label>
          <Input value={form.chequeNumber} onChange={(event) => setForm({ ...form, chequeNumber: event.target.value })} />
        </div>
      ) : null}
      <div>
        <Label>{t("common.notes")}</Label>
        <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
      </div>
      {error === "RECEIPT_LIMIT" ? (
        <div className="rounded-2xl bg-rose-50 p-3 text-sm text-danger">
          <p>{t("receipts.limitReached")}</p>
          <p>{t("receipts.limitReachedHint")}</p>
          <a className="mt-2 inline-block font-semibold" href="/subscription">{t("receipts.upgrade")}</a>
        </div>
      ) : error ? (
        <p className="text-sm text-danger">{t("errors.generic")}</p>
      ) : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? t("receipts.creating") : t("receipts.create")}
      </Button>
      <p className="hidden">{locale}</p>
    </form>
  );
}
