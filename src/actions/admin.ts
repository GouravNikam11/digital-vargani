"use server";

import { requireSuperAdmin } from "@/lib/auth/tenant";
import { activateMandal, adminChangePlan, extendTrial, suspendMandal } from "@/services/admin.service";

export async function adminSuspendAction(mandalId: string) {
  const session = await requireSuperAdmin();
  await suspendMandal(mandalId, session.userId);
}

export async function adminActivateAction(mandalId: string) {
  const session = await requireSuperAdmin();
  await activateMandal(mandalId, session.userId);
}

export async function adminChangePlanAction(mandalId: string, planId: string) {
  const session = await requireSuperAdmin();
  await adminChangePlan(mandalId, planId, session.userId);
}

export async function adminExtendTrialAction(mandalId: string) {
  const session = await requireSuperAdmin();
  await extendTrial(mandalId, 14, session.userId);
}
