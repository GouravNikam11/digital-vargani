import { prisma } from "@/lib/db";
import type { AuditAction } from "@/lib/audit-actions";
import type { Prisma } from "@/generated/prisma/client";

export async function writeAuditLog(input: {
  mandalId?: string | null;
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      mandalId: input.mandalId ?? undefined,
      userId: input.userId ?? undefined,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? undefined,
      metadata: input.metadata,
      ipAddress: input.ipAddress ?? undefined,
    },
  });
}
