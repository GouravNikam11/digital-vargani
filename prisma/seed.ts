import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { DEFAULT_EXPENSE_CATEGORIES, PLAN_SLUGS } from "../src/config/constants";
import { formatReceiptNumber } from "../src/lib/receipt-number";
import { amountInWordsEn, amountInWordsMr } from "../src/lib/amount-in-words";
import { createPrismaAdapter, getCliDatabaseUrl } from "../src/lib/prisma-pg";

const connectionString = getCliDatabaseUrl();
if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is not set. Check your .env file.");
}

const prisma = new PrismaClient({ adapter: createPrismaAdapter(connectionString) });

const PASSWORD = "Vargani@2026";

const donorNames = [
  ["अमोल पाटील", "9876500001", "शिवाजी नगर"],
  ["रोहित देशमुख", "9876500002", "सारस्वती कॉलनी"],
  ["सचिन जाधव", "9876500003", "गणेश पेठ"],
  ["प्रिया कदम", "9876500004", "महात्मा फुले नगर"],
  ["सुनिल शिंदे", "9876500005", "शिवाजी नगर"],
  ["मेघना जोशी", "9876500006", "सारस्वती कॉलनी"],
  ["नितीन काळे", "9876500007", "औंध"],
  ["काजल मोरे", "9876500008", "कोथरूड"],
  ["विकास पवार", "9876500009", "हडपसर"],
  ["स्मिता भोसले", "9876500010", "पिंपरी"],
  ["गणेश सावंत", "9876500011", "चिंचवड"],
  ["ऋतुजा नाईक", "9876500012", "बावधन"],
  ["अजय कुलकर्णी", "9876500013", "डेक्कन"],
  ["पूजा घाटगे", "9876500014", "कोरेगाव पार्क"],
  ["महेश घाडगे", "9876500015", "वारजे"],
  ["स्नेहा ठाकरे", "9876500016", "सिंहगड रोड"],
  ["योगेश राणे", "9876500017", "कात्रज"],
  ["दीपाली मोहिते", "9876500018", "नवी पेठ"],
  ["संतोष घांग्रेकर", "9876500019", "सदाशिव पेठ"],
  ["आदिती इनामदार", "9876500020", "एरंडवणे"],
];

async function seedPlans() {
  const plans = [
    { slug: PLAN_SLUGS.FREE, nameEn: "Free", nameMr: "मोफत", price: "0", receiptLimit: 25, volunteerLimit: 3, sortOrder: 1, features: ["25 receipts"] },
    { slug: PLAN_SLUGS.BASIC, nameEn: "Basic", nameMr: "बेसिक", price: "499", receiptLimit: 250, volunteerLimit: 10, sortOrder: 2, features: ["250 receipts"] },
    { slug: PLAN_SLUGS.STANDARD, nameEn: "Standard", nameMr: "स्टँडर्ड", price: "999", receiptLimit: 750, volunteerLimit: 25, sortOrder: 3, features: ["750 receipts"] },
    { slug: PLAN_SLUGS.PRO, nameEn: "Pro", nameMr: "प्रो", price: "1999", receiptLimit: 2000, volunteerLimit: 50, sortOrder: 4, features: ["2000 receipts"] },
    { slug: PLAN_SLUGS.UNLIMITED, nameEn: "Unlimited", nameMr: "अनलिमिटेड", price: "2999", receiptLimit: null, volunteerLimit: null, sortOrder: 5, features: ["Unlimited receipts"] },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: {
        ...plan,
        billingPeriod: "FESTIVAL",
        isActive: true,
      },
    });
  }

  await prisma.receiptTemplate.createMany({
    data: [
      { slug: "TRADITIONAL", nameEn: "Traditional Marathi", nameMr: "पारंपरिक मराठी" },
      { slug: "MODERN", nameEn: "Modern", nameMr: "आधुनिक" },
      { slug: "PREMIUM", nameEn: "Premium", nameMr: "प्रीमियम" },
    ],
    skipDuplicates: true,
  });
}

