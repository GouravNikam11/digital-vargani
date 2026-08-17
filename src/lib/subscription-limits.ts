export type ReceiptLimitInput = {
  currentReceipts: number;
  receiptLimit: number | null;
};

export function hasReachedReceiptLimit({
  currentReceipts,
  receiptLimit,
}: ReceiptLimitInput): boolean {
  if (receiptLimit === null) return false;
  return currentReceipts >= receiptLimit;
}

export function remainingReceipts({
  currentReceipts,
  receiptLimit,
}: ReceiptLimitInput): number | null {
  if (receiptLimit === null) return null;
  return Math.max(receiptLimit - currentReceipts, 0);
}
