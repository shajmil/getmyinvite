import React from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { TemplatesList } from "@/components/TemplatesList";
import Link from "next/link";

import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wedding Invitation Website Templates & Themes | GetMyInvite",
  description: "Browse premium wedding invitation website templates. Pick elegant designs, responsive parallax layouts, and launch your wedding site. Choose a theme today!",
  alternates: {
    canonical: "https://getmyinvite.in/templates",
  },
  openGraph: {
    title: "Wedding Invitation Website Templates & Themes | GetMyInvite",
    description: "Browse premium wedding invitation website templates. Pick elegant designs, responsive parallax layouts, and launch your wedding site. Choose a theme today!",
    type: "website",
    siteName: "GetMyInvite",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wedding Invitation Website Templates & Themes | GetMyInvite",
    description: "Browse premium wedding invitation website templates. Pick elegant designs, responsive parallax layouts, and launch your wedding site. Choose a theme today!",
  }
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
          <h1 className="font-serif text-3xl font-bold text-[#1a1a1a]">Curated Wedding Invitation Templates</h1>
          <p className="text-xs text-[#666] leading-relaxed uppercase tracking-wider font-semibold">
            Choose a foundation theme to start building your wedding site
          </p>
        </div>

        <TemplatesList isLoggedIn={isLoggedIn} />
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-[#eae6df] text-center text-xs text-[#666] uppercase tracking-wider space-y-4">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] text-[#855f18] font-semibold">
          <Link href="/kerala-wedding-invitation-website" className="hover:underline">Kerala Wedding Website</Link>
          <span className="text-gray-300">•</span>
          <Link href="/malayalam-wedding-invitation-online" className="hover:underline">Malayalam Invitation Online</Link>
          <span className="text-gray-300">•</span>
          <Link href="/free-wedding-rsvp-website-india" className="hover:underline">Free RSVP Website India</Link>
        </div>
        <div className="space-y-1">
          <p>&copy; {new Date().getFullYear()} GetMyInvite. All rights reserved.</p>
          <p className="text-[10px] text-gray-400">Website by Shajmil</p>
        </div>
      </footer>

      {/* JSON-LD Structured Data Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Wedding Invitation Templates Gallery",
            "description": "Explore the list of responsive parallax and overlay wedding invitation template designs available on GetMyInvite.",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Barcelona Template",
                "description": "Elegant mobile-responsive design featuring smooth full-viewport parallax scrolling, photo slide-ins, and customizable palettes.",
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Classic Template",
                "description": "Sophisticated overlay card design with floral backdrops, looping music, and floating RSVP controls.",
              },
            ],
          }),
        }}
      />
    </div>
  );
}
