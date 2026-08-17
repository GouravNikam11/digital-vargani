import { prisma } from "@/lib/db";
import { AppError, ErrorCodes } from "@/lib/errors";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { writeAuditLog } from "@/services/audit.service";
import { remainingReceipts } from "@/lib/subscription-limits";
import { getActiveFestival } from "@/services/finance.service";

export async function listPlans() {
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getMandalSubscription(mandalId: string) {
  const festival = await getActiveFestival(mandalId);
  const subscription = await prisma.subscription.findUnique({
    where: { mandalId },
    include: { plan: true },
  });
  if (!subscription) throw new AppError(ErrorCodes.NOT_FOUND, 404);

  const usage = festival
    ? await prisma.usageRecord.findUnique({
        where: { mandalId_festivalId: { mandalId, festivalId: festival.id } },
      })
    : null;

  return {
    subscription,
    usageCount: usage?.receiptCount ?? 0,
    remaining: remainingReceipts({
      currentReceipts: usage?.receiptCount ?? 0,
      receiptLimit: subscription.plan.receiptLimit,
    }),
  };
}

export async function changeMandalPlan(input: {
  mandalId: string;
  planId: string;
  actorUserId: string;
  status?: "TRIAL" | "ACTIVE";
}) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: input.planId } });
  if (!plan || !plan.isActive) throw new AppError(ErrorCodes.NOT_FOUND, 404);

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 12);

  const subscription = await prisma.subscription.update({
    where: { mandalId: input.mandalId },
    data: {
      planId: plan.id,
      status: input.status ?? "ACTIVE",
      startedAt: new Date(),
      expiresAt,
    },
    include: { plan: true },
  });

  await prisma.mandal.update({
    where: { id: input.mandalId },
    data: { status: input.status === "TRIAL" ? "TRIAL" : "ACTIVE" },
  });

  await writeAuditLog({
    mandalId: input.mandalId,
    userId: input.actorUserId,
    action: AUDIT_ACTIONS.SUBSCRIPTION_CHANGED,
    entity: "Subscription",
    entityId: subscription.id,
    metadata: { plan: plan.slug },
  });

  return subscription;
}
