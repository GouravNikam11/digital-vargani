"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/tenant";
import { donorSchema, expenseSchema, pendingSchema } from "@/lib/validations";
import { upsertDonor } from "@/services/receipt.service";
import { createExpense, createExpenseCategory } from "@/services/expense.service";
import { createPendingCollection, markPendingCollected } from "@/services/pending.service";
import { updateMandalSettings } from "@/services/mandal.service";
import { putFile } from "@/lib/storage";
import { changeMandalPlan } from "@/services/subscription.service";
import { isAppError } from "@/lib/errors";
import type { ReceiptTemplateSlug } from "@/generated/prisma/enums";

export async function saveDonorAction(input: unknown) {
  const { mandal } = await requirePermission("donors", "manage");
  const parsed = donorSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "VALIDATION" };
  const donor = await upsertDonor({ mandalId: mandal.id, ...parsed.data });
  revalidatePath("/donors");
  return { ok: true as const, id: donor.id };
}

export async function createExpenseAction(input: unknown) {
  const { session, mandal } = await requirePermission("expenses", "create");
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "VALIDATION" };
  try {
    const expense = await createExpense({
      mandalId: mandal.id,
      userId: session.userId,
      ...parsed.data,
    });
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { ok: true as const, id: expense.id };
  } catch (error) {
    if (isAppError(error)) return { ok: false as const, error: error.code };
    return { ok: false as const, error: "GENERIC" };
  }
}

export async function createCategoryAction(nameMr: string, nameEn: string) {
  const { mandal } = await requirePermission("expenses", "manage");
  await createExpenseCategory(mandal.id, { nameMr, nameEn });
  revalidatePath("/expenses");
  return { ok: true as const };
}

export async function createPendingAction(input: unknown) {
  const { session, mandal } = await requirePermission("pending", "manage");
  const parsed = pendingSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "VALIDATION" };
  await createPendingCollection({
    mandalId: mandal.id,
    userId: session.userId,
    ...parsed.data,
  });
  revalidatePath("/pending");
  return { ok: true as const };
}

export async function collectPendingAction(pendingId: string) {
  const { session, mandal } = await requirePermission("pending", "collect");
  await markPendingCollected({
    mandalId: mandal.id,
    userId: session.userId,
    pendingId,
  });
  revalidatePath("/pending");
  return { ok: true as const };
}

export async function saveSettingsAction(formData: FormData) {
  const { mandal } = await requirePermission("branding", "manage");
  const photo = formData.get("ganpatiPhoto");
  let ganpatiPhotoUrl: string | undefined;

  if (photo instanceof File && photo.size > 0) {
    const extension = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    const stored = await putFile(
      `mandals/${mandal.id}/ganpati.${extension}`,
      Buffer.from(await photo.arrayBuffer()),
      photo.type,
    );
    ganpatiPhotoUrl = stored.url;
  }

  await updateMandalSettings(mandal.id, {
    receiptPrefix: String(formData.get("receiptPrefix") ?? ""),
    receiptTemplate: String(formData.get("receiptTemplate") ?? "TRADITIONAL") as ReceiptTemplateSlug,
    authorizedSignatory: String(formData.get("authorizedSignatory") ?? ""),
    treasurerName: String(formData.get("treasurerName") ?? ""),
    footerMessage: String(formData.get("footerMessage") ?? ""),
    showPublicFinancials: formData.get("showPublicFinancials") === "on",
    ganpatiPhotoUrl,
  });
  revalidatePath("/settings");
  revalidatePath("/receipts");
  return { ok: true as const };
}

export async function choosePlanAction(planId: string) {
  const { session, mandal } = await requirePermission("subscription", "manage");
  await changeMandalPlan({
    mandalId: mandal.id,
    planId,
    actorUserId: session.userId,
    status: "ACTIVE",
  });
  revalidatePath("/subscription");
  return { ok: true as const };
}
