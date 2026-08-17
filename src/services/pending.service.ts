import { prisma } from "@/lib/db";
import { AppError, ErrorCodes } from "@/lib/errors";
import { formatINR, moneyToString, toMoney } from "@/lib/money";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { writeAuditLog } from "@/services/audit.service";
import { getActiveFestival } from "@/services/finance.service";
import type { PendingCollectionStatus } from "@/generated/prisma/enums";

export async function createPendingCollection(input: {
  mandalId: string;
  userId: string;
  donorId: string;
  expectedAmount: string;
  dueDate?: string;
  assignedToId?: string;
  notes?: string;
}) {
  const festival = await getActiveFestival(input.mandalId);
  if (!festival) throw new AppError("NO_FESTIVAL", 400);

  const donor = await prisma.donor.findFirst({
    where: { id: input.donorId, mandalId: input.mandalId },
  });
  if (!donor) throw new AppError(ErrorCodes.NOT_FOUND, 404);

  const pending = await prisma.pendingCollection.create({
    data: {
      mandalId: input.mandalId,
      festivalId: festival.id,
      donorId: donor.id,
      createdById: input.userId,
      assignedToId: input.assignedToId || null,
      expectedAmount: moneyToString(toMoney(input.expectedAmount)),
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      notes: input.notes || null,
    },
  });

  await writeAuditLog({
    mandalId: input.mandalId,
    userId: input.userId,
    action: AUDIT_ACTIONS.PENDING_CREATED,
    entity: "PendingCollection",
    entityId: pending.id,
  });

  return pending;
}

export async function listPendingCollections(input: {
  mandalId: string;
  assignedToId?: string;
  status?: PendingCollectionStatus;
  page: number;
  pageSize: number;
}) {
  const where = {
    mandalId: input.mandalId,
    ...(input.assignedToId ? { assignedToId: input.assignedToId } : {}),
    ...(input.status ? { status: input.status } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.pendingCollection.count({ where }),
    prisma.pendingCollection.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      include: {
        donor: true,
        assignedTo: { select: { name: true } },
      },
    }),
  ]);

  return {
    total,
    page: input.page,
    pageSize: input.pageSize,
    items: items.map((item) => ({
      id: item.id,
      donorName: item.donor.fullName,
      mobile: item.donor.mobile,
      expectedAmount: formatINR(item.expectedAmount.toString()),
      collectedAmount: formatINR(item.collectedAmount.toString()),
      dueDate: item.dueDate,
      status: item.status,
      assignedTo: item.assignedTo?.name ?? null,
      notes: item.notes,
    })),
  };
}

export async function markPendingCollected(input: {
  mandalId: string;
  userId: string;
  pendingId: string;
  collectedAmount?: string;
}) {
  const pending = await prisma.pendingCollection.findFirst({
    where: { id: input.pendingId, mandalId: input.mandalId },
  });
  if (!pending) throw new AppError(ErrorCodes.NOT_FOUND, 404);

  const collected = input.collectedAmount
    ? toMoney(input.collectedAmount)
    : toMoney(pending.expectedAmount.toString());
  const expected = toMoney(pending.expectedAmount.toString());
  const status = collected.gte(expected) ? "PAID" : "PARTIALLY_PAID";

  const updated = await prisma.pendingCollection.update({
    where: { id: pending.id },
    data: {
      collectedAmount: moneyToString(collected),
      status,
    },
  });

  await writeAuditLog({
    mandalId: input.mandalId,
    userId: input.userId,
    action: AUDIT_ACTIONS.PENDING_COLLECTED,
    entity: "PendingCollection",
    entityId: pending.id,
  });

  return updated;
}
