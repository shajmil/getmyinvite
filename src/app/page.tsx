import React from "react";
import { LuxuryHome, homeFaqs } from "@/components/marketing/LuxuryHome";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { templateRegistry } from "@/templates/registry";

import { Metadata, Viewport } from "next";

export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 5, userScalable: true };

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
    <>
      <LuxuryHome isLoggedIn={isLoggedIn} templates={templates.map(({ id, name, description }) => ({ id, name, description }))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Organization", "@id": "https://getmyinvite.in/#organization", name: "GetMyInvite", url: "https://getmyinvite.in" },
          { "@type": "WebSite", "@id": "https://getmyinvite.in/#website", name: "GetMyInvite", url: "https://getmyinvite.in", publisher: { "@id": "https://getmyinvite.in/#organization" } },
          { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://getmyinvite.in" }] },
          { "@type": "SoftwareApplication", name: "GetMyInvite Wedding Website Builder", applicationCategory: "BrowserApplication", operatingSystem: "All", offers: { "@type": "Offer", price: "0.00", priceCurrency: "INR" } },
          { "@type": "FAQPage", mainEntity: homeFaqs.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
        ],
      }) }} />
    </>
  );
}
