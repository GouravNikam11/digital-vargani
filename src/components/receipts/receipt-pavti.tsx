import { ganpatiImageUrl } from "@/lib/ganpati-image";
import { formatINR } from "@/lib/money";
import { format } from "date-fns";

export type ReceiptPavtiData = {
  mandalName: string;
  address?: string | null;
  city?: string | null;
  festivalName: string;
  year: number;
  ganpatiPhotoUrl?: string | null;
  receiptNumber: string;
  receiptDate: Date;
  donorName: string;
  mobile: string;
  amount: string;
  amountInWords: string;
  paymentMethodLabel: string;
  collectedBy: string;
  status: "ACTIVE" | "CANCELLED";
  statusLabel: string;
  thanks: string;
};

export function ReceiptPavti({ receipt }: { receipt: ReceiptPavtiData }) {
  const imageSrc = ganpatiImageUrl(receipt.ganpatiPhotoUrl);
  const place = [receipt.address, receipt.city].filter(Boolean).join(", ");

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-[#e8d5b0] bg-[#f6e8c9] shadow-sm">
      <div className="flex h-5 w-full">
        {Array.from({ length: 28 }).map((_, index) => (
          <span
            key={index}
            className={`h-5 flex-1 rounded-b-full ${index % 2 === 0 ? "bg-[#e65100]" : "bg-[#2e7d32]"}`}
          />
        ))}
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-[180px_1fr] md:items-start md:p-5">
        <div className="relative mx-auto w-40 overflow-hidden rounded-3xl bg-[#ead6a8] md:w-[180px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt="श्री गणेश"
            className="h-52 w-full object-cover object-top md:h-64"
          />
          {receipt.status === "CANCELLED" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35">
              <span className="rotate-[-18deg] text-3xl font-bold text-white">CANCELLED</span>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col">
          <p className="text-center text-sm text-[#c45c00]">॥ श्री गणेशाय नमः ॥</p>
          <p className="mt-1 text-center text-xs text-[#6b4f2a]">वर्ष {receipt.year}</p>
          <h1 className="mt-1 text-center text-2xl font-bold leading-tight text-[#e65100] md:text-3xl">
            {receipt.mandalName}
          </h1>
          <p className="mt-1 text-center text-sm text-[#6b4f2a]">{receipt.festivalName}</p>
          {place ? <p className="mt-1 text-center text-xs text-[#6b4f2a]">{place}</p> : null}
          <div className="mt-4 flex-1 rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3 text-sm">
              <p>
                पावती क्र. <span className="font-semibold">{receipt.receiptNumber}</span>
              </p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${receipt.status === "CANCELLED" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                {receipt.statusLabel}
              </span>
            </div>
            <p className="mt-2 text-right text-xs text-[#6b4f2a]">दि. {format(receipt.receiptDate, "dd/MM/yyyy")}</p>
            <p className="mt-4 text-sm text-[#6b4f2a]">प्राप्त झाले</p>
            <p className="text-lg font-bold">श्री./सौ. {receipt.donorName}</p>
            <p className="text-sm text-[#6b4f2a]">{receipt.mobile}</p>
            <p className="mt-3 text-sm">
              आपणाकडून श्री गणेश उत्सव करिता अक्षरी रक्कम
              <span className="font-medium"> {receipt.amountInWords}</span>
              {" "}दिल्याबद्दल धन्यवाद.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e65100] text-xl font-bold text-white">
                ₹
              </div>
              <div className="flex-1 rounded-2xl bg-[#fff4e5] px-4 py-3">
                <p className="text-2xl font-bold text-[#e65100]">{formatINR(receipt.amount)}</p>
              </div>
            </div>
            <p className="mt-3 text-sm">पेमेंट पद्धत: {receipt.paymentMethodLabel}</p>
            <p className="mt-1 text-sm">वर्गणी स्वीकारणारे: {receipt.collectedBy}</p>
            <p className="mt-4 text-right text-xs text-[#6b4f2a]">प्राप्तकर्ता सही</p>
          </div>
          <p className="mt-3 text-center text-sm">{receipt.thanks}</p>
          <p className="text-center font-bold text-[#e65100]">गणपती बाप्पा मोरया! 🙏</p>
        </div>
      </div>
    </article>
  );
}
