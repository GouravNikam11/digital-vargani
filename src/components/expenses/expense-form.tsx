"use client";

import { useState, useTransition } from "react";
import { createExpenseAction } from "@/actions/mandal";
import { Button } from "@/components/ui/button";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import { useT } from "@/i18n/provider";

export function ExpenseForm({
  categories,
}: {
  categories: Array<{ id: string; nameMr: string; nameEn: string }>;
}) {
  const { t, locale } = useT();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4 rounded-[2rem] border bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setError(null);
        start(async () => {
          const result = await createExpenseAction({
            title: data.get("title"),
            categoryId: data.get("categoryId"),
            amount: data.get("amount"),
            expenseDate: data.get("expenseDate"),
            paymentMethod: data.get("paymentMethod"),
            vendor: data.get("vendor"),
            notes: data.get("notes"),
          });
          if (!result.ok) setError(result.error);
          else event.currentTarget.reset();
        });
      }}
    >
      <div>
        <Label>{t("common.name")}</Label>
        <Input name="title" required />
      </div>
      <div>
        <Label>{t("expenses.category")}</Label>
        <NativeSelect name="categoryId" required>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {locale === "en" ? category.nameEn : category.nameMr}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div>
        <Label>{t("common.amount")}</Label>
        <Input name="amount" inputMode="decimal" required />
      </div>
      <div>
        <Label>{t("common.date")}</Label>
        <Input name="expenseDate" type="date" required />
      </div>
      <div>
        <Label>{t("receipts.paymentMethod")}</Label>
        <NativeSelect name="paymentMethod" defaultValue="CASH">
          <option value="CASH">{t("paymentMethods.CASH")}</option>
          <option value="UPI">{t("paymentMethods.UPI")}</option>
          <option value="BANK_TRANSFER">{t("paymentMethods.BANK_TRANSFER")}</option>
          <option value="CHEQUE">{t("paymentMethods.CHEQUE")}</option>
          <option value="OTHER">{t("paymentMethods.OTHER")}</option>
        </NativeSelect>
      </div>
      <div>
        <Label>{t("expenses.vendor")}</Label>
        <Input name="vendor" />
      </div>
      <div>
        <Label>{t("common.notes")}</Label>
        <Textarea name="notes" />
      </div>
      {error ? <p className="text-sm text-danger">{t("errors.generic")}</p> : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? t("common.loading") : t("expenses.add")}
      </Button>
    </form>
  );
}
