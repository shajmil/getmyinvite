import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { allFontVariables } from "@/templates/fonts";
import { DeveloperCredits } from "@/components/DeveloperCredits";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
  title: "GetMyInvite | Custom Wedding Invitation Websites",
  description: "Create a beautiful wedding invitation website without designing anything.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${allFontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <DeveloperCredits />
        <SpeedInsights />
      </body>
    </html>
  );
}

