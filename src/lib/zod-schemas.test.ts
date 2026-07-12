import { describe, it, expect } from "vitest";
import { InvitationSlugSchema } from "./zod-schemas";

describe("InvitationSlugSchema", () => {
  it("should accept valid lower-case hyphenated slugs", () => {
    const valid = ["arun-meera", "john-doe-2026", "wedding-day", "celebrate123"];
    valid.forEach((slug) => {
      const result = InvitationSlugSchema.safeParse(slug);
      expect(result.success).toBe(true);
    });
  });

  it("should reject slugs containing capital letters or special symbols", () => {
    const invalid = ["Arun-Meera", "wedding_day", "john.doe", "meera&arun", "wedding!"];
    invalid.forEach((slug) => {
      const result = InvitationSlugSchema.safeParse(slug);
      expect(result.success).toBe(false);
    });
  });

  it("should reject slugs that are too short or too long", () => {
    const invalid = [
      "ab", // Too short (min 3)
      "a-really-long-slug-path-that-exceeds-thirty-characters-limit-bounds", // Too long (max 30)
    ];
    invalid.forEach((slug) => {
      const result = InvitationSlugSchema.safeParse(slug);
      expect(result.success).toBe(false);
    });
  });

  it("should reject reserved blocklisted route words", () => {
    const blocklisted = ["admin", "dashboard", "api", "sign-in", "sign-up", "settings"];
    blocklisted.forEach((slug) => {
      const result = InvitationSlugSchema.safeParse(slug);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("This slug is reserved or unavailable");
      }
    });
  });
});
