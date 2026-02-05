import type { Metadata } from "next";
import { Playfair_Display, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"]
});

const text = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-text",
  weight: ["400", "500"]
});

export const metadata: Metadata = {
  title: "Paper Feed",
  description: "A TikTok-style feed for full-screen newspaper articles"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable}`}>
      <body>{children}</body>
    </html>
  );
}
