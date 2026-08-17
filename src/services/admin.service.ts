import { prisma } from "@/lib/db";
import { toMoney, formatINR, addMoney } from "@/lib/money";
import { AppError, ErrorCodes } from "@/lib/errors";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { writeAuditLog } from "@/services/audit.service";
import { changeMandalPlan } from "@/services/subscription.service";
import { startOfMonth, endOfMonth } from "date-fns";

export async function getAdminOverview() {
  const now = new Date();
  const [
    totalMandals,
    activeMandals,
    trialMandals,
    paidMandals,
    totalReceipts,
    collectionAgg,
    expenseAgg,
    paidSubscriptions,
  ] = await Promise.all([
    prisma.mandal.count(),
    prisma.mandal.count({ where: { status: "ACTIVE" } }),
    prisma.mandal.count({ where: { status: "TRIAL" } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.receipt.count(),
    prisma.receipt.aggregate({
      where: { status: "ACTIVE" },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { status: "APPROVED", deletedAt: null },
      _sum: { amount: true },
    }),
    prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        startedAt: { gte: startOfMonth(now), lte: endOfMonth(now) },
      },
      include: { plan: true },
    }),
  ]);

  const monthlyRevenue = paidSubscriptions.reduce(
    (sum, item) => addMoney(sum, item.plan.price.toString()),
    toMoney("0"),
  );

  return {
    totalMandals,
    activeMandals,
    trialMandals,
    paidMandals,
    totalReceipts,
    totalCollection: formatINR(collectionAgg._sum.amount?.toString() ?? "0"),
    totalExpenses: formatINR(expenseAgg._sum.amount?.toString() ?? "0"),
    monthlyRevenue: formatINR(monthlyRevenue),
  };
}

export async function listAdminMandals() {
  const mandals = await prisma.mandal.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscription: { include: { plan: true } },
      usageRecords: true,
      _count: { select: { receipts: true, members: true } },
    },
  });

  return mandals.map((mandal) => ({
    id: mandal.id,
    name: mandal.name,
    slug: mandal.slug,
    city: mandal.city,
    status: mandal.status,
    plan: mandal.subscription?.plan.nameMr ?? "-",
    receipts: mandal._count.receipts,
    members: mandal._count.members,
    lastActivity: mandal.updatedAt,
    usage: mandal.usageRecords.reduce((sum, row) => sum + row.receiptCount, 0),
  }));
}

export async function suspendMandal(mandalId: string, actorUserId: string) {
  await prisma.mandal.update({
    where: { id: mandalId },
    data: { status: "SUSPENDED" },
  });
  await prisma.subscription.update({
    where: { mandalId },
    data: { status: "SUSPENDED" },
  });
  await writeAuditLog({
    mandalId,
    userId: actorUserId,
    action: AUDIT_ACTIONS.MANDAL_SUSPENDED,
    entity: "Mandal",
    entityId: mandalId,
  });
}

export async function activateMandal(mandalId: string, actorUserId: string) {
  await prisma.mandal.update({
    where: { id: mandalId },
    data: { status: "ACTIVE" },
  });
  await prisma.subscription.update({
    where: { mandalId },
    data: { status: "ACTIVE" },
  });
  await writeAuditLog({
    mandalId,
    userId: actorUserId,
    action: AUDIT_ACTIONS.MANDAL_ACTIVATED,
    entity: "Mandal",
    entityId: mandalId,
  });
}

export async function adminChangePlan(mandalId: string, planId: string, actorUserId: string) {
  return changeMandalPlan({ mandalId, planId, actorUserId, status: "ACTIVE" });
}

export async function extendTrial(mandalId: string, days: number, actorUserId: string) {
  const subscription = await prisma.subscription.findUnique({ where: { mandalId } });
  if (!subscription) throw new AppError(ErrorCodes.NOT_FOUND, 404);
  const base = subscription.trialEndsAt && subscription.trialEndsAt > new Date()
    ? subscription.trialEndsAt
    : new Date();
  const trialEndsAt = new Date(base);
  trialEndsAt.setDate(trialEndsAt.getDate() + days);

  await prisma.subscription.update({
    where: { mandalId },
    data: { status: "TRIAL", trialEndsAt, expiresAt: trialEndsAt },
  });
  await prisma.mandal.update({
    where: { id: mandalId },
    data: { status: "TRIAL" },
  });
  await writeAuditLog({
    mandalId,
    userId: actorUserId,
    action: AUDIT_ACTIONS.SUBSCRIPTION_CHANGED,
    entity: "Subscription",
    entityId: subscription.id,
    metadata: { extendTrialDays: days },
  });
}
