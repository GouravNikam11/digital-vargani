const ONES_MR = [
  "",
  "एक",
  "दोन",
  "तीन",
  "चार",
  "पाच",
  "सहा",
  "सात",
  "आठ",
  "नऊ",
  "दहा",
  "अकरा",
  "बारा",
  "तेरा",
  "चौदा",
  "पंधरा",
  "सोळा",
  "सतरा",
  "अठरा",
  "एकोणीस",
];

const TENS_MR = [
  "",
  "",
  "वीस",
  "तीस",
  "चाळीस",
  "पन्नास",
  "साठ",
  "सत्तर",
  "ऐंशी",
  "नव्वद",
];

const ONES_EN = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS_EN = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

function twoDigitMr(n: number): string {
  if (n < 20) return ONES_MR[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  if (one === 0) return TENS_MR[ten];
  return `${TENS_MR[ten]} ${ONES_MR[one]}`;
}

function twoDigitEn(n: number): string {
  if (n < 20) return ONES_EN[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  if (one === 0) return TENS_EN[ten];
  return `${TENS_EN[ten]} ${ONES_EN[one]}`;
}

function scaleMr(n: number, scale: string): string {
  if (n === 0) return "";
  if (n < 100) return `${twoDigitMr(n)} ${scale}`;
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const head = `${ONES_MR[hundred]} शे`;
  return rest ? `${head} ${twoDigitMr(rest)} ${scale}` : `${head} ${scale}`;
}

function scaleEn(n: number, scale: string): string {
  if (n === 0) return "";
  if (n < 100) return `${twoDigitEn(n)} ${scale}`;
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const head = `${ONES_EN[hundred]} hundred`;
  return rest ? `${head} ${twoDigitEn(rest)} ${scale}` : `${head} ${scale}`;
}

function splitIndian(amount: number) {
  const crore = Math.floor(amount / 1_00_00_000);
  const lakh = Math.floor((amount % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((amount % 1_00_000) / 1000);
  const hundred = Math.floor((amount % 1000) / 100);
  const rest = amount % 100;
  return { crore, lakh, thousand, hundred, rest };
}

export function amountInWordsMr(amount: string | number): string {
  const numeric = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error("Invalid amount");
  }

  const rupees = Math.floor(numeric);
  const paise = Math.round((numeric - rupees) * 100);

  if (rupees === 0 && paise === 0) {
    return "शून्य रुपये फक्त";
  }

  const { crore, lakh, thousand, hundred, rest } = splitIndian(rupees);
  const parts: string[] = [];

  if (crore) parts.push(scaleMr(crore, "कोटी"));
  if (lakh) parts.push(scaleMr(lakh, "लाख"));
  if (thousand) parts.push(scaleMr(thousand, "हजार"));
  if (hundred) parts.push(`${ONES_MR[hundred]} शे`);
  if (rest) parts.push(twoDigitMr(rest));

  let words = parts.filter(Boolean).join(" ");
  if (rupees > 0) {
    words = `${words} रुपये`.trim();
  }
  if (paise > 0) {
    words = `${words} ${twoDigitMr(paise)} पैसे`.trim();
  }

  return `${words} फक्त`;
}

export function amountInWordsEn(amount: string | number): string {
  const numeric = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error("Invalid amount");
  }

  const rupees = Math.floor(numeric);
  const paise = Math.round((numeric - rupees) * 100);

  if (rupees === 0 && paise === 0) {
    return "zero rupees only";
  }

  const { crore, lakh, thousand, hundred, rest } = splitIndian(rupees);
  const parts: string[] = [];

  if (crore) parts.push(scaleEn(crore, "crore"));
  if (lakh) parts.push(scaleEn(lakh, "lakh"));
  if (thousand) parts.push(scaleEn(thousand, "thousand"));
  if (hundred) parts.push(`${ONES_EN[hundred]} hundred`);
  if (rest) parts.push(twoDigitEn(rest));

  let words = parts.filter(Boolean).join(" ");
  if (rupees > 0) {
    words = `${words} rupees`.trim();
  }
  if (paise > 0) {
    words = `${words} and ${twoDigitEn(paise)} paise`.trim();
  }

  return `${words} only`;
}
