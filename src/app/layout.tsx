import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "@/components/ui/sonner";
import { CommandPalette } from "@/components/CommandPalette";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "OwnState — Own Anything. Anywhere. On Earth.",
    template: "%s · OwnState",
  },
  description:
    "Buy, sell, rent or lease any property on Earth — from a village plot to a private island. Protect your land forever with Digital Land Fencing.",
  keywords: [
    "real estate India",
    "buy property online",
    "land fencing",
    "sell land",
    "property for NRIs",
    "OwnState",
  ],
  applicationName: "OwnState",
  openGraph: {
    type: "website",
    siteName: "OwnState",
    title: "OwnState — Own Anything. Anywhere. On Earth.",
    description:
      "Buy, sell, rent or lease any property on Earth. Fence your land digitally and close the deal online.",
  },
  twitter: {
    card: "summary_large_image",
    title: "OwnState — Own Anything. Anywhere. On Earth.",
    description:
      "Buy, sell, rent or lease any property on Earth. Fence your land digitally and close the deal online.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-svh flex-col">
        <Providers>{children}</Providers>
        <CommandPalette />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
