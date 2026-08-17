import { prisma } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";
import {
  getActiveFestival,
  getDailyCollection,
  getExpenseCategoryBreakdown,
  getFinancialTotals,
  getPaymentMethodBreakdown,
} from "@/services/finance.service";

export async function getDashboardData(mandalId: string, role: "ADMIN" | "TREASURER" | "VOLUNTEER") {
  const festival = await getActiveFestival(mandalId);
  if (!festival) return null;

  const todayFilter = {
    mandalId,
    festivalId: festival.id,
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  };
  const festivalFilter = { mandalId, festivalId: festival.id };
  const showFinance = role !== "VOLUNTEER";

  const [totals, todayTotals, pendingCount, volunteerCount, paymentBreakdown, expenseBreakdown, daily] =
    await Promise.all([
      getFinancialTotals(festivalFilter),
      getFinancialTotals(todayFilter),
      prisma.pendingCollection.count({
        where: { mandalId, festivalId: festival.id, status: { in: ["PENDING", "PARTIALLY_PAID"] } },
      }),
      prisma.mandalMember.count({ where: { mandalId, isActive: true } }),
      getPaymentMethodBreakdown(festivalFilter),
      getExpenseCategoryBreakdown(festivalFilter),
      getDailyCollection(festivalFilter),
    ]);

  return {
    festival: { id: festival.id, name: festival.name, year: festival.year },
    showFinance,
    receiptCount: totals.receiptCount,
    pendingCount,
    volunteerCount,
    totals: {
      collection: totals.collectionFormatted,
      expenses: totals.expensesFormatted,
      balance: totals.balanceFormatted,
      receipts: totals.receiptCount,
    },
    today: {
      collection: todayTotals.collectionFormatted,
      expenses: todayTotals.expensesFormatted,
    },
    paymentBreakdown: paymentBreakdown.map((row) => ({
      method: row.method,
      amount: row.formatted,
      value: Number(row.amount.toFixed(2)),
    })),
    expenseBreakdown: expenseBreakdown.map((row) => ({
      nameMr: row.nameMr,
      nameEn: row.nameEn,
      amount: row.formatted,
      value: Number(row.amount.toFixed(2)),
    })),
    daily: daily.map((row) => ({
      date: row.date,
      amount: Number(row.amount.toFixed(2)),
      formatted: row.formatted,
    })),
  };
}
