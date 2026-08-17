import { requirePermission } from "@/lib/auth/tenant";
import { listExpenseCategories, listExpenses } from "@/services/expense.service";
import { getMessages } from "@/i18n/get-messages";
import { getMessage } from "@/i18n/translate";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default async function ExpensesPage() {
  const { session, mandal } = await requirePermission("expenses", "view");
  const [categories, expenses] = await Promise.all([
    listExpenseCategories(mandal.id),
    listExpenses({ mandalId: mandal.id, page: 1, pageSize: 30 }),
  ]);
  const messages = await getMessages(session.language);
  const t = (path: string) => getMessage(messages, path);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t("expenses.title")}</h1>
      <ExpenseForm categories={categories} />
      {expenses.items.length === 0 ? (
        <EmptyState title={t("expenses.empty")} />
      ) : (
        expenses.items.map((expense) => (
          <Card key={expense.id} className="flex justify-between">
            <div>
              <p className="font-semibold">{expense.title}</p>
              <p className="text-sm text-muted-foreground">
                {session.language === "en" ? expense.categoryEn : expense.categoryMr}
              </p>
            </div>
            <p className="font-bold text-primary">{expense.amountFormatted}</p>
          </Card>
        ))
      )}
    </div>
  );
}
