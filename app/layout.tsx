import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { COMPANY, SITE_URL } from "@/lib/public-site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "ALLEX Furniture | Office & Commercial Furniture", template: "%s | ALLEX Furniture" },
  description: "Explore ALLEX Furniture's published catalog and enquire about office, commercial, and custom-made furniture solutions.",
  applicationName: COMPANY.name,
  openGraph: {
    type: "website",
    siteName: COMPANY.name,
    url: "/",
    title: "ALLEX Furniture | Office & Commercial Furniture",
    description: "Explore ALLEX Furniture's published catalog and enquire about office, commercial, and custom-made furniture solutions.",
    locale: "en_BD",
  },
  twitter: {
    card: "summary_large_image",
    title: "ALLEX Furniture | Office & Commercial Furniture",
    description: "Explore ALLEX Furniture's published catalog and enquire about office, commercial, and custom-made furniture solutions.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}><body>{children}</body></html>;
}
