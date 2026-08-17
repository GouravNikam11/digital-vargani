import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/money";
import {
  getActiveFestival,
  getExpenseCategoryBreakdown,
  getFinancialTotals,
  getPaymentMethodBreakdown,
  getVolunteerCollection,
} from "@/services/finance.service";

export async function getFestivalSummary(mandalId: string) {
  const festival = await getActiveFestival(mandalId);
  if (!festival) return null;
  const filter = { mandalId, festivalId: festival.id };
  const [totals, payments, expenses, volunteer, donorCount] = await Promise.all([
    getFinancialTotals(filter),
    getPaymentMethodBreakdown(filter),
    getExpenseCategoryBreakdown(filter),
    getVolunteerCollection(filter),
    prisma.donor.count({ where: { mandalId, isActive: true } }),
  ]);

  return {
    festival,
    totals,
    payments,
    expenses,
    volunteer,
    donorCount,
  };
}

export async function getReceiptRegister(mandalId: string, from?: Date, to?: Date) {
  const festival = await getActiveFestival(mandalId);
  if (!festival) return [];
  return prisma.receipt.findMany({
    where: {
      mandalId,
      festivalId: festival.id,
      ...(from || to
        ? {
            receiptDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    include: { donor: true, createdBy: { select: { name: true } } },
    orderBy: { receiptNumber: "asc" },
  });
}

export async function buildExcelReport(rows: Array<Record<string, string | number>>) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Report");
  if (rows.length === 0) {
    sheet.addRow(["No data"]);
    return workbook.xlsx.writeBuffer();
  }
  const headers = Object.keys(rows[0]);
  sheet.addRow(headers);
  for (const row of rows) {
    sheet.addRow(headers.map((key) => row[key]));
  }
  sheet.columns.forEach((column) => {
    column.width = 22;
  });
  return workbook.xlsx.writeBuffer();
}

export function mapReceiptsToRows(
  receipts: Awaited<ReturnType<typeof getReceiptRegister>>,
) {
  return receipts.map((receipt) => ({
    receiptNumber: receipt.receiptNumber,
    date: receipt.receiptDate.toISOString().slice(0, 10),
    donor: receipt.donor.fullName,
    mobile: receipt.donor.mobile,
    amount: formatINR(receipt.amount.toString()),
    method: receipt.paymentMethod,
    status: receipt.status,
    volunteer: receipt.createdBy.name,
  }));
}
