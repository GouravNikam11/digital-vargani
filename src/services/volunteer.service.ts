import { prisma } from "@/lib/db";
import { formatINR, toMoney } from "@/lib/money";

export async function listVolunteers(mandalId: string) {
  const members = await prisma.mandalMember.findMany({
    where: { mandalId, isActive: true },
    include: {
      user: { select: { id: true, name: true, mobile: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const festival = await prisma.festival.findFirst({
    where: { mandalId, isActive: true },
  });

  const grouped = festival
    ? await prisma.receipt.groupBy({
        by: ["createdById"],
        where: { mandalId, festivalId: festival.id, status: "ACTIVE" },
        _sum: { amount: true },
        _count: { _all: true },
      })
    : [];
  const stats = new Map(grouped.map((row) => [row.createdById, row]));

  return members.map((member) => {
    const row = stats.get(member.userId);
    const amount = toMoney(row?._sum.amount?.toString() ?? "0");
    return {
      id: member.id,
      userId: member.user.id,
      name: member.user.name,
      mobile: member.user.mobile,
      role: member.role,
      receiptCount: row?._count._all ?? 0,
      collection: formatINR(amount),
    };
  });
}
