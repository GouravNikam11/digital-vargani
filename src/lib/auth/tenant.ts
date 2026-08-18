import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AppError, ErrorCodes } from "@/lib/errors";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "@/lib/auth/session";
import type { MandalRole } from "@/lib/permissions";
import { can, type PermissionModule } from "@/lib/permissions";

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 401);
  }
  return session;
}

export async function requireMandalContext() {
  const session = await requireSession();
  if (session.isSuperAdmin && !session.mandalId) {
    throw new AppError(ErrorCodes.FORBIDDEN, 403);
  }
  if (!session.mandalId || !session.role) {
    throw new AppError(ErrorCodes.ONBOARDING_REQUIRED, 403);
  }

  const mandal = await prisma.mandal.findUnique({
    where: { id: session.mandalId },
    select: { id: true, status: true, onboardingCompleted: true, name: true, ganpatiYear: true },
  });

  if (!mandal) {
    throw new AppError(ErrorCodes.NOT_FOUND, 404);
  }
  if (mandal.status === "SUSPENDED") {
    throw new AppError(ErrorCodes.MANDAL_SUSPENDED, 403);
  }

  return { session, mandal, role: session.role as MandalRole };
}

export async function requirePermission(module: PermissionModule, action: string) {
  const context = await requireMandalContext();
  if (!can(context.role, module, action)) {
    redirect("/dashboard");
  }
  return context;
}

export async function requireSuperAdmin() {
  const session = await requireSession();
  if (!session.isSuperAdmin) {
    throw new AppError(ErrorCodes.FORBIDDEN, 403);
  }
  return session;
}

export function assertTenantId(sessionMandalId: string, resourceMandalId: string) {
  if (sessionMandalId !== resourceMandalId) {
    throw new AppError(ErrorCodes.FORBIDDEN, 403);
  }
}
