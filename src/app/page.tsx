import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { templateRegistry } from "@/templates/registry";

import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free Digital Wedding Invitation Website | GetMyInvite",
  description: "Create a free digital wedding invitation website in minutes. Share location maps, track guest RSVPs online, and pick premium themes. Start building now!",
  keywords: [
    "free digital wedding invitation website",
    "get my invite",
    "getmyinvite",
    "digital wedding card",
    "online RSVP wedding invitation",
    "custom wedding website builder",
    "wedding card online",
    "wedding invitations free",
    "best online wedding invitation",
    "MakeMyInvite",
    "getmyinvite.in"
  ],
  alternates: {
    canonical: "https://getmyinvite.in",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Free Digital Wedding Invitation Website | GetMyInvite",
    description: "Create a free digital wedding invitation website in minutes. Share location maps, track guest RSVPs online, and pick premium themes. Start building now!",
    url: "https://getmyinvite.in",
    siteName: "GetMyInvite",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Digital Wedding Invitation Website | GetMyInvite",
    description: "Create a free digital wedding invitation website in minutes. Share location maps, track guest RSVPs online, and pick premium themes. Start building now!",
  }
};

export default async function LandingPage() {
  // Check if user is logged in
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isLoggedIn = !!session?.user;

  const templates = Object.values(templateRegistry);

  return (
    <div className="flex-1 flex flex-col bg-[#faf8f5] text-[#1a1a1a] font-sans selection:bg-[#eae6df] selection:text-[#855f18]">
      {/* ------------------ HEADER ------------------ */}
      <header className="h-20 bg-white/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50 border-b border-[#eae6df] px-6">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-bold tracking-wide">
            GetMyInvite
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/templates" className="text-xs font-bold uppercase tracking-wider hover:text-[#855f18]">
              Templates
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

      {/* ------------------ HERO SECTION ------------------ */}
      <section className="pt-40 pb-20 px-6 text-center max-w-4xl mx-auto space-y-8">
        <span className="inline-block px-4 py-1.5 bg-[#855f18]/10 text-[#855f18] text-xs font-bold rounded-full uppercase tracking-wider">
          Free Wedding Website Builder
        </span>
        <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-wide leading-tight text-balance">
          Create a beautiful wedding invitation website without designing anything
        </h1>
        <p className="text-sm md:text-base text-[#666] max-w-xl mx-auto leading-relaxed">
          Simply fill in a form (names, venues, stories, photo galleries), choose an elegant template, and publish instantly. Guests can RSVP directly on your page.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link
            href={isLoggedIn ? "/dashboard" : "/templates"}
            className="px-8 py-4 bg-[#855f18] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#6c4c12] transition-all shadow-md active:scale-98"
          >
            {isLoggedIn ? "Go to Dashboard" : "Get Started"}
          </Link>
          <Link
            href="/templates"
            className="px-8 py-4 border border-[#eae6df] hover:bg-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
          >
            Browse Themes
          </Link>
        </div>
      </section>

      {/* ------------------ HOW IT WORKS ------------------ */}
      <section className="py-20 bg-white border-y border-[#eae6df] px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-3xl font-bold">How GetMyInvite Works</h2>
            <p className="text-xs text-[#666] uppercase tracking-wider font-semibold">
              Three simple steps to publish your wedding site
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "1",
                title: "Fill in the Details",
                desc: "Enter wedding dates, event timings, family contacts, map links, and upload your pre-wedding photos.",
              },
              {
                step: "2",
                title: "Select an Elegant Theme",
                desc: "Pick from our custom designs like Barcelona (modern parallax) or Classic ( Dimension overlays) and pick your palette.",
              },
              {
                step: "3",
                title: "Share and Track RSVPs",
                desc: "Publish to a unique custom link instantly. Guests open the link, RSVP on their phone, and you track guest counts.",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center space-y-4">
                <span className="w-12 h-12 rounded-full bg-[#855f18] text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {item.step}
                </span>
                <h3 className="font-serif text-lg font-bold">{item.title}</h3>
                <p className="text-xs text-[#666] leading-relaxed max-w-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------ TEMPLATES SHOWCASE ------------------ */}
      <section className="py-20 max-w-6xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-3xl font-bold">Curated Invitation Designs</h2>
          <p className="text-xs text-[#666] uppercase tracking-wider font-semibold">
            Ported from actual premium custom wedding sites
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {templates.map((temp) => (
            <div key={temp.id} className="bg-white border border-[#eae6df] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="aspect-video bg-[#f0ebd9] flex items-center justify-center border-b border-[#eae6df] relative">
                <span className="font-serif italic font-bold text-2xl text-[#855f18]/60">{temp.name}</span>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="font-serif text-xl font-bold">{temp.name} Theme</h3>
                <p className="text-xs text-[#666] leading-relaxed">{temp.description}</p>
                <Link
                  href="/templates"
                  className="inline-block text-xs font-bold text-[#855f18] uppercase tracking-wider hover:underline"
                >
                  View Details &amp; Preview &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------ FAQ SECTION ------------------ */}
      <section className="py-20 bg-white border-t border-[#eae6df] px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="text-xs text-[#666] uppercase tracking-wider font-semibold">Everything you need to know</p>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "Is GetMyInvite really free?",
                a: "Yes, it is 100% free. You can create, customize, preview, and publish your wedding website to a unique link without paying anything.",
              },
              {
                q: "Can I collect RSVPs from guests?",
                a: "Yes. Both templates feature a built-in guest RSVP form. Guests submit their response, and it updates instantly on your dashboard where you can see counts, preferences, and download CSV sheets.",
              },
              {
                q: "Can I update the details after publishing?",
                a: "Yes, you can edit your website settings, photos, dates, or stories at any time. Saving changes updates the live website immediately.",
              },
            ].map((faq, i) => (
              <div key={i} className="border-b border-[#eae6df] pb-6 space-y-2">
                <h4 className="font-serif text-md font-bold text-[#1a1a1a]">{faq.q}</h4>
                <p className="text-xs text-[#666] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------ FOOTER ------------------ */}
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
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://getmyinvite.in/#organization",
                "name": "GetMyInvite",
                "url": "https://getmyinvite.in",
              },
              {
                "@type": "WebSite",
                "@id": "https://getmyinvite.in/#website",
                "url": "https://getmyinvite.in",
                "name": "GetMyInvite",
                "publisher": {
                  "@id": "https://getmyinvite.in/#organization",
                },
              },
              {
                "@type": "SoftwareApplication",
                "name": "GetMyInvite Wedding Website Builder",
                "applicationCategory": "BrowserApplication",
                "operatingSystem": "All",
                "offers": {
                  "@type": "Offer",
                  "price": "0.00",
                  "priceCurrency": "INR",
                },
              },
              {
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "Is GetMyInvite really free?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes, it is 100% free. You can create, customize, preview, and publish your wedding website to a unique link without paying anything.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Can I collect RSVPs from guests?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes. Both templates feature a built-in guest RSVP form. Guests submit their response, and it updates instantly on your dashboard where you can see counts, preferences, and download CSV sheets.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Can I update the details after publishing?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes, you can edit your website settings, photos, dates, or stories at any time. Saving changes updates the live website immediately.",
                    },
                  },
                ],
              },
            ],
          }),
        }}
      />
    </div>
  );
}
