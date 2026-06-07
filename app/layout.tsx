import type { Metadata } from "next";
import { Instrument_Serif, Geist } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Laymade · Premium websites for independent businesses",
  description:
    "Bespoke websites for British independents. Hand-built for beauty studios and trades. Built fast, and yours from day one.",
  metadataBase: new URL("https://laymade.vercel.app"),
  openGraph: {
    title: "Laymade · Premium websites for independent businesses",
    description:
      "Built fast, and yours from day one. Hand-built websites for British independents.",
    type: "website",
    locale: "en_GB",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-GB"
      className={`${instrumentSerif.variable} ${geist.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[color:var(--bg)] text-[color:var(--ink)] antialiased">
        {children}
      </body>
    </html>
  );
}
