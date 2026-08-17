import { describe, expect, it } from "vitest";
import { can } from "@/lib/permissions";
import { hasReachedReceiptLimit, remainingReceipts } from "@/lib/subscription-limits";

describe("permissions", () => {
  it("allows volunteers to create receipts but not financial reports", () => {
    expect(can("VOLUNTEER", "receipts", "create")).toBe(true);
    expect(can("VOLUNTEER", "reports", "financial")).toBe(false);
    expect(can("VOLUNTEER", "expenses", "create")).toBe(false);
  });

  it("allows treasurer finance access without mandal branding control", () => {
    expect(can("TREASURER", "reports", "financial")).toBe(true);
    expect(can("TREASURER", "branding", "manage")).toBe(false);
  });

  it("allows admin full mandal management", () => {
    expect(can("ADMIN", "members", "manage")).toBe(true);
    expect(can("ADMIN", "subscription", "manage")).toBe(true);
  });
});

describe("subscription limits", () => {
  it("blocks receipts at the plan limit", () => {
    expect(hasReachedReceiptLimit({ currentReceipts: 25, receiptLimit: 25 })).toBe(true);
    expect(hasReachedReceiptLimit({ currentReceipts: 24, receiptLimit: 25 })).toBe(false);
  });

  it("treats null as unlimited", () => {
    expect(hasReachedReceiptLimit({ currentReceipts: 5000, receiptLimit: null })).toBe(false);
    expect(remainingReceipts({ currentReceipts: 10, receiptLimit: null })).toBeNull();
  });
});
