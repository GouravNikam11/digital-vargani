import { describe, expect, it } from "vitest";
import { addMoney, formatINR, remainingBalance, toMoney } from "@/lib/money";

describe("money", () => {
  it("adds amounts without floating point error", () => {
    const total = addMoney("0.10", "0.20", "2001");
    expect(total.toFixed(2)).toBe("2001.30");
  });

  it("formats Indian currency", () => {
    expect(formatINR("452500")).toBe("₹4,52,500");
    expect(formatINR("2001")).toBe("₹2,001");
  });

  it("computes remaining balance from collection and expenses", () => {
    const balance = remainingBalance("452500", "287300");
    expect(balance.toFixed(2)).toBe("165200.00");
  });

  it("allows a negative remaining balance when expenses exceed collection", () => {
    const balance = remainingBalance("1000", "2500");
    expect(balance.toFixed(2)).toBe("-1500.00");
    expect(formatINR(balance)).toBe("-₹1,500");
  });

  it("rejects negative money for posted amounts", () => {
    expect(() => toMoney("-1")).toThrow();
  });
});
