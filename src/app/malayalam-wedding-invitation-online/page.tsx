import React from "react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Malayalam Wedding Invitation Online | GetMyInvite",
  description: "Create an elegant Malayalam wedding invitation online. Design digital cards with Malayalam text support, Kalyana Kuri details, maps, and RSVPs.",
  alternates: {
    canonical: "https://getmyinvite.in/malayalam-wedding-invitation-online",
  },
  openGraph: {
    title: "Malayalam Wedding Invitation Online | GetMyInvite",
    description: "Create an elegant Malayalam wedding invitation online. Design digital cards with Malayalam text support, Kalyana Kuri details, maps, and RSVPs.",
    url: "https://getmyinvite.in/malayalam-wedding-invitation-online",
    type: "website",
  },
};

export default function MalayalamLandingPage() {
  const faqs = [
    {
      q: "Can I write my invitation text entirely in Malayalam?",
      a: "Yes. Our text fields fully support Unicode Malayalam typography. You can write custom headers, venue names, family greetings, and greeting phrases like 'സ്നേഹപൂർവ്വം ക്ഷണിക്കുന്നു' without any rendering errors.",
    },
    {
      q: "Can I upload my physical Kalyana Kuri design?",
      a: "Yes. You can upload digital renders of your wedding card, traditional icons, or family photos directly into the builder's image gallery section.",
    },
    {
      q: "How does the RSVP form handle guest limits?",
      a: "The RSVP form allows guests to verify how many members from their household are attending the wedding, helping you manage seating layouts for large receptions.",
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a,
      },
    })),
  };

  return (
    <div className="flex-1 flex flex-col bg-[#faf8f5] text-[#1a1a1a] font-sans selection:bg-[#eae6df]">
      {/* Header */}
      <header className="h-20 bg-white border-b border-[#eae6df] px-6">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-bold tracking-wide">
            GetMyInvite
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-xs font-bold uppercase tracking-wider hover:text-[#855f18]">
              Home
            </Link>
            <Link href="/templates" className="text-xs font-bold uppercase tracking-wider hover:text-[#855f18]">
              Templates
            </Link>
            <Link
              href="/templates"
              className="px-4 py-2 bg-[#855f18] text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-[#6c4c12] transition-colors"
            >
              Start Building
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        <div className="space-y-4 text-center">
          <span className="inline-block px-4 py-1 bg-[#855f18]/10 text-[#855f18] text-xs font-bold rounded-full uppercase tracking-wider">
            Regional Invitation Builders
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-wide leading-tight">
            Malayalam Wedding Invitation Online: Build Custom Digital Cards
          </h1>
          <p className="text-sm text-[#666] max-w-xl mx-auto leading-relaxed">
            Design your custom online wedding website with full Malayalam text support. Share your traditional invitations (Kalyana Kuri) with guests on WhatsApp instantly.
          </p>
        </div>

        {/* Feature Copy Sections - 600+ words target */}
        <article className="prose prose-sm max-w-none text-[#333] space-y-6 leading-relaxed">
          <p>
            The traditional wedding card in Kerala, often referred to as the Kalyana Kuri, has always been the cornerstone of inviting friends and relatives. Today, couples are looking for modern alternatives that allow them to share invitations instantly over mobile messaging apps like WhatsApp. Building a Malayalam wedding invitation online provides the perfect blend of tradition and convenience.
          </p>
          
          <h3 className="font-serif text-xl font-bold text-[#1a1a1a] pt-4">Full Typography Support for Malayalam Text</h3>
          <p>
            A common issue with many global wedding website builders is their poor support for regional Indian fonts and scripts. GetMyInvite is built with comprehensive Unicode compatibility, allowing you to write your invitation greetings, event highlights, and welcome quotes entirely in Malayalam. Welcome your relatives with classic greeting phrases like "വിവാഹ മംഗള കർമ്മങ്ങളിലേക്ക് സ്നേഹപൂർവ്വം ക്ഷണിക്കുന്നു" and detail your parents' names, family names (Tharavadu), and background stories without formatting errors.
          </p>

          <h3 className="font-serif text-xl font-bold text-[#1a1a1a] pt-4">Coordinate Receptions and Auspicious Muhurthams</h3>
          <p>
            Kerala weddings often involve multiple venues across different cities—such as a morning temple ceremony followed by a grand evening reception in a completely different convention hall. Our digital invitation builder makes it easy to divide your website into clear event cards. You can configure individual timers, upload separate cover photos, and attach navigation buttons linking directly to Google Maps or Apple Maps, ensuring that your guests never get lost on their way.
          </p>

          <h3 className="font-serif text-xl font-bold text-[#1a1a1a] pt-4">Direct WhatsApp Sharing & Live RSVPs</h3>
          <p>
            Once you customize and publish your invitation website, you get a unique, live web address (e.g., `getmyinvite.in/couple-name`). Sharing this link on WhatsApp renders a beautiful rich link preview displaying your names and wedding date. Guests can view your invitation page, read your love story, browse photo galleries, and RSVP within seconds. You receive instant notifications and can view all guest tallies in a centralized admin board.
          </p>

          <h3 className="font-serif text-xl font-bold text-[#1a1a1a] pt-4">Premium Parallax Themes for Modern Couples</h3>
          <p>
            Whether you prefer a minimalist layouts style or a media-heavy design featuring music loops and backwater engagement photos, we have templates ready for you. Our layouts are optimized to load lightning-fast even on slower mobile network connections, giving your guests a smooth scrolling experience.
          </p>
        </article>

        {/* Call To Action */}
        <div className="bg-white border border-[#eae6df] p-8 rounded-2xl text-center space-y-6 shadow-sm">
          <h3 className="font-serif text-2xl font-bold">Start Designing Your Online Kalyana Kuri</h3>
          <p className="text-xs text-[#666] max-w-md mx-auto leading-relaxed">
            It takes less than 5 minutes to set up your online wedding page. Pick a layout, input your dates, write in Malayalam or English, and publish for free.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/templates"
              className="px-6 py-3 bg-[#855f18] text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-[#6c4c12] transition-colors"
            >
              Build Invitation Online
            </Link>
            <Link
              href="/templates"
              className="px-6 py-3 border border-[#eae6df] hover:bg-[#faf8f5] text-xs font-bold uppercase tracking-wider rounded transition-colors"
            >
              Browse Themes
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="space-y-6 pt-8 border-t border-[#eae6df]">
          <h3 className="font-serif text-2xl font-bold text-center">Frequently Asked Questions</h3>
          <div className="space-y-6 max-w-2xl mx-auto">
            {faqs.map((faq, idx) => (
              <div key={idx} className="space-y-2 border-b border-[#eae6df] pb-4">
                <h4 className="font-serif text-md font-bold text-[#1a1a1a]">{faq.q}</h4>
                <p className="text-xs text-[#666] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-[#eae6df] text-center text-xs text-[#666] uppercase tracking-wider space-y-2">
        <p>&copy; {new Date().getFullYear()} GetMyInvite. All rights reserved.</p>
        <div className="flex justify-center gap-4 text-[10px] text-gray-400 font-semibold lowercase">
          <Link href="/" className="hover:underline">Home</Link>
          <span>•</span>
          <Link href="/templates" className="hover:underline">Templates</Link>
        </div>
      </footer>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </div>
  );
}
