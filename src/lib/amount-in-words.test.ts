import { describe, expect, it } from "vitest";
import { amountInWordsEn, amountInWordsMr } from "@/lib/amount-in-words";

describe("amount in words", () => {
  it("converts 2001 to Marathi", () => {
    expect(amountInWordsMr(2001)).toContain("दोन हजार");
    expect(amountInWordsMr(2001)).toContain("एक");
    expect(amountInWordsMr(2001)).toContain("फक्त");
  });

  it("converts 2001 to English", () => {
    expect(amountInWordsEn(2001)).toBe("two thousand one rupees only");
  });
});
