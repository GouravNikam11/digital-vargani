import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { DEFAULT_EXPENSE_CATEGORIES, PLAN_SLUGS, TRIAL_DAYS } from "@/config/constants";
import { slugify } from "@/lib/slug";
import { AppError, ErrorCodes } from "@/lib/errors";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { writeAuditLog } from "@/services/audit.service";
import { normalizeMobile } from "@/lib/utils";
import type { MandalRole } from "@/lib/permissions";
import type { ReceiptTemplateSlug } from "@/generated/prisma/enums";

async function uniqueSlug(base: string) {
  const root = slugify(base) || `mandal-${nanoid(6)}`;
  let candidate = root;
  for (let i = 0; i < 8; i += 1) {
    const exists = await prisma.mandal.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
    candidate = `${root}-${nanoid(4)}`;
  }
  return `${root}-${nanoid(6)}`;
}

export async function completeOnboarding(input: {
  userId: string;
  mandal: {
    name: string;
    ganpatiYear: number;
    address?: string;
    city?: string;
    district?: string;
    taluka?: string;
    pinCode?: string;
    mobile: string;
    email?: string;
    logoUrl?: string;
  };
  festival: {
    name: string;
    startDate: string;
    endDate: string;
    year: number;
  };
  settings: {
    receiptPrefix: string;
    startingReceiptNumber: number;
    receiptTemplate: ReceiptTemplateSlug;
    authorizedSignatory?: string;
    treasurerName?: string;
  };
  invites?: Array<{ name: string; mobile: string; role: MandalRole }>;
}) {
  const existingMembership = await prisma.mandalMember.findFirst({
    where: { userId: input.userId, isActive: true },
  });
  if (existingMembership) {
    throw new AppError(ErrorCodes.DUPLICATE, 409);
  }

  const freePlan = await prisma.subscriptionPlan.findUnique({
    where: { slug: PLAN_SLUGS.FREE },
  });
  if (!freePlan) {
    throw new AppError("PLAN_MISSING", 500);
  }

  const slug = await uniqueSlug(input.mandal.name);
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  const result = await prisma.$transaction(async (tx) => {
    const mandal = await tx.mandal.create({
      data: {
        name: input.mandal.name.trim(),
        slug,
        ganpatiYear: input.mandal.ganpatiYear,
        address: input.mandal.address || null,
        city: input.mandal.city || null,
        district: input.mandal.district || null,
        taluka: input.mandal.taluka || null,
        pinCode: input.mandal.pinCode || null,
        mobile: input.mandal.mobile,
        email: input.mandal.email || null,
        logoUrl: input.mandal.logoUrl || null,
        status: "TRIAL",
        onboardingCompleted: true,
        createdById: input.userId,
      },
    });

    const festival = await tx.festival.create({
      data: {
        mandalId: mandal.id,
        name: input.festival.name.trim(),
        startDate: new Date(input.festival.startDate),
        endDate: new Date(input.festival.endDate),
        year: input.festival.year,
        isActive: true,
      },
    });

    await tx.mandalSettings.create({
      data: {
        mandalId: mandal.id,
        receiptPrefix: input.settings.receiptPrefix.toUpperCase(),
        nextReceiptNumber: input.settings.startingReceiptNumber,
        receiptTemplate: input.settings.receiptTemplate,
        authorizedSignatory: input.settings.authorizedSignatory || null,
        treasurerName: input.settings.treasurerName || null,
        footerMessage: "आपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद! गणपती बाप्पा मोरया!",
      },
    });

    await tx.mandalMember.create({
      data: {
        mandalId: mandal.id,
        userId: input.userId,
        role: "ADMIN",
        isActive: true,
        joinedAt: new Date(),
      },
    });

    await tx.expenseCategory.createMany({
      data: DEFAULT_EXPENSE_CATEGORIES.map((category) => ({
        mandalId: mandal.id,
        slug: category.slug,
        nameEn: category.nameEn,
        nameMr: category.nameMr,
        isDefault: true,
        sortOrder: category.sortOrder,
      })),
    });

    await tx.publicPage.create({
      data: {
        mandalId: mandal.id,
        slug,
        isEnabled: false,
        showFinancialSummary: false,
      },
    });

    await tx.subscription.create({
      data: {
        mandalId: mandal.id,
        planId: freePlan.id,
        status: "TRIAL",
        trialEndsAt,
        expiresAt: trialEndsAt,
      },
    });

    await tx.usageRecord.create({
      data: {
        mandalId: mandal.id,
        festivalId: festival.id,
        receiptCount: 0,
        volunteerCount: 1,
        periodStart: new Date(),
      },
    });

    return { mandal, festival };
  });

  if (input.invites?.length) {
    for (const invite of input.invites) {
      await inviteMember({
        mandalId: result.mandal.id,
        invitedById: input.userId,
        name: invite.name,
        mobile: invite.mobile,
        role: invite.role,
      });
    }
  }

  await writeAuditLog({
    mandalId: result.mandal.id,
    userId: input.userId,
    action: AUDIT_ACTIONS.MANDAL_CREATED,
    entity: "Mandal",
    entityId: result.mandal.id,
  });

  return result;
}

