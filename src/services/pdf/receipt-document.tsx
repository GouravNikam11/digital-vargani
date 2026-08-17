import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";
import { existsSync } from "node:fs";
import path from "node:path";
import { formatINR } from "@/lib/money";
import { format } from "date-fns";
import { ganpatiImageForPdf } from "@/lib/ganpati-image";

const fontRegular = path.join(process.cwd(), "src/assets/fonts/NotoSansDevanagari-Regular.ttf");
const fontBold = path.join(process.cwd(), "src/assets/fonts/NotoSansDevanagari-Bold.ttf");

if (existsSync(fontRegular)) {
  Font.register({
    family: "NotoSansDevanagari",
    fonts: [
      { src: fontRegular, fontWeight: "normal" },
      { src: existsSync(fontBold) ? fontBold : fontRegular, fontWeight: "bold" },
    ],
  });
}

const fontFamily = existsSync(fontRegular) ? "NotoSansDevanagari" : "Helvetica";

type ReceiptPdfProps = {
  receipt: {
    receiptNumber: string;
    receiptDate: Date;
    amount: { toString(): string };
    amountInWordsMr: string;
    paymentMethod: string;
    transactionId: string | null;
    chequeNumber: string | null;
    status: "ACTIVE" | "CANCELLED";
    donor: { fullName: string; mobile: string; address: string | null };
    createdBy: { name: string };
    mandal: {
      name: string;
      address: string | null;
      city: string | null;
      logoUrl: string | null;
      ganpatiPhotoUrl: string | null;
    };
    festival: { name: string; year: number };
  };
  settings: {
    receiptTemplate: "TRADITIONAL" | "MODERN" | "PREMIUM";
    treasurerName: string | null;
    authorizedSignatory: string | null;
    footerMessage: string | null;
  } | null;
  qrDataUrl: string;
  verifyUrl: string;
};

const styles = StyleSheet.create({
  page: {
    fontFamily,
    backgroundColor: "#F6E8C9",
    padding: 0,
    fontSize: 9,
    color: "#3E2A14",
  },
  toranRow: { flexDirection: "row", height: 12 },
  body: {
    flexDirection: "row",
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  photoWrap: {
    width: 118,
    height: 188,
    backgroundColor: "#EAD6A8",
    borderRadius: 14,
    overflow: "hidden",
    marginRight: 12,
  },
  photo: { width: 118, height: 188, objectFit: "cover" },
  content: { flex: 1 },
  heading: { textAlign: "center", fontSize: 9, color: "#C45C00" },
  year: { textAlign: "center", fontSize: 8, marginTop: 1 },
  mandal: { textAlign: "center", fontSize: 14, fontWeight: "bold", color: "#E65100", marginTop: 2 },
  festival: { textAlign: "center", fontSize: 8, marginTop: 2 },
  card: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 8,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  donor: { fontSize: 11, fontWeight: "bold", marginTop: 1 },
  amountRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  rupee: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E65100",
    color: "#FFFFFF",
    textAlign: "center",
    paddingTop: 5,
    fontSize: 10,
    fontWeight: "bold",
    marginRight: 8,
  },
  amountBox: {
    flexGrow: 1,
    backgroundColor: "#FFF4E5",
    borderRadius: 8,
    padding: 6,
  },
  amount: { fontSize: 13, fontWeight: "bold", color: "#E65100" },
  footer: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  thanks: { fontSize: 8, flexGrow: 1, paddingRight: 8 },
  gbm: { fontSize: 10, color: "#E65100", fontWeight: "bold", marginTop: 2 },
  qr: { width: 42, height: 42 },
  cancelled: {
    position: "absolute",
    top: 160,
    left: 160,
    fontSize: 36,
    color: "#DC2626",
    opacity: 0.28,
    transform: "rotate(-16deg)",
  },
});

export function ReceiptPdfDocument({ receipt, settings, qrDataUrl }: ReceiptPdfProps) {
  const ganpatiSrc = ganpatiImageForPdf(receipt.mandal.ganpatiPhotoUrl);
  const place = [receipt.mandal.address, receipt.mandal.city].filter(Boolean).join(", ");

  return (
    <Document>
      <Page size="A5" orientation="landscape" style={styles.page} wrap={false}>
        <View style={styles.toranRow}>
          {Array.from({ length: 24 }).map((_, index) => (
            <View
              key={index}
              style={{
                flexGrow: 1,
                height: 12,
                backgroundColor: index % 2 === 0 ? "#E65100" : "#2E7D32",
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
              }}
            />
          ))}
        </View>
        {receipt.status === "CANCELLED" ? <Text style={styles.cancelled}>CANCELLED</Text> : null}
        <View style={styles.body} wrap={false}>
          <View style={styles.photoWrap} wrap={false}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
            <Image src={ganpatiSrc} style={styles.photo} />
          </View>
          <View style={styles.content}>
            <Text style={styles.heading}>॥ श्री गणेशाय नमः ॥</Text>
            <Text style={styles.year}>वर्ष {receipt.festival.year}</Text>
            <Text style={styles.mandal}>{receipt.mandal.name}</Text>
            <Text style={styles.festival}>{receipt.festival.name}</Text>
            {place ? <Text style={styles.festival}>{place}</Text> : null}
            <View style={styles.card} wrap={false}>
              <View style={styles.row}>
                <Text>पावती क्र. {receipt.receiptNumber}</Text>
                <Text>दि. {format(receipt.receiptDate, "dd/MM/yyyy")}</Text>
              </View>
              <Text>प्राप्त झाले</Text>
              <Text style={styles.donor}>श्री./सौ. {receipt.donor.fullName}</Text>
              <Text>मोबाईल: {receipt.donor.mobile}</Text>
              <Text style={{ marginTop: 4 }}>
                आपणाकडून श्री गणेश उत्सव करिता अक्षरी रक्कम {receipt.amountInWordsMr} दिल्याबद्दल धन्यवाद.
              </Text>
              <View style={styles.amountRow}>
                <Text style={styles.rupee}>₹</Text>
                <View style={styles.amountBox}>
                  <Text style={styles.amount}>{formatINR(receipt.amount.toString())}/-</Text>
                </View>
              </View>
              <Text style={{ marginTop: 6 }}>पेमेंट पद्धत: {receipt.paymentMethod}</Text>
              {receipt.transactionId ? <Text>Transaction ID: {receipt.transactionId}</Text> : null}
              <Text>वर्गणी स्वीकारणारे: {receipt.createdBy.name}</Text>
              {settings?.treasurerName ? <Text>खजिनदार: {settings.treasurerName}</Text> : null}
              <Text style={{ marginTop: 6, textAlign: "right", fontSize: 8 }}>प्राप्तकर्ता सही</Text>
            </View>
            <View style={styles.footer} wrap={false}>
              <View style={{ flexGrow: 1, paddingRight: 8 }}>
                <Text style={styles.thanks}>
                  {settings?.footerMessage || "आपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद!"}
                </Text>
                <Text style={styles.gbm}>गणपती बाप्पा मोरया!</Text>
              </View>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
              <Image src={qrDataUrl} style={styles.qr} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
