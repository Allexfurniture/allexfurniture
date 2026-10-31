import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://allexfurniture.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Allex Furniture — Spaces that feel like you", template: "%s | Allex Furniture" },
  description: "Thoughtfully designed furniture for the way you live. Discover considered pieces, honest materials and timeless forms from Allex Furniture.",
  applicationName: "Allex Furniture",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Allex Furniture",
    url: "/",
    title: "Allex Furniture — Spaces that feel like you",
    description: "Thoughtfully designed furniture for the way you live. Discover considered pieces, honest materials and timeless forms from Allex Furniture.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Allex Furniture — Spaces that feel like you",
    description: "Thoughtfully designed furniture for the way you live. Discover considered pieces, honest materials and timeless forms from Allex Furniture.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}><body>{children}</body></html>;
}
