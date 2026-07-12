import React from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { TemplatesList } from "@/components/TemplatesList";
import Link from "next/link";

import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wedding Invitation Templates & Themes | GetMyInvite",
  description: "Browse our collection of premium digital wedding website designs. Choose from elegant layouts, scrolling parallax themes, and customizable modal invitations.",
  openGraph: {
    title: "Wedding Invitation Templates & Themes | GetMyInvite",
    description: "Select from modern, responsive digital wedding invitation templates. Live preview gold, charcoal, and emerald themes instantly.",
    type: "website",
    siteName: "GetMyInvite",
  },
};

export default async function TemplatesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isLoggedIn = !!session?.user;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf8f5]">
      {/* Navbar */}
      <header className="h-20 bg-white border-b border-[#eae6df] px-6">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-bold tracking-wide">
            GetMyInvite
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-xs font-bold uppercase tracking-wider hover:text-[#855f18]">
              Home
            </Link>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-[#855f18] text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-[#6c4c12] transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="px-4 py-2 border border-[#eae6df] hover:bg-[#faf8f5] text-xs font-bold uppercase tracking-wider rounded transition-colors"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl w-full mx-auto space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
          <h2 className="font-serif text-3xl font-bold text-[#1a1a1a]">Curated Wedding Invitation Templates</h2>
          <p className="text-xs text-[#666] leading-relaxed uppercase tracking-wider font-semibold">
            Choose a foundation theme to start building your wedding site
          </p>
        </div>

        <TemplatesList isLoggedIn={isLoggedIn} />
      </main>
    </div>
  );
}
