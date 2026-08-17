-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MandalStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MandalRole" AS ENUM ('ADMIN', 'TREASURER', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PendingCollectionStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('FESTIVAL', 'YEARLY');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'WHATSAPP', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "ReceiptTemplateSlug" AS ENUM ('TRADITIONAL', 'MODERN', 'PREMIUM');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'mr',
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandals" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ganpatiYear" INTEGER NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "district" TEXT,
    "taluka" TEXT,
    "pinCode" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "status" "MandalStatus" NOT NULL DEFAULT 'TRIAL',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "festivals" (
    "id" UUID NOT NULL,
    "mandalId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "year" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "festivals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandal_members" (
    "id" UUID NOT NULL,
    "mandalId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "MandalRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandal_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandal_settings" (
    "id" UUID NOT NULL,
    "mandalId" UUID NOT NULL,
    "receiptPrefix" TEXT NOT NULL DEFAULT 'GM',
    "nextReceiptNumber" INTEGER NOT NULL DEFAULT 1,
    "receiptTemplate" "ReceiptTemplateSlug" NOT NULL DEFAULT 'TRADITIONAL',
    "authorizedSignatory" TEXT,
    "treasurerName" TEXT,
    "footerMessage" TEXT,
    "showPublicFinancials" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandal_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donors" (
    "id" UUID NOT NULL,
    "mandalId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "address" TEXT,
    "area" TEXT,
    "city" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" UUID NOT NULL,
    "mandalId" UUID NOT NULL,
    "festivalId" UUID NOT NULL,
    "donorId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "verificationToken" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "amountInWordsMr" TEXT NOT NULL,
    "amountInWordsEn" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "transactionId" TEXT,
    "chequeNumber" TEXT,
    "notes" TEXT,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'ACTIVE',
    "pdfUrl" TEXT,
    "receiptDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" UUID,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "receiptId" UUID NOT NULL,
    "mandalId" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "transactionId" TEXT,
    "chequeNumber" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" UUID NOT NULL,
    "mandalId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameMr" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "mandalId" UUID NOT NULL,
    "festivalId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "vendor" TEXT,
    "notes" TEXT,
    "billUrl" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_collections" (
    "id" UUID NOT NULL,
    "mandalId" UUID NOT NULL,
    "festivalId" UUID NOT NULL,
    "donorId" UUID NOT NULL,
    "assignedToId" UUID,
    "createdById" UUID NOT NULL,
    "expectedAmount" DECIMAL(14,2) NOT NULL,
    "collectedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "status" "PendingCollectionStatus" NOT NULL DEFAULT 'PENDING',
    "collectedReceiptId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_templates" (
    "id" UUID NOT NULL,
    "slug" "ReceiptTemplateSlug" NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameMr" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameMr" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "billingPeriod" "BillingPeriod" NOT NULL DEFAULT 'FESTIVAL',
    "receiptLimit" INTEGER,
    "volunteerLimit" INTEGER,
    "features" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "mandalId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" UUID NOT NULL,
    "mandalId" UUID NOT NULL,
    "festivalId" UUID,
    "receiptCount" INTEGER NOT NULL DEFAULT 0,
    "volunteerCount" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "mandalId" UUID,
    "userId" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_pages" (
    "id" UUID NOT NULL,
    "mandalId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "showFinancialSummary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "mandalId" UUID,
    "userId" UUID,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");

-- CreateIndex
CREATE INDEX "users_mobile_idx" ON "users"("mobile");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mandals_slug_key" ON "mandals"("slug");

-- CreateIndex
CREATE INDEX "mandals_status_idx" ON "mandals"("status");

-- CreateIndex
CREATE INDEX "mandals_ganpatiYear_idx" ON "mandals"("ganpatiYear");

-- CreateIndex
CREATE INDEX "festivals_mandalId_isActive_idx" ON "festivals"("mandalId", "isActive");

-- CreateIndex
CREATE INDEX "festivals_mandalId_year_idx" ON "festivals"("mandalId", "year");

-- CreateIndex
CREATE INDEX "mandal_members_userId_idx" ON "mandal_members"("userId");

-- CreateIndex
CREATE INDEX "mandal_members_mandalId_role_isActive_idx" ON "mandal_members"("mandalId", "role", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "mandal_members_mandalId_userId_key" ON "mandal_members"("mandalId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "mandal_settings_mandalId_key" ON "mandal_settings"("mandalId");

-- CreateIndex
CREATE INDEX "donors_mandalId_fullName_idx" ON "donors"("mandalId", "fullName");

-- CreateIndex
CREATE INDEX "donors_mandalId_area_idx" ON "donors"("mandalId", "area");

-- CreateIndex
CREATE INDEX "donors_mandalId_isActive_idx" ON "donors"("mandalId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "donors_mandalId_mobile_key" ON "donors"("mandalId", "mobile");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_verificationToken_key" ON "receipts"("verificationToken");

-- CreateIndex
CREATE INDEX "receipts_mandalId_status_idx" ON "receipts"("mandalId", "status");

-- CreateIndex
CREATE INDEX "receipts_mandalId_receiptDate_idx" ON "receipts"("mandalId", "receiptDate");

-- CreateIndex
CREATE INDEX "receipts_mandalId_createdById_idx" ON "receipts"("mandalId", "createdById");

-- CreateIndex
CREATE INDEX "receipts_mandalId_paymentMethod_idx" ON "receipts"("mandalId", "paymentMethod");

-- CreateIndex
CREATE INDEX "receipts_festivalId_status_idx" ON "receipts"("festivalId", "status");

-- CreateIndex
CREATE INDEX "receipts_donorId_idx" ON "receipts"("donorId");

-- CreateIndex
CREATE INDEX "receipts_verificationToken_idx" ON "receipts"("verificationToken");

-- CreateIndex
CREATE INDEX "receipts_transactionId_idx" ON "receipts"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_mandalId_receiptNumber_key" ON "receipts"("mandalId", "receiptNumber");

-- CreateIndex
CREATE INDEX "payments_mandalId_method_idx" ON "payments"("mandalId", "method");

-- CreateIndex
CREATE INDEX "payments_receiptId_idx" ON "payments"("receiptId");

-- CreateIndex
CREATE INDEX "expense_categories_mandalId_isActive_sortOrder_idx" ON "expense_categories"("mandalId", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_mandalId_slug_key" ON "expense_categories"("mandalId", "slug");

-- CreateIndex
CREATE INDEX "expenses_mandalId_status_deletedAt_idx" ON "expenses"("mandalId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "expenses_mandalId_expenseDate_idx" ON "expenses"("mandalId", "expenseDate");

-- CreateIndex
CREATE INDEX "expenses_festivalId_status_idx" ON "expenses"("festivalId", "status");

-- CreateIndex
CREATE INDEX "expenses_categoryId_idx" ON "expenses"("categoryId");

-- CreateIndex
CREATE INDEX "pending_collections_mandalId_status_idx" ON "pending_collections"("mandalId", "status");

-- CreateIndex
CREATE INDEX "pending_collections_mandalId_assignedToId_idx" ON "pending_collections"("mandalId", "assignedToId");

-- CreateIndex
CREATE INDEX "pending_collections_donorId_idx" ON "pending_collections"("donorId");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_templates_slug_key" ON "receipt_templates"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_slug_key" ON "subscription_plans"("slug");

-- CreateIndex
CREATE INDEX "subscription_plans_isActive_sortOrder_idx" ON "subscription_plans"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_mandalId_key" ON "subscriptions"("mandalId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_planId_idx" ON "subscriptions"("planId");

-- CreateIndex
CREATE INDEX "usage_records_mandalId_idx" ON "usage_records"("mandalId");

-- CreateIndex
CREATE UNIQUE INDEX "usage_records_mandalId_festivalId_key" ON "usage_records"("mandalId", "festivalId");

-- CreateIndex
CREATE INDEX "audit_logs_mandalId_createdAt_idx" ON "audit_logs"("mandalId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "public_pages_mandalId_key" ON "public_pages"("mandalId");

-- CreateIndex
CREATE UNIQUE INDEX "public_pages_slug_key" ON "public_pages"("slug");

-- CreateIndex
CREATE INDEX "notifications_userId_status_idx" ON "notifications"("userId", "status");

-- CreateIndex
CREATE INDEX "notifications_mandalId_createdAt_idx" ON "notifications"("mandalId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- AddForeignKey
ALTER TABLE "mandals" ADD CONSTRAINT "mandals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "festivals" ADD CONSTRAINT "festivals_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "mandals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandal_members" ADD CONSTRAINT "mandal_members_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "mandals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandal_members" ADD CONSTRAINT "mandal_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandal_settings" ADD CONSTRAINT "mandal_settings_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "mandals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donors" ADD CONSTRAINT "donors_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "mandals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "mandals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_festivalId_fkey" FOREIGN KEY ("festivalId") REFERENCES "festivals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "mandals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "mandals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "mandals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_festivalId_fkey" FOREIGN KEY ("festivalId") REFERENCES "festivals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_collections" ADD CONSTRAINT "pending_collections_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "mandals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_collections" ADD CONSTRAINT "pending_collections_festivalId_fkey" FOREIGN KEY ("festivalId") REFERENCES "festivals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_collections" ADD CONSTRAINT "pending_collections_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_collections" ADD CONSTRAINT "pending_collections_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_collections" ADD CONSTRAINT "pending_collections_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "mandals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "mandals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_festivalId_fkey" FOREIGN KEY ("festivalId") REFERENCES "festivals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "mandals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_pages" ADD CONSTRAINT "public_pages_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "mandals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_mandalId_fkey" FOREIGN KEY ("mandalId") REFERENCES "mandals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