async function upsertUser(input: {
  name: string;
  mobile: string;
  email?: string;
  isSuperAdmin?: boolean;
}) {
  const passwordHash = await hash(PASSWORD, 12);
  const existing = await prisma.user.findUnique({ where: { mobile: input.mobile } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      name: input.name,
      mobile: input.mobile,
      email: input.email ?? null,
      passwordHash,
      language: "mr",
      isSuperAdmin: Boolean(input.isSuperAdmin),
    },
  });
}

async function seedMandal(input: {
  name: string;
  slug: string;
  city: string;
  admin: { id: string };
  treasurer: { id: string };
  volunteer: { id: string };
  receiptCount: number;
  expenseCount: number;
}) {
  const existing = await prisma.mandal.findUnique({ where: { slug: input.slug } });
  if (existing) return existing;

  const plan = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { slug: PLAN_SLUGS.STANDARD } });
  const mandal = await prisma.mandal.create({
    data: {
      name: input.name,
      slug: input.slug,
      ganpatiYear: 2026,
      address: "गणेश पेठ",
      city: input.city,
      district: "पुणे",
      taluka: "हवेली",
      pinCode: "411002",
      mobile: "02024450000",
      status: "ACTIVE",
      onboardingCompleted: true,
      createdById: input.admin.id,
    },
  });

  const festival = await prisma.festival.create({
    data: {
      mandalId: mandal.id,
      name: "गणपती उत्सव २०२६",
      startDate: new Date("2026-08-27"),
      endDate: new Date("2026-09-06"),
      year: 2026,
      isActive: true,
    },
  });

  await prisma.mandalSettings.create({
    data: {
      mandalId: mandal.id,
      receiptPrefix: "GM",
      nextReceiptNumber: input.receiptCount + 1,
      receiptTemplate: "TRADITIONAL",
      authorizedSignatory: "अध्यक्ष",
      treasurerName: "खजिनदार",
      footerMessage: "आपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद!",
      showPublicFinancials: true,
    },
  });

  await prisma.publicPage.create({
    data: { mandalId: mandal.id, slug: input.slug, isEnabled: true, showFinancialSummary: true },
  });

  await prisma.subscription.create({
    data: {
      mandalId: mandal.id,
      planId: plan.id,
      status: "ACTIVE",
      expiresAt: new Date("2026-12-31"),
    },
  });

  for (const [role, user] of [
    ["ADMIN", input.admin],
    ["TREASURER", input.treasurer],
    ["VOLUNTEER", input.volunteer],
  ] as const) {
    await prisma.mandalMember.create({
      data: { mandalId: mandal.id, userId: user.id, role, isActive: true, joinedAt: new Date() },
    });
  }

  await prisma.expenseCategory.createMany({
    data: DEFAULT_EXPENSE_CATEGORIES.map((category) => ({
      mandalId: mandal.id,
      slug: category.slug,
      nameEn: category.nameEn,
      nameMr: category.nameMr,
      isDefault: true,
      sortOrder: category.sortOrder,
    })),
  });

  const donors = [];
  for (const [fullName, mobile, area] of donorNames) {
    donors.push(
      await prisma.donor.create({
        data: {
          mandalId: mandal.id,
          fullName,
          mobile,
          area,
          city: input.city,
          address: `${area}, ${input.city}`,
        },
      }),
    );
  }

  const methods = ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE"] as const;
  const amounts = ["501", "1001", "2001", "11000", "5001", "251", "151", "21000"];
  const creators = [input.admin.id, input.treasurer.id, input.volunteer.id];

  for (let i = 0; i < input.receiptCount; i += 1) {
    const amount = amounts[i % amounts.length];
    const donor = donors[i % donors.length];
    await prisma.receipt.create({
      data: {
        mandalId: mandal.id,
        festivalId: festival.id,
        donorId: donor.id,
        createdById: creators[i % creators.length],
        receiptNumber: formatReceiptNumber("GM", 2026, i + 1),
        verificationToken: nanoid(32),
        amount,
        amountInWordsMr: amountInWordsMr(amount),
        amountInWordsEn: amountInWordsEn(amount),
        paymentMethod: methods[i % methods.length],
        transactionId: methods[i % methods.length] === "UPI" ? `UPI${100000 + i}` : null,
        status: "ACTIVE",
        receiptDate: new Date(2026, 7, 27 + (i % 10)),
        payments: {
          create: {
            mandalId: mandal.id,
            amount,
            method: methods[i % methods.length],
          },
        },
      },
    });
  }

  const categories = await prisma.expenseCategory.findMany({ where: { mandalId: mandal.id } });
  const expenseTitles = [
    "मंडप भाडे",
    "सजावट साहित्य",
    "लाईटिंग बिल",
    "साउंड सिस्टम",
    "प्रसाद साहित्य",
    "पूजा साहित्य",
    "कार्यक्रम कलाकार",
    "जाहिरात फ्लेक्स",
    "मिरवणूक खर्च",
    "सुरक्षा गार्ड",
    "स्वच्छता",
    "परवानगी फी",
    "इतर खर्च",
    "फूल माळा",
    "पाणी व्यवस्था",
  ];
  const expenseAmounts = ["80000", "45000", "22000", "30000", "25000", "12000", "40000", "15000", "18000", "9000", "7000", "5000", "8000", "6000", "4000"];

  for (let i = 0; i < input.expenseCount; i += 1) {
    await prisma.expense.create({
      data: {
        mandalId: mandal.id,
        festivalId: festival.id,
        categoryId: categories[i % categories.length].id,
        createdById: input.treasurer.id,
        title: expenseTitles[i % expenseTitles.length],
        amount: expenseAmounts[i % expenseAmounts.length],
        expenseDate: new Date(2026, 7, 20 + i),
        paymentMethod: i % 2 === 0 ? "CASH" : "UPI",
        vendor: "स्थानिक पुरवठादार",
        status: "APPROVED",
      },
    });
  }

  await prisma.usageRecord.create({
    data: {
      mandalId: mandal.id,
      festivalId: festival.id,
      receiptCount: input.receiptCount,
      volunteerCount: 3,
      periodStart: new Date("2026-08-01"),
    },
  });

  await prisma.pendingCollection.create({
    data: {
      mandalId: mandal.id,
      festivalId: festival.id,
      donorId: donors[0].id,
      assignedToId: input.volunteer.id,
      createdById: input.admin.id,
      expectedAmount: "5001",
      dueDate: new Date("2026-09-01"),
      status: "PENDING",
    },
  });

  return mandal;
}

