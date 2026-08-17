import { describe, expect, it } from "vitest";
import { formatReceiptNumber, parseReceiptSequence } from "@/lib/receipt-number";

describe("receipt numbering", () => {
  it("formats unique mandal receipt numbers", () => {
    expect(formatReceiptNumber("GM", 2026, 1)).toBe("GM-2026-000001");
    expect(formatReceiptNumber("GM", 2026, 2)).toBe("GM-2026-000002");
    expect(formatReceiptNumber("gm-!", 2026, 124)).toBe("GM-2026-000124");
  });

  it("parses sequence from a receipt number", () => {
    expect(parseReceiptSequence("GM-2026-000003")).toBe(3);
  });
});
