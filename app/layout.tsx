import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "xPay Insider — Unlock Salary, Specs & Reviews with Solana",
  description:
    "Blind-style professional community where you unlock premium insider content with x402 + Solana micropayments for just 0.0002–0.0005 SOL.",
  openGraph: {
    title: "xPay Insider",
    description: "Unlock insider comp data with x402 + Solana Micropayments",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50/50 font-[family-name:var(--font-geist-sans)]">
        {children}
      </body>
    </html>
  );
}