async function main() {
  await seedPlans();

  const superAdmin = await upsertUser({
    name: "Super Admin",
    mobile: "9000000000",
    email: "admin@digitalvargani.in",
    isSuperAdmin: true,
  });
  const admin = await upsertUser({ name: "रोहित पाटील", mobile: "9876543210", email: "admin@ganeshmandal.in" });
  const treasurer = await upsertUser({ name: "अमोल देशमुख", mobile: "9876543211", email: "treasurer@ganeshmandal.in" });
  const volunteer = await upsertUser({ name: "सचिन जाधव", mobile: "9876543212", email: "volunteer@ganeshmandal.in" });
  const admin2 = await upsertUser({ name: "नितीन काळे", mobile: "9123456780", email: "admin@dattamandal.in" });
  const treasurer2 = await upsertUser({ name: "काजल मोरे", mobile: "9123456781" });
  const volunteer2 = await upsertUser({ name: "विकास पवार", mobile: "9123456782" });

  await seedMandal({
    name: "श्री गणेश मित्र मंडळ",
    slug: "shri-ganesh-mitra-mandal",
    city: "पुणे",
    admin,
    treasurer,
    volunteer,
    receiptCount: 30,
    expenseCount: 15,
  });

  await seedMandal({
    name: "श्री दत्त मित्र मंडळ",
    slug: "shri-datt-mitra-mandal",
    city: "नाशिक",
    admin: admin2,
    treasurer: treasurer2,
    volunteer: volunteer2,
    receiptCount: 8,
    expenseCount: 4,
  });

  console.log("Seed complete");
  console.log("Super admin:", superAdmin.email, PASSWORD);
  console.log("Mandal admin:", admin.mobile, PASSWORD);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
