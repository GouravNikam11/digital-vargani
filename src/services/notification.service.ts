import { prisma } from "@/lib/db";
import type { NotificationChannel } from "@/generated/prisma/enums";

export async function enqueueNotification(input: {
  mandalId?: string;
  userId?: string;
  channel: NotificationChannel;
  type: string;
  payload: Record<string, unknown>;
}) {
  return prisma.notification.create({
    data: {
      mandalId: input.mandalId,
      userId: input.userId,
      channel: input.channel,
      type: input.type,
      payload: input.payload as object,
      status: "PENDING",
    },
  });
}
