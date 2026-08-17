import type { Metadata } from "next";
import { Noto_Sans_Devanagari } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import { Toaster } from "sonner";
import { I18nProvider } from "@/i18n/provider";
import { getLocale, getMessages } from "@/i18n/get-messages";
import "./globals.css";

const noto = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "डिजिटल वर्गणी",
  description: "कागदी पावती बंद — वर्गणी, पावती आणि संपूर्ण हिशोब मोबाईलवर.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "वर्गणी",
    statusBarStyle: "default",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const messages = await getMessages(locale);

  return (
    <html lang={locale} className={`${noto.variable} h-full antialiased`}>
      <body className={`${noto.className} min-h-full bg-background text-foreground`}>
        <I18nProvider locale={locale} messages={messages}>
          {children}
          <PwaRegister />
          <Toaster richColors position="top-center" />
        </I18nProvider>
      </body>
    </html>
  );
}
