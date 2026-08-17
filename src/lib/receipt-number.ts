export function formatReceiptNumber(prefix: string, year: number, sequence: number): string {
  const safePrefix = prefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "GM";
  const padded = String(sequence).padStart(6, "0");
  return `${safePrefix}-${year}-${padded}`;
}

export function parseReceiptSequence(receiptNumber: string): number | null {
  const match = receiptNumber.match(/-(\d{6})$/);
  if (!match) return null;
  return Number(match[1]);
}
