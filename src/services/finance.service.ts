import { prisma } from "@/lib/db";
import { addMoney, formatINR, remainingBalance, toMoney, type Decimal } from "@/lib/money";

type FinanceFilter = {
  mandalId: string;
  festivalId: string;
  from?: Date;
  to?: Date;
};

function receiptWhere(filter: FinanceFilter) {
  return {
    mandalId: filter.mandalId,
    festivalId: filter.festivalId,
    status: "ACTIVE" as const,
    ...(filter.from || filter.to
      ? {
          receiptDate: {
            ...(filter.from ? { gte: filter.from } : {}),
            ...(filter.to ? { lte: filter.to } : {}),
          },
        }
      : {}),
  };
}

function expenseWhere(filter: FinanceFilter) {
  return {
    mandalId: filter.mandalId,
    festivalId: filter.festivalId,
    status: "APPROVED" as const,
    deletedAt: null,
    ...(filter.from || filter.to
      ? {
          expenseDate: {
            ...(filter.from ? { gte: filter.from } : {}),
            ...(filter.to ? { lte: filter.to } : {}),
          },
        }
      : {}),
  };
}

export async function getFinancialTotals(filter: FinanceFilter) {
  const [collectionAgg, expenseAgg] = await Promise.all([
    prisma.receipt.aggregate({
      where: receiptWhere(filter),
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.expense.aggregate({
      where: expenseWhere(filter),
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const collection = toMoney(collectionAgg._sum.amount?.toString() ?? "0");
  const expenses = toMoney(expenseAgg._sum.amount?.toString() ?? "0");
  const balance = remainingBalance(collection, expenses);

  return {
    collection,
    expenses,
    balance,
    receiptCount: collectionAgg._count._all,
    expenseCount: expenseAgg._count._all,
    collectionFormatted: formatINR(collection),
    expensesFormatted: formatINR(expenses),
    balanceFormatted: formatINR(balance),
  };
}

export async function getPaymentMethodBreakdown(filter: FinanceFilter) {
  const grouped = await prisma.receipt.groupBy({
    by: ["paymentMethod"],
    where: receiptWhere(filter),
    _sum: { amount: true },
    _count: { _all: true },
  });

  return grouped.map((row) => {
    const amount = toMoney(row._sum.amount?.toString() ?? "0");
    return {
      method: row.paymentMethod,
      amount,
      count: row._count._all,
      formatted: formatINR(amount),
    };
  });
}

export async function getExpenseCategoryBreakdown(filter: FinanceFilter) {
  const grouped = await prisma.expense.groupBy({
    by: ["categoryId"],
    where: expenseWhere(filter),
    _sum: { amount: true },
    _count: { _all: true },
  });

  const categories = await prisma.expenseCategory.findMany({
    where: { mandalId: filter.mandalId },
  });
  const byId = new Map(categories.map((category) => [category.id, category]));

  return grouped.map((row) => {
    const amount = toMoney(row._sum.amount?.toString() ?? "0");
    const category = byId.get(row.categoryId);
    return {
      categoryId: row.categoryId,
      nameMr: category?.nameMr ?? "इतर",
      nameEn: category?.nameEn ?? "Other",
      amount,
      count: row._count._all,
      formatted: formatINR(amount),
    };
  });
}

export async function getDailyCollection(filter: FinanceFilter) {
  const receipts = await prisma.receipt.findMany({
    where: receiptWhere(filter),
    select: { receiptDate: true, amount: true },
    orderBy: { receiptDate: "asc" },
  });

  const byDay = new Map<string, Decimal>();
  for (const receipt of receipts) {
    const day = receipt.receiptDate.toISOString().slice(0, 10);
    const current = byDay.get(day) ?? toMoney("0");
    byDay.set(day, addMoney(current, receipt.amount.toString()));
  }

  return [...byDay.entries()].map(([date, amount]) => ({
    date,
    amount,
    formatted: formatINR(amount),
  }));
}

export async function getVolunteerCollection(filter: FinanceFilter) {
  const grouped = await prisma.receipt.groupBy({
    by: ["createdById"],
    where: receiptWhere(filter),
    _sum: { amount: true },
    _count: { _all: true },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map((row) => row.createdById) } },
    select: { id: true, name: true, mobile: true },
  });
  const byId = new Map(users.map((user) => [user.id, user]));

  return grouped
    .map((row) => {
      const amount = toMoney(row._sum.amount?.toString() ?? "0");
      const user = byId.get(row.createdById);
      return {
        userId: row.createdById,
        name: user?.name ?? "Unknown",
        mobile: user?.mobile ?? "",
        receiptCount: row._count._all,
        amount,
        formatted: formatINR(amount),
      };
    })
    .sort((a, b) => b.amount.comparedTo(a.amount));
}

export async function getActiveFestival(mandalId: string) {
  const festival = await prisma.festival.findFirst({
    where: { mandalId, isActive: true },
    orderBy: { year: "desc" },
  });
  return festival;
}
