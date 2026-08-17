"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { completeOnboarding, inviteMember } from "@/services/mandal.service";
import { inviteMemberSchema, onboardingFestivalSchema, onboardingMandalSchema, receiptSettingsSchema } from "@/lib/validations";
import { requireSession } from "@/lib/auth/tenant";
import { signSession, sessionCookieOptions } from "@/lib/auth/session";
import { isAppError } from "@/lib/errors";
import type { ReceiptTemplateSlug } from "@/generated/prisma/enums";
import type { MandalRole } from "@/lib/permissions";

export async function completeOnboardingAction(input: {
  mandal: unknown;
  festival: unknown;
  settings: unknown;
  invites: unknown;
}) {
  const session = await requireSession();
  const mandal = onboardingMandalSchema.safeParse(input.mandal);
  const festival = onboardingFestivalSchema.safeParse(input.festival);
  const settings = receiptSettingsSchema.safeParse(input.settings);
  if (!mandal.success || !festival.success || !settings.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const invitesParsed = Array.isArray(input.invites)
    ? input.invites
        .map((invite) => inviteMemberSchema.safeParse(invite))
        .filter((item) => item.success)
        .map((item) => item.data)
    : [];

  try {
    const result = await completeOnboarding({
      userId: session.userId,
      mandal: {
        ...mandal.data,
        pinCode: mandal.data.pinCode || undefined,
        email: mandal.data.email || undefined,
      },
      festival: festival.data,
      settings: {
        ...settings.data,
        receiptTemplate: settings.data.receiptTemplate as ReceiptTemplateSlug,
      },
      invites: invitesParsed as Array<{ name: string; mobile: string; role: MandalRole }>,
    });

    const token = await signSession({
      ...session,
      mandalId: result.mandal.id,
      mandalName: result.mandal.name,
      role: "ADMIN",
      onboardingCompleted: true,
    });
    const jar = await cookies();
    const options = sessionCookieOptions();
    jar.set(options.name, token, options);
  } catch (error) {
    if (isAppError(error)) return { ok: false as const, error: error.code };
    return { ok: false as const, error: "GENERIC" };
  }

  redirect("/receipts/new");
}

export async function inviteVolunteerAction(formData: FormData) {
  const session = await requireSession();
  if (!session.mandalId) return { ok: false as const, error: "FORBIDDEN" };
  const parsed = inviteMemberSchema.safeParse({
    name: formData.get("name"),
    mobile: formData.get("mobile"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { ok: false as const, error: "VALIDATION" };
  await inviteMember({
    mandalId: session.mandalId,
    invitedById: session.userId,
    ...parsed.data,
  });
  return { ok: true as const };
}
