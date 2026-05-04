import type { Metadata } from "next";
import { Newsreader, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://wy2z.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "wy2z — three plants, one row of data",
  description:
    "A four-device plant lab keeping a Wyches Yellow tomato and two zinnias alive while I'm out of town. Live photos and verdicts, twice a day.",
  openGraph: {
    title: "wy2z — three plants, one row of data",
    description:
      "A Pi 5 orchestrates a Jetson Orin Nano camera, an ESP32 watering rig, and Claude vision to keep three plants alive for five weeks unattended.",
    url: SITE_URL,
    siteName: "wy2z",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "wy2z — three plants, one row of data",
    description:
      "A Pi 5 orchestrates a Jetson Orin Nano camera, an ESP32 watering rig, and Claude vision to keep three plants alive for five weeks unattended.",
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
      className={`${newsreader.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body className="bg-slate-900 text-slate-200">{children}</body>
    </html>
  );
}
