import React from "react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kerala Wedding Invitation Website Builder | GetMyInvite",
  description: "Build the perfect Kerala wedding invitation website. Custom digital cards with Malayalam fonts, Sadya menus, mandapam maps, and RSVP trackers.",
  alternates: {
    canonical: "https://getmyinvite.in/kerala-wedding-invitation-website",
  },
  openGraph: {
    title: "Kerala Wedding Invitation Website Builder | GetMyInvite",
    description: "Build the perfect Kerala wedding invitation website. Custom digital cards with Malayalam fonts, Sadya menus, mandapam maps, and RSVP trackers.",
    url: "https://getmyinvite.in/kerala-wedding-invitation-website",
    type: "website",
  },
};

export default function KeralaLandingPage() {
  const faqs = [
    {
      q: "Can I display Guruvayur or temple event timings on the site?",
      a: "Yes. Our templates let you create multiple timeline entries for traditional pre-wedding events, temple Muhurtham, and reception banquets, complete with custom dates, timings, and map location directions.",
    },
    {
      q: "Is it possible to share the Sadhya menu card?",
      a: "Absolutely. You can add custom event timeline sections or description cards outlining the traditional Kerala Sadhya menu details directly on the invitation template.",
    },
    {
      q: "How do guests RSVP for Kerala wedding venues?",
      a: "Guests open your custom GetMyInvite link on their phones, fill out their details, and submit their attendance status. The RSVP dashboard updates instantly.",
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
            Kerala Wedding Invitation Website: Custom Digital Invitations
          </h1>
          <p className="text-sm text-[#666] max-w-xl mx-auto leading-relaxed">
            Create an elegant online home for your traditional Kerala wedding. Share event details, temple venue directions, RSVP confirmations, and photo highlights instantly.
          </p>
        </div>

        {/* Feature Copy Sections - 600+ words target */}
        <article className="prose prose-sm max-w-none text-[#333] space-y-6 leading-relaxed">
          <p>
            Planning a traditional wedding in Kerala requires coordinating multiple events—from the intimate family-only Muhurtham inside historic temples like Guruvayur or Vadakkumnathan, to massive reception gatherings in Kochi, Trivandrum, or Kozhikode. Relying entirely on paper cards makes it challenging to share exact locations or track guest counts.
          </p>
          
          <h3 className="font-serif text-xl font-bold text-[#1a1a1a] pt-4">Highlight Traditional Details & Temple Timings</h3>
          <p>
            Our specialized digital invitations allow you to map out your entire event timeline. Specify the precise timings of the auspicious Thalikettu (tying the knot) alongside detailed maps guiding family members directly to the temple mandapam or auditorium hall. You can add local contact phone numbers and transport notes to help out-of-state guests navigate to your venue comfortably.
          </p>

          <h3 className="font-serif text-xl font-bold text-[#1a1a1a] pt-4">Outline the Sadhya Menu & Event Highlights</h3>
          <p>
            One of the highlights of any Kerala wedding ceremony is the grand Sadya feast. Our builder lets you write descriptions highlighting the items, including special paysams or custom caterer names, to build excitement among your wedding guests. You can also showcase photos from your pre-wedding shoot in the backwaters of Alappuzha or the hills of Munnar, building a personalized page that tells your unique story.
          </p>

          <h3 className="font-serif text-xl font-bold text-[#1a1a1a] pt-4">Seamless RSVP Management for Big Families</h3>
          <p>
            Kerala weddings frequently feature guest counts extending into the thousands. Managing who is attending becomes effortless with our mobile-friendly RSVP tracking system. Guests simply open the site link on their phone, confirm their attendance, choose food preferences, and submit. You can view all RSVPs directly inside your GetMyInvite admin dashboard, allowing you to estimate catering plate counts accurately.
          </p>

          <h3 className="font-serif text-xl font-bold text-[#1a1a1a] pt-4">Pick Responsive Parallax Layouts</h3>
          <p>
            Choose between premium, dynamic templates built with custom colors to match your theme—whether it is classic gold to match traditional Kasavu sarees, charcoal black, or emerald green. Our templates load instantly and work flawlessly on all smartphones, ensuring that older relatives can access maps and event details without any technical hurdles.
          </p>
        </article>

        {/* Call To Action */}
        <div className="bg-white border border-[#eae6df] p-8 rounded-2xl text-center space-y-6 shadow-sm">
          <h3 className="font-serif text-2xl font-bold">Ready to design your wedding website?</h3>
          <p className="text-xs text-[#666] max-w-md mx-auto leading-relaxed">
            Create your account today, fill out your names, venue details, and photos, and choose from our premium invitation themes. Live preview your site for free.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/templates"
              className="px-6 py-3 bg-[#855f18] text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-[#6c4c12] transition-colors"
            >
              Start Creating Now
            </Link>
            <Link
              href="/templates"
              className="px-6 py-3 border border-[#eae6df] hover:bg-[#faf8f5] text-xs font-bold uppercase tracking-wider rounded transition-colors"
            >
              Browse Invitation Themes
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
