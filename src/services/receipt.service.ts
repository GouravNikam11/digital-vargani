import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { AppError, ErrorCodes } from "@/lib/errors";
import { formatINR, moneyToString, toMoney } from "@/lib/money";
import { amountInWordsEn, amountInWordsMr } from "@/lib/amount-in-words";
import { formatReceiptNumber } from "@/lib/receipt-number";
import { hasReachedReceiptLimit } from "@/lib/subscription-limits";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { writeAuditLog } from "@/services/audit.service";
import { getActiveFestival } from "@/services/finance.service";
import { normalizeMobile } from "@/lib/utils";
import type { PaymentMethod } from "@/generated/prisma/enums";

export async function findDonorByMobile(mandalId: string, mobile: string) {
  return prisma.donor.findUnique({
    where: { mandalId_mobile: { mandalId, mobile: normalizeMobile(mobile) } },
  });
}

export async function upsertDonor(input: {
  mandalId: string;
  fullName: string;
  mobile: string;
  address?: string;
  area?: string;
  city?: string;
  notes?: string;
}) {
  const mobile = normalizeMobile(input.mobile);
  return prisma.donor.upsert({
    where: { mandalId_mobile: { mandalId: input.mandalId, mobile } },
    update: {
      fullName: input.fullName.trim(),
      address: input.address || undefined,
      area: input.area || undefined,
      city: input.city || undefined,
      isActive: true,
    },
    create: {
      mandalId: input.mandalId,
      fullName: input.fullName.trim(),
      mobile,
      address: input.address || null,
      area: input.area || null,
      city: input.city || null,
      notes: input.notes || null,
    },
  });
}

export async function listDonors(input: {
  mandalId: string;
  query?: string;
  area?: string;
  page: number;
  pageSize: number;
}) {
  const where = {
    mandalId: input.mandalId,
    isActive: true,
    ...(input.area ? { area: input.area } : {}),
    ...(input.query
      ? {
          OR: [
            { fullName: { contains: input.query, mode: "insensitive" as const } },
            { mobile: { contains: input.query } },
          ],
        }
      : {}),
  };

  const [total, donors] = await Promise.all([
    prisma.donor.count({ where }),
    prisma.donor.findMany({
      where,
      orderBy: { fullName: "asc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      include: {
        receipts: {
          where: { status: "ACTIVE" },
          select: { amount: true, receiptDate: true },
          orderBy: { receiptDate: "desc" },
        },
      },
    }),
  ]);

  return {
    total,
    page: input.page,
    pageSize: input.pageSize,
    items: donors.map((donor) => {
      const totalAmount = donor.receipts.reduce(
        (sum, receipt) => sum.plus(toMoney(receipt.amount.toString())),
        toMoney("0"),
      );
      const last = donor.receipts[0];
      return {
        id: donor.id,
        fullName: donor.fullName,
        mobile: donor.mobile,
        area: donor.area,
        city: donor.city,
        receiptCount: donor.receipts.length,
        totalContribution: moneyToString(totalAmount),
        totalFormatted: formatINR(totalAmount),
        lastContribution: last ? formatINR(last.amount.toString()) : null,
        lastDate: last?.receiptDate ?? null,
      };
    }),
  };
}

export async function getDonorProfile(mandalId: string, donorId: string) {
  const donor = await prisma.donor.findFirst({
    where: { id: donorId, mandalId },
    include: {
      receipts: {
        where: { mandalId },
        orderBy: { receiptDate: "desc" },
        include: { createdBy: { select: { name: true } } },
      },
    },
  });
  if (!donor) throw new AppError(ErrorCodes.NOT_FOUND, 404);

  const active = donor.receipts.filter((receipt) => receipt.status === "ACTIVE");
  const totalAmount = active.reduce(
    (sum, receipt) => sum.plus(toMoney(receipt.amount.toString())),
    toMoney("0"),
  );

  return {
    ...donor,
    totalContribution: moneyToString(totalAmount),
    totalFormatted: formatINR(totalAmount),
    receiptCount: active.length,
    lastContribution: active[0] ? formatINR(active[0].amount.toString()) : null,
  };
}

