import { describe, expect, it } from "vitest";
import { isInvitationExpired } from "./invitation-expiry";

const now = new Date("2026-11-05T12:00:00Z");

function published(weddingDate: string, eventDates: string[] = []) {
  return {
    status: "published" as const,
    createdAt: new Date("2026-01-01"),
    content: { wedding: { date: weddingDate }, events: eventDates.map((date) => ({ date })) },
  };
}

describe("invitation retention", () => {
  it("expires an invitation only after the last event is more than seven days past", () => {
    expect(isInvitationExpired(published("2026-10-01", ["2026-10-20", "2026-10-28"]), now)).toBe(true);
    expect(isInvitationExpired(published("2026-10-01", ["2026-11-10"]), now)).toBe(false);
    expect(isInvitationExpired(published("2026-10-01", ["2026-10-30"]), now)).toBe(false);
  });

  it("keeps the invitation at the seven-day boundary", () => {
    expect(isInvitationExpired(published("2026-10-29"), now)).toBe(false);
  });

  it("includes the main wedding even if listed events are earlier", () => {
    expect(isInvitationExpired(published("2026-12-01", ["2026-10-01"]), now)).toBe(false);
  });

  it("supports older invitations without an events array", () => {
    expect(isInvitationExpired({ ...published("2026-10-01"), content: { wedding: { date: "2026-10-01" } } }, now)).toBe(true);
  });

  it.each(["", "not-a-date", "2026-02-30"])("preserves invitations with an invalid event date: %s", (date) => {
    expect(isInvitationExpired(published("2026-10-01", [date]), now)).toBe(false);
  });

  it("preserves published invitations with missing content", () => {
    expect(isInvitationExpired({ ...published("2026-10-01"), content: null }, now)).toBe(false);
  });

  it("expires old drafts independently of event dates", () => {
    expect(isInvitationExpired({ ...published("2027-01-01"), status: "draft" }, now)).toBe(true);
    expect(isInvitationExpired({ ...published("2026-10-01"), status: "draft", createdAt: now }, now)).toBe(false);
  });
});
