export const LOCALES = ["mr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "mr";

export const DEFAULT_EXPENSE_CATEGORIES = [
  { slug: "mandap", nameMr: "मंडप", nameEn: "Mandap", sortOrder: 1 },
  { slug: "decoration", nameMr: "सजावट", nameEn: "Decoration", sortOrder: 2 },
  { slug: "lighting", nameMr: "लाईटिंग", nameEn: "Lighting", sortOrder: 3 },
  { slug: "sound", nameMr: "साउंड", nameEn: "Sound", sortOrder: 4 },
  { slug: "prasad", nameMr: "प्रसाद", nameEn: "Prasad", sortOrder: 5 },
  { slug: "puja", nameMr: "पूजा साहित्य", nameEn: "Puja Materials", sortOrder: 6 },
  { slug: "cultural", nameMr: "सांस्कृतिक कार्यक्रम", nameEn: "Cultural Programmes", sortOrder: 7 },
  { slug: "advertising", nameMr: "जाहिरात", nameEn: "Advertising", sortOrder: 8 },
  { slug: "procession", nameMr: "मिरवणूक", nameEn: "Procession", sortOrder: 9 },
  { slug: "security", nameMr: "सुरक्षा", nameEn: "Security", sortOrder: 10 },
  { slug: "cleanliness", nameMr: "स्वच्छता", nameEn: "Cleanliness", sortOrder: 11 },
  { slug: "permissions", nameMr: "परवानगी", nameEn: "Permissions", sortOrder: 12 },
  { slug: "other", nameMr: "इतर", nameEn: "Other", sortOrder: 13 },
] as const;

export const PLAN_SLUGS = {
  FREE: "free",
  BASIC: "basic",
  STANDARD: "standard",
  PRO: "pro",
  UNLIMITED: "unlimited",
} as const;

export const TRIAL_DAYS = 14;
export const CURRENT_FESTIVAL_YEAR = 2026;
