import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EternalJourneyTemplate } from "./EternalJourneyTemplate";
import { demoInvitationData } from "../demo-data";

function render(data = structuredClone(demoInvitationData), colorSchemeId = "eternal-champagne") {
  return renderToStaticMarkup(<EternalJourneyTemplate data={data} colorSchemeId={colorSchemeId} isPreview />);
}

describe("Eternal Journey invitation integration", () => {
  it("renders configured names, custom events, venue and all timeline milestones", () => {
    const data = structuredClone(demoInvitationData);
    data.partner1.firstName = "Avery";
    data.partner2.firstName = "Morgan";
    data.events = [{ id: "custom", name: "Garden brunch", date: "2027-04-18", time: "10:30", venue: "The Orchard", note: "Bring your favourite hat" }];
    data.story = { timeline: [{ id: "first", date: "Spring 2020", title: "A chance encounter", text: "We met on a train." }] };
    const html = render(data);
    for (const text of ["Avery", "Morgan", "Garden brunch", "10:30 AM", "The Orchard", "Bring your favourite hat", "Spring 2020", "A chance encounter", "We met on a train.", data.wedding.venue.address]) expect(html).toContain(text);
  });

  it("omits missing optional sections and disabled RSVP without inventing content", () => {
    const data = structuredClone(demoInvitationData);
    data.story = undefined;
    data.gallery = [];
    data.events = [];
    data.hero = {};
    data.rsvpConfig.enabled = false;
    const html = render(data);
    expect(html).not.toContain('id="journey-rsvp"');
    expect(html).not.toContain('aria-label="Photo gallery"');
    expect(html).not.toContain('aria-label="Love story timeline"');
    expect(html).not.toContain("How we met");
    expect(html).not.toContain("The celebrations.");
    expect(html).toContain(data.wedding.venue.name);
  });

  it("preserves gallery order without mutating invitation data", () => {
    const data = structuredClone(demoInvitationData);
    data.gallery = [{ url: "/later.jpg", order: 2, alt: "Later memory" }, { url: "/first.jpg", order: 1, alt: "First memory" }];
    const html = render(data);
    expect(html.indexOf("View photograph 1: First memory")).toBeLessThan(html.indexOf("View photograph 2: Later memory"));
    expect(data.gallery[0].url).toBe("/later.jpg");
  });

  it("reuses RSVP configuration and preview safeguards", () => {
    const data = structuredClone(demoInvitationData);
    data.rsvpConfig = { enabled: true, allowPlusOnes: false, mealChoices: ["Vegetarian"], customQuestion: "Your favourite song?" };
    const html = render(data);
    expect(html).toContain("Preview mode");
    expect(html).toContain("Vegetarian");
    expect(html).toContain("Your favourite song?");
    expect(html).not.toContain('name="guestCount"');
  });

  it("falls back to the default palette and rejects unsafe map links", () => {
    const data = structuredClone(demoInvitationData);
    data.wedding.venue.mapUrl = "javascript:alert(1)";
    const html = render(data, "old-palette-id");
    expect(html).toContain("--ej-paper:#f8f5ee");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("Find your way");
  });
});
