import { prisma } from "@/lib/db";
import { AppError, ErrorCodes } from "@/lib/errors";
import { formatINR, moneyToString, toMoney } from "@/lib/money";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { writeAuditLog } from "@/services/audit.service";
import { getActiveFestival } from "@/services/finance.service";
import type { PaymentMethod } from "@/generated/prisma/enums";

export async function listExpenseCategories(mandalId: string) {
  return prisma.expenseCategory.findMany({
    where: { mandalId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createExpenseCategory(mandalId: string, input: { nameMr: string; nameEn: string }) {
  const slug = input.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  return prisma.expenseCategory.create({
    data: {
      mandalId,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      nameMr: input.nameMr.trim(),
      nameEn: input.nameEn.trim(),
      isDefault: false,
      sortOrder: 100,
    },
  });
}

export async function createExpense(input: {
  mandalId: string;
  userId: string;
  title: string;
  categoryId: string;
  amount: string;
  expenseDate: string;
  paymentMethod: PaymentMethod;
  vendor?: string;
  notes?: string;
  billUrl?: string;
}) {
  const festival = await getActiveFestival(input.mandalId);
  if (!festival) throw new AppError("NO_FESTIVAL", 400);

  const category = await prisma.expenseCategory.findFirst({
    where: { id: input.categoryId, mandalId: input.mandalId },
  });
  if (!category) throw new AppError(ErrorCodes.NOT_FOUND, 404);

  const expense = await prisma.expense.create({
    data: {
      mandalId: input.mandalId,
      festivalId: festival.id,
      categoryId: category.id,
      createdById: input.userId,
      title: input.title.trim(),
      amount: moneyToString(toMoney(input.amount)),
      expenseDate: new Date(input.expenseDate),
      paymentMethod: input.paymentMethod,
      vendor: input.vendor || null,
      notes: input.notes || null,
      billUrl: input.billUrl || null,
      status: "APPROVED",
    },
  });

  await writeAuditLog({
    mandalId: input.mandalId,
    userId: input.userId,
    action: AUDIT_ACTIONS.EXPENSE_CREATED,
    entity: "Expense",
    entityId: expense.id,
    metadata: { amount: expense.amount.toString(), title: expense.title },
  });

  return expense;
}

export async function listExpenses(input: {
  mandalId: string;
  page: number;
  pageSize: number;
  query?: string;
}) {
  const where = {
    mandalId: input.mandalId,
    deletedAt: null,
    ...(input.query
      ? {
          OR: [
            { title: { contains: input.query, mode: "insensitive" as const } },
            { vendor: { contains: input.query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      orderBy: { expenseDate: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      include: { category: true, createdBy: { select: { name: true } } },
    }),
  ]);

  return {
    total,
    page: input.page,
    pageSize: input.pageSize,
    items: items.map((expense) => ({
      id: expense.id,
      title: expense.title,
      categoryMr: expense.category.nameMr,
      categoryEn: expense.category.nameEn,
      amount: expense.amount.toString(),
      amountFormatted: formatINR(expense.amount.toString()),
      expenseDate: expense.expenseDate,
      paymentMethod: expense.paymentMethod,
      vendor: expense.vendor,
      createdBy: expense.createdBy.name,
    })),
  };
}

export async function softDeleteExpense(mandalId: string, userId: string, expenseId: string) {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, mandalId, deletedAt: null },
  });
  if (!expense) throw new AppError(ErrorCodes.NOT_FOUND, 404);

  await prisma.expense.update({
    where: { id: expense.id },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    mandalId,
    userId,
    action: AUDIT_ACTIONS.EXPENSE_DELETED,
    entity: "Expense",
    entityId: expense.id,
  });
}
