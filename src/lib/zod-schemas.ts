import { z } from "zod";

export const PartnerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  photo: z.string().url("Must be a valid photo URL").optional().or(z.literal("")),
  parents: z.string().optional().or(z.literal("")),
  facebookUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const VenueSchema = z.object({
  name: z.string().min(1, "Venue name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  mapUrl: z.string().url("Must be a valid Google Maps URL").optional().or(z.literal("")),
  lat: z.number().optional(),
  lng: z.number().optional(),
  photo: z.string().url("Must be a valid URL").optional().or(z.literal("")), // Extended for Template 2 venue photo
});

export const EventSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Event name is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  venue: z.string().min(1, "Venue name is required"),
  dressCode: z.string().optional().or(z.literal("")),
  note: z.string().optional().or(z.literal("")),
  photo: z.string().url("Must be a valid URL").optional().or(z.literal("")), // Extended for Template 1 event photos
});

export const StoryTimelineSchema = z.object({
  id: z.string(),
  date: z.string().min(1, "Date/Period is required"),
  title: z.string().min(1, "Title is required"),
  text: z.string().min(1, "Story text is required"),
  photo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const StorySchema = z.object({
  howWeMet: z.string().optional().or(z.literal("")),
  proposal: z.string().optional().or(z.literal("")),
  timeline: z.array(StoryTimelineSchema).default([]),
});

export const GalleryImageSchema = z.object({
  url: z.string().url("Must be a valid image URL"),
  alt: z.string().optional().or(z.literal("")),
  order: z.number(),
});

export const HeroSchema = z.object({
  mainPhoto: z.string().url("Must be a valid image URL").optional().or(z.literal("")),
  quote: z.string().optional().or(z.literal("")),
  videoUrl: z.string().url("Must be a valid video URL").optional().or(z.literal("")), // Extended for Template 2 background video
  musicUrl: z.string().url("Must be a valid audio URL").optional().or(z.literal("")), // Extended for Template 2 background music
  invitationCardUrl: z.string().url("Must be a valid invitation card image URL").optional().or(z.literal("")), // Extended for Template 2 card
});

export const RSVPConfigSchema = z.object({
  enabled: z.boolean().default(true),
  deadline: z.string().optional().or(z.literal("")),
  allowPlusOnes: z.boolean().default(true),
  mealChoices: z.array(z.string()).optional(),
  customQuestion: z.string().optional().or(z.literal("")),
});

export const ContactPersonSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  role: z.string().min(1, "Role is required"),
  photo: z.string().url("Must be a valid photo URL").optional().or(z.literal("")), // Extended for Template 2 avatars
});

export const KeyGuestSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  photo: z.string().url("Must be a valid photo URL").optional().or(z.literal("")),
  relationship: z.string().optional().or(z.literal("")), // Bridesmaid, Groomsman
});

export const ExtrasSchema = z.object({
  dressCode: z.string().optional().or(z.literal("")),
  giftNote: z.string().optional().or(z.literal("")),
  hashtag: z.string().optional().or(z.literal("")),
  contactPersons: z.array(ContactPersonSchema).default([]),
  keyGuests: z.array(KeyGuestSchema).default([]), // Extended for Template 1 Sharing Happiness
  footerMessage: z.string().optional().or(z.literal("")),
});

export const InvitationContentSchema = z.object({
  partner1: PartnerSchema,
  partner2: PartnerSchema,
  coupleTagline: z.string().optional().or(z.literal("")),
  wedding: z.object({
    date: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
    timezone: z.string().min(1, "Timezone is required"),
    venue: VenueSchema,
  }),
  events: z.array(EventSchema).default([]),
  story: StorySchema.optional(),
  gallery: z.array(GalleryImageSchema).max(20).default([]),
  hero: HeroSchema,
  rsvpConfig: RSVPConfigSchema,
  extras: ExtrasSchema,
});

export type InvitationData = z.infer<typeof InvitationContentSchema>;

// Slug validation regex
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const blocklistedSlugs = [
  "admin",
  "api",
  "dashboard",
  "sign-in",
  "sign-up",
  "forgot-password",
  "settings",
  "pricing",
  "templates",
  "auth",
  "revalidate",
  "rsvp",
  "uploads",
  "check-slug",
];

export const InvitationSlugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(30, "Slug must be at most 30 characters")
  .regex(SLUG_REGEX, "Slug can only contain lowercase letters, numbers, and hyphens (e.g. arun-meera)")
  .refine((slug) => !blocklistedSlugs.includes(slug), "This slug is reserved or unavailable");
