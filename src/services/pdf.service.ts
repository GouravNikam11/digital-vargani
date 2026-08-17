import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { putFile } from "@/lib/storage";
import { ReceiptPdfDocument } from "@/services/pdf/receipt-document";
import { env } from "@/lib/env";

export async function generateReceiptPdf(receiptId: string, mandalId: string) {
  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, mandalId },
    include: {
      donor: true,
      createdBy: { select: { name: true } },
      mandal: true,
      festival: true,
    },
  });
  if (!receipt) return null;

  const settings = await prisma.mandalSettings.findUnique({
    where: { mandalId },
  });

  const verifyUrl = `${env.APP_URL}/public/receipt/${receipt.verificationToken}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 180 });

  const buffer = await renderToBuffer(
    ReceiptPdfDocument({
      receipt,
      settings,
      qrDataUrl,
      verifyUrl,
    }),
  );

  const stored = await putFile(
    `receipts/${mandalId}/${receipt.receiptNumber}.pdf`,
    Buffer.from(buffer),
    "application/pdf",
  );

  return stored;
}
