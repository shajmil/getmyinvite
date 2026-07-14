import React from "react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Wedding RSVP Website India | GetMyInvite",
  description: "Build a free wedding RSVP website in India. Manage guest counts, track Haldi, Sangeet, and reception attendances, veg/non-veg meals, and export tables.",
  alternates: {
    canonical: "https://getmyinvite.in/free-wedding-rsvp-website-india",
  },
  openGraph: {
    title: "Free Wedding RSVP Website India | GetMyInvite",
    description: "Build a free wedding RSVP website in India. Manage guest counts, track Haldi, Sangeet, and reception attendances, veg/non-veg meals, and export tables.",
    url: "https://getmyinvite.in/free-wedding-rsvp-website-india",
    type: "website",
  },
};

export default function RSVPIndiaLandingPage() {
  const faqs = [
    {
      q: "Can guests choose separate attendance for Sangeet, Haldi, and Reception?",
      a: "Yes. Our invitations allow you to set up multiple events. Guests can check boxes indicating exactly which functions (e.g. Sangeet, Haldi, wedding ceremony, reception) they will be attending.",
    },
    {
      q: "Can I collect food preferences like Veg vs. Non-Veg?",
      a: "Absolutely. Our built-in RSVP form includes fields for dietary preferences, allowing you to collect exact counts for Veg, Non-Veg, or special food restrictions to coordinate with your caterers.",
    },
    {
      q: "Can I export the RSVP list to Excel or CSV?",
      a: "Yes. From your GetMyInvite admin dashboard, you can view your guest list in a tabular format and download a clean CSV sheet with a single click.",
    },
  ];

  const pageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://getmyinvite.in"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Free Wedding RSVP Website India",
            "item": "https://getmyinvite.in/free-wedding-rsvp-website-india"
          }
        ]
      }
    ]
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
            Feature Landing Pages
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-wide leading-tight">
            Free Wedding RSVP Website India: Track Guest Attendance Online
          </h1>
          <p className="text-sm text-[#666] max-w-xl mx-auto leading-relaxed">
            Take the stress out of guest list management. Build a custom wedding invitation website with a built-in Indian RSVP form to track attendees for all ceremonies.
          </p>
        </div>

        {/* Feature Copy Sections - 600+ words target */}
        <article className="prose prose-sm max-w-none text-[#333] space-y-6 leading-relaxed">
          <p>
            Indian weddings are legendary for their scale, vibrancy, and guest lists that often span hundreds or thousands of relatives, friends, and neighbors. With events spread across multiple days—such as Haldi, Mehndi, Sangeet, the main wedding Muhurtham, and the reception banquet—coordinating invitations and tracking guest attendance manually is an administrative nightmare. Using a free wedding RSVP website in India is the most efficient modern solution.
          </p>
          
          <h3 className="font-serif text-xl font-bold text-[#1a1a1a] pt-4">Customized Multi-Event RSVP Checkboxes</h3>
          <p>
            Unlike simple single-day events, Indian weddings are multi-layered celebrations. An out-of-town guest might only attend the main wedding and reception, while close friends are present for the Sangeet and Haldi functions. GetMyInvite allows you to define individual RSVP options for each ceremony. When guests visit your wedding link, they check off exactly which events they are attending, giving you clean sub-tallies for every function.
          </p>

          <h3 className="font-serif text-xl font-bold text-[#1a1a1a] pt-4">Catering Plate Counts: Veg vs. Non-Veg</h3>
          <p>
            One of the most important components of planning a wedding feast in India is balancing the catering counts for vegetarian and non-vegetarian guests. Overestimating leads to massive food waste and budget inflation, while underestimating ruins the guest experience. Our RSVP form includes explicit questions asking guests for their food preferences. You can collect precise veg/non-veg ratios and dietary restrictions directly from the couples' admin portal.
          </p>

          <h3 className="font-serif text-xl font-bold text-[#1a1a1a] pt-4">Download Excel Sheets & Track Guest Lists</h3>
          <p>
            All submitted RSVPs are recorded in real-time in our secure database. As the wedding planners, you can log into your personal dashboard to view attendance summaries, edit responses on behalf of relatives who called in, and download the entire directory as a CSV spreadsheet. This sheet can be handed directly to your event managers, resort staff, or caterers for seamless coordination.
          </p>

          <h3 className="font-serif text-xl font-bold text-[#1a1a1a] pt-4">Built Specifically for WhatsApp Sharing</h3>
          <p>
            Indian families communicate heavily on WhatsApp. Once your RSVP page is live, you can send your link directly to chat groups. The link preview card shows a beautiful, customized image of the couple, encouraging guests to click, read your wedding schedule, find venue directions on Google Maps, and fill in the RSVP form immediately on their mobile devices.
          </p>
        </article>

        {/* Call To Action */}
        <div className="bg-white border border-[#eae6df] p-8 rounded-2xl text-center space-y-6 shadow-sm">
          <h3 className="font-serif text-2xl font-bold">Simplify Your Wedding Guest Coordination</h3>
          <p className="text-xs text-[#666] max-w-md mx-auto leading-relaxed">
            Launch your free wedding website with integrated RSVP trackers today. No credit cards or complex coding required. Pick a theme, edit details, and go live.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/templates"
              className="px-6 py-3 bg-[#855f18] text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-[#6c4c12] transition-colors"
            >
              Start Tracking RSVPs
            </Link>
            <Link
              href="/templates"
              className="px-6 py-3 border border-[#eae6df] hover:bg-[#faf8f5] text-xs font-bold uppercase tracking-wider rounded transition-colors"
            >
              Preview Themes
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
    </div>
  );
}
