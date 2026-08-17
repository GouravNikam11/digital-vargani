import { Decimal } from "decimal.js";

Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});

export { Decimal };

export type MoneyInput = Decimal | string | number;

function toDecimal(value: MoneyInput): Decimal {
  const money = value instanceof Decimal ? value : new Decimal(value);
  if (!money.isFinite() || money.isNaN()) {
    throw new Error("Invalid money value");
  }
  return money.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/** Unsigned money for receipts, expenses, and other posted amounts. */
export function toMoney(value: MoneyInput): Decimal {
  const money = toDecimal(value);
  if (money.lt(0)) {
    throw new Error("Money cannot be negative");
  }
  return money;
}

/** Signed money for derived balances (collection minus expenses). */
export function toSignedMoney(value: MoneyInput): Decimal {
  return toDecimal(value);
}

export function addMoney(...values: MoneyInput[]): Decimal {
  return values
    .reduce((total: Decimal, value) => total.plus(toMoney(value)), new Decimal(0))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function subtractMoney(left: MoneyInput, right: MoneyInput): Decimal {
  return toMoney(left).minus(toMoney(right)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function remainingBalance(collection: MoneyInput, expenses: MoneyInput): Decimal {
  return toMoney(collection).minus(toMoney(expenses)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function moneyToString(value: MoneyInput): string {
  return toMoney(value).toFixed(2);
}

export function parseMoneyInput(value: string): Decimal {
  const cleaned = value.replace(/[₹,\s]/g, "").trim();
  if (!cleaned) {
    throw new Error("Amount is required");
  }
  return toMoney(cleaned);
}

export function formatINR(value: MoneyInput, options?: { withSymbol?: boolean }): string {
  const amount = toSignedMoney(value);
  const withSymbol = options?.withSymbol ?? true;
  const absolute = amount.abs();
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: absolute.mod(1).isZero() ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number(absolute.toFixed(2)));
  const signed = amount.isNegative() ? `-${formatted}` : formatted;

  return withSymbol ? (amount.isNegative() ? `-₹${formatted}` : `₹${formatted}`) : signed;
}
