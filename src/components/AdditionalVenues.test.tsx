import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AdditionalVenues } from "./AdditionalVenues";
import { InvitationContentSchema, type AdditionalVenue } from "@/lib/zod-schemas";
import { demoInvitationData } from "@/templates/demo-data";
import { useWizardStore } from "@/lib/store";

vi.mock("@/templates/fonts", () => Object.fromEntries(
  ["cormorant", "josefin", "greatVibes", "merienda", "meddon", "pinyon", "lavishly"].map((name) => [name, { variable: "", className: "" }])
));

import { templateRegistry } from "@/templates/registry";

const receptionVenue: AdditionalVenue = {
  id: "reception-venue",
  label: "Reception",
  name: "Rose Garden Hall",
  address: "42 Garden Road",
  city: "Kochi",
  mapUrl: "https://maps.example.com/reception",
};

afterEach(() => useWizardStore.setState({ data: null }));

describe("optional additional wedding venues", () => {
  it("accepts existing invitations with only a main venue and renders nothing extra", () => {
    const invitation = InvitationContentSchema.parse(demoInvitationData);
    expect(invitation.wedding.additionalVenues).toBeUndefined();
    expect(renderToStaticMarkup(<AdditionalVenues />)).toBe("");
    expect(renderToStaticMarkup(<AdditionalVenues venues={[]} />)).toBe("");
  });

  it("preserves the main venue, date and time when saving and removing extra venues", () => {
    const invitation = structuredClone(demoInvitationData);
    useWizardStore.getState().setData(invitation);
    useWizardStore.getState().updateNestedData("wedding", { additionalVenues: [receptionVenue] });
    const saved = InvitationContentSchema.parse(JSON.parse(JSON.stringify(useWizardStore.getState().data)));
    expect(saved.wedding.venue).toEqual(invitation.wedding.venue);
    expect(saved.wedding.date).toBe(invitation.wedding.date);
    expect(saved.wedding.time).toBe(invitation.wedding.time);
    expect(saved.wedding.additionalVenues).toEqual([receptionVenue]);
    useWizardStore.getState().updateNestedData("wedding", { additionalVenues: [] });
    expect(useWizardStore.getState().data?.wedding.venue).toEqual(invitation.wedding.venue);
    expect(useWizardStore.getState().data?.wedding.additionalVenues).toEqual([]);
  });

  it("renders multiple locations but skips unnamed drafts and unsafe direction links", () => {
    const markup = renderToStaticMarkup(<AdditionalVenues venues={[
      receptionVenue,
      { ...receptionVenue, id: "second", name: "Family Home", label: "Welcome gathering", mapUrl: "javascript:alert(1)" },
      { ...receptionVenue, id: "blank", name: "  ", label: "Unfinished venue" },
    ]} />);
    expect(markup).toContain("Rose Garden Hall");
    expect(markup).toContain("Family Home");
    expect(markup).toContain("42 Garden Road");
    expect(markup).toContain('href="https://maps.example.com/reception"');
    expect(markup).not.toContain("javascript:");
    expect(markup).not.toContain("Unfinished venue");
  });

  it.each(["barcelona", "aurelia", "eternal-journey", "nocturne"])("includes additional venues in the %s invitation", (templateId) => {
    const invitation = structuredClone(demoInvitationData);
    invitation.wedding.additionalVenues = [receptionVenue];
    const template = templateRegistry[templateId];
    const TemplateComponent = template.component;
    const markup = renderToStaticMarkup(<TemplateComponent data={invitation} colorSchemeId={template.colorSchemes[0].id} isPreview />);
    expect(markup).toContain(invitation.wedding.venue.name);
    expect(markup).toContain("Rose Garden Hall");
    expect(markup).toContain('aria-label="Get directions to Rose Garden Hall"');
  });
});
