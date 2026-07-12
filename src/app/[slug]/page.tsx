import { notFound } from "next/navigation";
import React from "react";
import { getInvitationBySlug } from "@/db/queries/invitation";
import { templateRegistry } from "@/templates/registry";
import Link from "next/link";

export const dynamicParams = true;

// Force Next.js 15 to build nothing at build-time, rendering all slugs on-demand (ISR fallback)
export async function generateStaticParams() {
  return [];
}

interface SlugPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: SlugPageProps) {
  const { slug } = await props.params;
  const invitation = await getInvitationBySlug(slug);

  if (!invitation) {
    return {
      title: "Invitation Not Found | MakeMyInvite",
      robots: "noindex, nofollow",
    };
  }

  const names = `${invitation.content.partner1.firstName} & ${invitation.content.partner2.firstName}`;
  const dateFormatted = new Date(invitation.content.wedding.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const ogUrl = new URL(`${appUrl}/api/og`);
  ogUrl.searchParams.set("names", names);
  ogUrl.searchParams.set("date", dateFormatted);
  if (invitation.content.coupleTagline) {
    ogUrl.searchParams.set("tagline", invitation.content.coupleTagline);
  }

  return {
    title: `${names} — ${dateFormatted}`,
    description: invitation.content.coupleTagline || `You are cordially invited to celebrate the wedding of ${names} on ${dateFormatted}.`,
    openGraph: {
      title: `${names} — ${dateFormatted}`,
      description: invitation.content.coupleTagline || `Celebrate with us on ${dateFormatted}!`,
      type: "website",
      url: `${appUrl}/${slug}`,
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: `${names} Wedding Invitation`,
        },
      ],
    },
  };
}

export default async function PublishedSlugPage(props: SlugPageProps) {
  const { slug } = await props.params;
  const invitation = await getInvitationBySlug(slug);

  if (!invitation) {
    // Elegant Custom 404
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f5] px-4 text-center">
        <span className="text-5xl mb-4">🕊️</span>
        <h1 className="font-serif text-3xl font-bold text-[#1a1a1a] mb-2">Invitation Not Found</h1>
        <p className="text-sm text-[#666] max-w-sm mb-8 leading-relaxed">
          This invitation has not been published yet or the link is incorrect.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-[#855f18] text-white hover:bg-[#6c4c12] text-xs font-bold rounded-lg uppercase tracking-wider transition-all shadow-md"
        >
          Create Your Own Invitation
        </Link>
      </main>
    );
  }

  const templateEntry = templateRegistry[invitation.templateId] || templateRegistry.barcelona;
  const TemplateComponent = templateEntry.component;

  // Add invitationId to content for form submissions
  const dataWithId = {
    ...invitation.content,
    invitationId: invitation.id,
  };

  // Generate Calendar links
  const title = `${invitation.content.partner1.firstName} & ${invitation.content.partner2.firstName} Wedding`;
  const dateStr = invitation.content.wedding.date.replace(/-/g, "");
  const timeStr = invitation.content.wedding.time.replace(/:/g, "") + "00";
  const startDateTime = `${dateStr}T${timeStr}`;
  // Fallback 4 hours end
  const endDateTime = `${dateStr}T200000`;

  // 1. Google Calendar Link
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&dates=${startDateTime}/${endDateTime}&details=${encodeURIComponent(
    invitation.content.coupleTagline || "Join us in our celebrations!"
  )}&location=${encodeURIComponent(
    `${invitation.content.wedding.venue.name}, ${invitation.content.wedding.venue.address}`
  )}`;

  // 2. ICS Content
  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MakeMyInvite//NONSGML Wedding Invite//EN",
    "BEGIN:VEVENT",
    `UID:${slug}@makemyinvite.app`,
    `DTSTAMP:${dateStr}T000000Z`,
    `DTSTART:${startDateTime}`,
    `DTEND:${endDateTime}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${invitation.content.coupleTagline || "Join us to celebrate our wedding!"}`,
    `LOCATION:${invitation.content.wedding.venue.name}, ${invitation.content.wedding.venue.address}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const icsDataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsLines.join("\r\n"))}`;

  return (
    <div className="relative flex-1 min-h-screen">
      {/* Universal Floating Add-To-Calendar Action Bar */}
      <div className="fixed bottom-6 left-6 z-40 bg-white/90 backdrop-blur-md border border-[#eae6df] px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3">
        <span className="text-xs font-semibold text-[#1a1a1a] flex items-center gap-1.5">
          📅 Add to Calendar:
        </span>
        <a
          href={googleCalendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#855f18] hover:underline font-bold"
        >
          Google
        </a>
        <span className="text-gray-300">|</span>
        <a
          href={icsDataUri}
          download={`${slug}-wedding.ics`}
          className="text-xs text-[#855f18] hover:underline font-bold"
        >
          iCal / Outlook (.ics)
        </a>
      </div>

      <TemplateComponent data={dataWithId} colorSchemeId={invitation.colorSchemeId} />
    </div>
  );
}
