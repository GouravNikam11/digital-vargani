import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { AppError, ErrorCodes } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { normalizeMobile } from "@/lib/utils";
import type { SessionPayload } from "@/lib/auth/session";
import type { MandalRole } from "@/lib/permissions";

function toSession(
  user: {
    id: string;
    name: string;
    email: string | null;
    mobile: string | null;
    language: string;
    isSuperAdmin: boolean;
  },
  membership?: {
    mandalId: string;
    role: MandalRole;
    mandal: { name: string; onboardingCompleted: boolean };
  } | null,
): SessionPayload {
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    language: user.language === "en" ? "en" : "mr",
    isSuperAdmin: user.isSuperAdmin,
    mandalId: membership?.mandalId ?? null,
    mandalName: membership?.mandal.name ?? null,
    role: membership?.role ?? null,
    onboardingCompleted: membership?.mandal.onboardingCompleted ?? false,
  };
}

export async function registerUser(input: {
  name: string;
  mobile: string;
  email?: string;
  password: string;
}) {
  const mobile = normalizeMobile(input.mobile);
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ mobile }, ...(input.email ? [{ email: input.email.toLowerCase() }] : [])],
    },
  });
  if (existing) {
    throw new AppError(ErrorCodes.DUPLICATE, 409, "Account already exists");
  }

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      mobile,
      email: input.email ? input.email.toLowerCase() : null,
      passwordHash: await hashPassword(input.password),
      language: "mr",
    },
  });

  return toSession(user);
}

export async function loginUser(input: { identifier: string; password: string; ip?: string }) {
  const limit = rateLimit(`login:${input.ip ?? "unknown"}:${input.identifier}`, 8, 10 * 60 * 1000);
  if (!limit.success) {
    throw new AppError("TOO_MANY", 429);
  }

  const identifier = input.identifier.trim();
  const mobile = normalizeMobile(identifier);
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { mobile },
      ],
      isActive: true,
    },
    include: {
      memberships: {
        where: { isActive: true },
        include: { mandal: { select: { name: true, onboardingCompleted: true, status: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 401);
  }

  const membership = user.memberships.find((item) => item.mandal.status !== "SUSPENDED") ?? user.memberships[0];

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return toSession(user, membership
    ? {
        mandalId: membership.mandalId,
        role: membership.role,
        mandal: membership.mandal,
      }
    : null);
}

export async function updateLanguage(userId: string, language: "mr" | "en") {
  await prisma.user.update({
    where: { id: userId },
    data: { language },
  });
}

export async function getSessionMemberships(userId: string) {
  return prisma.mandalMember.findMany({
    where: { userId, isActive: true },
    include: { mandal: { select: { id: true, name: true, status: true, onboardingCompleted: true } } },
  });
}