export async function createReceipt(input: {
  mandalId: string;
  userId: string;
  volunteerName: string;
  fullName: string;
  mobile: string;
  address?: string;
  area?: string;
  city?: string;
  amount: string;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  chequeNumber?: string;
  notes?: string;
  donorId?: string;
}) {
  const festival = await getActiveFestival(input.mandalId);
  if (!festival) throw new AppError("NO_FESTIVAL", 400);

  const subscription = await prisma.subscription.findUnique({
    where: { mandalId: input.mandalId },
    include: { plan: true },
  });
  if (!subscription) throw new AppError("NO_SUBSCRIPTION", 400);

  const usage = await prisma.usageRecord.findUnique({
    where: { mandalId_festivalId: { mandalId: input.mandalId, festivalId: festival.id } },
  });
  const currentReceipts = usage?.receiptCount ?? 0;
  if (hasReachedReceiptLimit({ currentReceipts, receiptLimit: subscription.plan.receiptLimit })) {
    throw new AppError(ErrorCodes.RECEIPT_LIMIT, 402);
  }

  const amount = toMoney(input.amount);
  const mobile = normalizeMobile(input.mobile);

  const created = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT id FROM mandal_settings WHERE mandal_id = ${input.mandalId}::uuid FOR UPDATE`;
    const settings = await tx.mandalSettings.findUniqueOrThrow({
      where: { mandalId: input.mandalId },
    });

    const donor = input.donorId
      ? await tx.donor.findFirst({ where: { id: input.donorId, mandalId: input.mandalId } })
      : await tx.donor.findUnique({
          where: { mandalId_mobile: { mandalId: input.mandalId, mobile } },
        });

    const resolvedDonor =
      donor ??
      (await tx.donor.create({
        data: {
          mandalId: input.mandalId,
          fullName: input.fullName.trim(),
          mobile,
          address: input.address || null,
          area: input.area || null,
          city: input.city || null,
        },
      }));

    if (donor) {
      await tx.donor.update({
        where: { id: resolvedDonor.id },
        data: {
          fullName: input.fullName.trim(),
          address: input.address || resolvedDonor.address,
          area: input.area || resolvedDonor.area,
          city: input.city || resolvedDonor.city,
        },
      });
    }

    const receiptNumber = formatReceiptNumber(
      settings.receiptPrefix,
      festival.year,
      settings.nextReceiptNumber,
    );
    const verificationToken = nanoid(32);

    const receipt = await tx.receipt.create({
      data: {
        mandalId: input.mandalId,
        festivalId: festival.id,
        donorId: resolvedDonor.id,
        createdById: input.userId,
        receiptNumber,
        verificationToken,
        amount: moneyToString(amount),
        amountInWordsMr: amountInWordsMr(amount.toFixed(2)),
        amountInWordsEn: amountInWordsEn(amount.toFixed(2)),
        paymentMethod: input.paymentMethod,
        transactionId: input.transactionId || null,
        chequeNumber: input.chequeNumber || null,
        notes: input.notes || null,
        status: "ACTIVE",
        receiptDate: new Date(),
      },
    });

    await tx.payment.create({
      data: {
        receiptId: receipt.id,
        mandalId: input.mandalId,
        amount: moneyToString(amount),
        method: input.paymentMethod,
        transactionId: input.transactionId || null,
        chequeNumber: input.chequeNumber || null,
      },
    });

    await tx.mandalSettings.update({
      where: { mandalId: input.mandalId },
      data: { nextReceiptNumber: { increment: 1 } },
    });

    await tx.usageRecord.upsert({
      where: { mandalId_festivalId: { mandalId: input.mandalId, festivalId: festival.id } },
      update: { receiptCount: { increment: 1 } },
      create: {
        mandalId: input.mandalId,
        festivalId: festival.id,
        receiptCount: 1,
        volunteerCount: 0,
        periodStart: new Date(),
      },
    });

    return { receipt, donor: resolvedDonor, settings };
  });

  await writeAuditLog({
    mandalId: input.mandalId,
    userId: input.userId,
    action: AUDIT_ACTIONS.RECEIPT_CREATED,
    entity: "Receipt",
    entityId: created.receipt.id,
    metadata: { receiptNumber: created.receipt.receiptNumber, amount: moneyToString(amount) },
  });

  return created;
}

export async function cancelReceipt(input: {
  mandalId: string;
  userId: string;
  receiptId: string;
  reason: string;
}) {
  const receipt = await prisma.receipt.findFirst({
    where: { id: input.receiptId, mandalId: input.mandalId },
  });
  if (!receipt) throw new AppError(ErrorCodes.NOT_FOUND, 404);
  if (receipt.status === "CANCELLED") throw new AppError(ErrorCodes.VALIDATION, 400);

  const updated = await prisma.receipt.update({
    where: { id: receipt.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledById: input.userId,
      cancellationReason: input.reason,
    },
  });

  await writeAuditLog({
    mandalId: input.mandalId,
    userId: input.userId,
    action: AUDIT_ACTIONS.RECEIPT_CANCELLED,
    entity: "Receipt",
    entityId: receipt.id,
    metadata: { reason: input.reason },
  });

  return updated;
}

export async function listReceipts(input: {
  mandalId: string;
  query?: string;
  page: number;
  pageSize: number;
  createdById?: string;
}) {
  const where = {
    mandalId: input.mandalId,
    ...(input.createdById ? { createdById: input.createdById } : {}),
    ...(input.query
      ? {
          OR: [
            { receiptNumber: { contains: input.query, mode: "insensitive" as const } },
            { transactionId: { contains: input.query, mode: "insensitive" as const } },
            { donor: { fullName: { contains: input.query, mode: "insensitive" as const } } },
            { donor: { mobile: { contains: input.query } } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.receipt.count({ where }),
    prisma.receipt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      include: {
        donor: true,
        createdBy: { select: { name: true } },
      },
    }),
  ]);

  return {
    total,
    page: input.page,
    pageSize: input.pageSize,
    items: items.map((receipt) => ({
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      donorName: receipt.donor.fullName,
      mobile: receipt.donor.mobile,
      amount: receipt.amount.toString(),
      amountFormatted: formatINR(receipt.amount.toString()),
      paymentMethod: receipt.paymentMethod,
      status: receipt.status,
      receiptDate: receipt.receiptDate,
      createdBy: receipt.createdBy.name,
      verificationToken: receipt.verificationToken,
      pdfUrl: receipt.pdfUrl,
    })),
  };
}

export async function getReceiptForMandal(mandalId: string, receiptId: string) {
  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, mandalId },
    include: {
      donor: true,
      createdBy: { select: { name: true } },
      mandal: true,
      festival: true,
    },
  });
  if (!receipt) throw new AppError(ErrorCodes.NOT_FOUND, 404);
  return receipt;
}

export async function getPublicReceipt(token: string) {
  const receipt = await prisma.receipt.findUnique({
    where: { verificationToken: token },
    include: {
      mandal: { select: { name: true, ganpatiYear: true, logoUrl: true } },
    },
  });
  if (!receipt) throw new AppError(ErrorCodes.NOT_FOUND, 404);

  return {
    mandalName: receipt.mandal.name,
    ganpatiYear: receipt.mandal.ganpatiYear,
    logoUrl: receipt.mandal.logoUrl,
    receiptNumber: receipt.receiptNumber,
    date: receipt.receiptDate,
    amount: formatINR(receipt.amount.toString()),
    paymentMethod: receipt.paymentMethod,
    status: receipt.status,
  };
}

export async function saveReceiptPdfUrl(receiptId: string, pdfUrl: string) {
  await prisma.receipt.update({
    where: { id: receiptId },
    data: { pdfUrl },
  });
}
