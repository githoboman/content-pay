import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ContentPay — Decentralized Micropayments on BOT Chain",
  description: "Sub-second decentralized micropayments and content publishing platform native to BOT Chain (EVM L1 for DePIN and AI Native Applications).",
  keywords: ["BOT Chain", "DePIN", "AI Agents", "ERC-8004", "Micropayments", "Web3", "Bohr Testnet", "ContentPay"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#070A11] text-gray-100 min-h-screen selection:bg-cyan-500 selection:text-black`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
