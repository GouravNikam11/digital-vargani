"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/tenant";
import { receiptSchema } from "@/lib/validations";
import {
  cancelReceipt,
  createReceipt,
  findDonorByMobile,
  getReceiptForMandal,
  saveReceiptPdfUrl,
} from "@/services/receipt.service";
import { isAppError } from "@/lib/errors";
import { generateReceiptPdf } from "@/services/pdf.service";

export async function lookupDonorAction(mobile: string) {
  const { mandal } = await requirePermission("donors", "view");
  if (!mobile || mobile.length < 10) return null;
  const donor = await findDonorByMobile(mandal.id, mobile);
  if (!donor) return null;
  return {
    id: donor.id,
    fullName: donor.fullName,
    mobile: donor.mobile,
    address: donor.address,
    area: donor.area,
    city: donor.city,
  };
}

export async function createReceiptAction(input: unknown) {
  const { session, mandal } = await requirePermission("receipts", "create");
  const parsed = receiptSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "VALIDATION" };

  try {
    const created = await createReceipt({
      mandalId: mandal.id,
      userId: session.userId,
      volunteerName: session.name,
      ...parsed.data,
    });

    let pdfUrl: string | null = null;
    try {
      const pdf = await generateReceiptPdf(created.receipt.id, mandal.id);
      if (pdf?.url) {
        await saveReceiptPdfUrl(created.receipt.id, pdf.url);
        pdfUrl = pdf.url;
      }
    } catch (error) {
      console.error("PDF generation failed", error);
    }

    revalidatePath("/dashboard");
    revalidatePath("/receipts");
    return {
      ok: true as const,
      receiptId: created.receipt.id,
      receiptNumber: created.receipt.receiptNumber,
      verificationToken: created.receipt.verificationToken,
      pdfUrl,
    };
  } catch (error) {
    if (isAppError(error)) return { ok: false as const, error: error.code };
    return { ok: false as const, error: "GENERIC" };
  }
}

export async function cancelReceiptAction(receiptId: string, reason: string) {
  const { session, mandal } = await requirePermission("receipts", "cancel");
  try {
    await cancelReceipt({
      mandalId: mandal.id,
      userId: session.userId,
      receiptId,
      reason,
    });
    revalidatePath("/receipts");
    return { ok: true as const };
  } catch (error) {
    if (isAppError(error)) return { ok: false as const, error: error.code };
    return { ok: false as const, error: "GENERIC" };
  }
}

export async function ensureReceiptPdfAction(receiptId: string) {
  const { mandal } = await requirePermission("receipts", "view");
  try {
    const receipt = await getReceiptForMandal(mandal.id, receiptId);
    const pdf = await generateReceiptPdf(receipt.id, mandal.id);
    if (!pdf?.url) return { ok: false as const, error: "GENERIC" };

    await saveReceiptPdfUrl(receipt.id, pdf.url);
    revalidatePath(`/receipts/${receipt.id}`);
    return { ok: true as const, pdfUrl: pdf.url, receiptNumber: receipt.receiptNumber };
  } catch (error) {
    if (isAppError(error)) return { ok: false as const, error: error.code };
    return { ok: false as const, error: "GENERIC" };
  }
}