export async function inviteMember(input: {
  mandalId: string;
  invitedById: string;
  name: string;
  mobile: string;
  role: MandalRole;
}) {
  const mobile = normalizeMobile(input.mobile);
  const tempPassword = `Vargani@${mobile.slice(-4)}`;

  const user = await prisma.$transaction(async (tx) => {
    let existing = await tx.user.findUnique({ where: { mobile } });
    if (!existing) {
      existing = await tx.user.create({
        data: {
          name: input.name.trim(),
          mobile,
          passwordHash: await hashPassword(tempPassword),
          mustChangePassword: true,
          language: "mr",
        },
      });
    }

    const membership = await tx.mandalMember.findUnique({
      where: { mandalId_userId: { mandalId: input.mandalId, userId: existing.id } },
    });
    if (!membership) {
      await tx.mandalMember.create({
        data: {
          mandalId: input.mandalId,
          userId: existing.id,
          role: input.role,
          isActive: true,
          joinedAt: new Date(),
        },
      });
    }

    return existing;
  });

  await writeAuditLog({
    mandalId: input.mandalId,
    userId: input.invitedById,
    action: AUDIT_ACTIONS.MEMBER_ADDED,
    entity: "Member",
    entityId: user.id,
    metadata: { role: input.role, mobile },
  });

  return { userId: user.id, tempPassword };
}

export async function updateMandalSettings(mandalId: string, data: {
  authorizedSignatory?: string;
  treasurerName?: string;
  footerMessage?: string;
  receiptPrefix?: string;
  receiptTemplate?: ReceiptTemplateSlug;
  logoUrl?: string;
  ganpatiPhotoUrl?: string;
  showPublicFinancials?: boolean;
}) {
  await prisma.mandalSettings.update({
    where: { mandalId },
    data: {
      authorizedSignatory: data.authorizedSignatory,
      treasurerName: data.treasurerName,
      footerMessage: data.footerMessage,
      receiptPrefix: data.receiptPrefix?.toUpperCase(),
      receiptTemplate: data.receiptTemplate,
    },
  });

  if (data.logoUrl || data.ganpatiPhotoUrl || data.showPublicFinancials !== undefined) {
    await prisma.mandal.update({
      where: { id: mandalId },
      data: {
        ...(data.logoUrl ? { logoUrl: data.logoUrl } : {}),
        ...(data.ganpatiPhotoUrl ? { ganpatiPhotoUrl: data.ganpatiPhotoUrl } : {}),
      },
    });
    if (data.showPublicFinancials !== undefined) {
      await prisma.mandalSettings.update({
        where: { mandalId },
        data: { showPublicFinancials: data.showPublicFinancials },
      });
      await prisma.publicPage.update({
        where: { mandalId },
        data: { showFinancialSummary: data.showPublicFinancials },
      });
    }
  }
}
