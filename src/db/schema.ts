import { pgTable, text, timestamp, boolean, integer, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==========================================
// BETTER AUTH SCHEMAS
// ==========================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  expiresAt: timestamp("expiresAt"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

// ==========================================
// GETMYINVITE SCHEMAS
// ==========================================

export const invitations = pgTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    templateId: text("template_id").notNull(),
    status: text("status").$type<"draft" | "published">().default("draft").notNull(),
    colorSchemeId: text("color_scheme_id").notNull(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("slug_idx").on(table.slug),
    index("user_invitation_idx").on(table.userId),
  ]
);

export const invitationContent = pgTable("invitation_content", {
  invitationId: text("invitation_id")
    .primaryKey()
    .references(() => invitations.id, { onDelete: "cascade" }),
  content: jsonb("content").notNull(), // Validated by InvitationContentSchema
});

export const rsvps = pgTable(
  "rsvps",
  {
    id: text("id").primaryKey(),
    invitationId: text("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    guestName: text("guest_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    attending: text("attending").$type<"yes" | "no" | "maybe">().notNull(),
    guestCount: integer("guest_count").default(1).notNull(),
    mealChoice: text("meal_choice"),
    message: text("message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("invitation_rsvp_idx").on(table.invitationId)]
);

export const assets = pgTable(
  "assets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    invitationId: text("invitation_id").references(() => invitations.id, { onDelete: "set null" }),
    r2Key: text("r2_key").notNull(),
    url: text("url").notNull(),
    width: integer("width"),
    height: integer("height"),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("user_assets_idx").on(table.userId)]
);

// ==========================================
// DRIZZLE RELATIONSHIPS
// ==========================================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  invitations: many(invitations),
  assets: many(assets),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const invitationRelations = relations(invitations, ({ one, many }) => ({
  user: one(user, { fields: [invitations.userId], references: [user.id] }),
  content: one(invitationContent, {
    fields: [invitations.id],
    references: [invitationContent.invitationId],
  }),
  rsvps: many(rsvps),
  assets: many(assets),
}));

export const invitationContentRelations = relations(invitationContent, ({ one }) => ({
  invitation: one(invitations, {
    fields: [invitationContent.invitationId],
    references: [invitations.id],
  }),
}));

export const rsvpRelations = relations(rsvps, ({ one }) => ({
  invitation: one(invitations, { fields: [rsvps.invitationId], references: [invitations.id] }),
}));

export const assetRelations = relations(assets, ({ one }) => ({
  user: one(user, { fields: [assets.userId], references: [user.id] }),
  invitation: one(invitations, { fields: [assets.invitationId], references: [invitations.id] }),
}));
