import { z } from "zod";

export const mobileSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Invalid mobile");

export const pinCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Invalid PIN code");

export const moneySchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Invalid amount")
  .refine((value) => Number(value) > 0, "Amount must be greater than zero");

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(120),
  password: z.string().min(8).max(100),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    mobile: mobileSchema,
    email: z.string().trim().email().optional().or(z.literal("")),
    password: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const onboardingMandalSchema = z.object({
  name: z.string().trim().min(3).max(120),
  ganpatiYear: z.coerce.number().int().min(2020).max(2100),
  address: z.string().trim().max(250).optional(),
  city: z.string().trim().max(80).optional(),
  district: z.string().trim().max(80).optional(),
  taluka: z.string().trim().max(80).optional(),
  pinCode: pinCodeSchema.optional().or(z.literal("")),
  mobile: mobileSchema,
  email: z.string().trim().email().optional().or(z.literal("")),
});

export const onboardingFestivalSchema = z.object({
  name: z.string().trim().min(3).max(120),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  year: z.coerce.number().int().min(2020).max(2100),
});

export const receiptSettingsSchema = z.object({
  receiptPrefix: z
    .string()
    .trim()
    .min(1)
    .max(8)
    .regex(/^[A-Za-z0-9]+$/),
  startingReceiptNumber: z.coerce.number().int().min(1).max(999999),
  receiptTemplate: z.enum(["TRADITIONAL", "MODERN", "PREMIUM"]),
  authorizedSignatory: z.string().trim().max(80).optional(),
  treasurerName: z.string().trim().max(80).optional(),
});

export const inviteMemberSchema = z.object({
  name: z.string().trim().min(2).max(80),
  mobile: mobileSchema,
  role: z.enum(["ADMIN", "TREASURER", "VOLUNTEER"]),
});

export const donorSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  mobile: mobileSchema,
  address: z.string().trim().max(250).optional(),
  area: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const receiptSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  mobile: mobileSchema,
  address: z.string().trim().max(250).optional(),
  area: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  amount: moneySchema,
  paymentMethod: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"]),
  transactionId: z.string().trim().max(80).optional(),
  chequeNumber: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(500).optional(),
  donorId: z.string().uuid().optional(),
});

export const expenseSchema = z.object({
  title: z.string().trim().min(2).max(120),
  categoryId: z.string().uuid(),
  amount: moneySchema,
  expenseDate: z.string().min(1),
  paymentMethod: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"]),
  vendor: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const pendingSchema = z.object({
  donorId: z.string().uuid(),
  expectedAmount: moneySchema,
  dueDate: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  query: z.string().trim().max(80).optional(),
});
