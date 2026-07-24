import React from "react";
import { InvitationData } from "@/lib/zod-schemas";
import { BarcelonaTemplate } from "./barcelona/BarcelonaTemplate";
import { ClassicTemplate } from "./classic/ClassicTemplate";

export interface ColorScheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
  cssVars: Record<string, string>;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  supportedSections: string[];
  fonts: {
    heading: string;
    body: string;
    script?: string;
  };
  colorSchemes: ColorScheme[];
  component: React.ComponentType<{ data: InvitationData; colorSchemeId: string; isPreview?: boolean }>;
}

export const templateRegistry: Record<string, Template> = {
  barcelona: {
    id: "barcelona",
    name: "Barcelona",
    description: "Modern parallax-based invitation with fluid scroll triggers and gorgeous media frames.",
    thumbnail: "/templates/barcelona-thumb.jpg",
    supportedSections: ["couple", "events", "gallery", "keyGuests", "contactPersons", "countdown"],
    fonts: {
      heading: "'Cormorant Garamond', serif",
      body: "'Josefin Sans', sans-serif",
      script: "'Great Vibes', cursive",
    },
    colorSchemes: [
      {
        id: "gold-light",
        name: "Vintage Gold",
        primary: "#855f18",
        secondary: "#e0c992",
        background: "#faf8f5",
        text: "#666666",
        accent: "#1a1a1a",
        cssVars: {
          "--gold": "#855f18",
          "--gold-light": "#e0c992",
          "--dark": "#1a1a1a",
          "--text": "#666666",
          "--bg-light": "#faf8f5",
          "--bg-cream": "#f5f0eb",
        },
      },
      {
        id: "burgundy-dark",
        name: "Imperial Wine",
        primary: "#5c061e",
        secondary: "#d9a05b",
        background: "#f9f5f0",
        text: "#444444",
        accent: "#2c2c2c",
        cssVars: {
          "--gold": "#5c061e",
          "--gold-light": "#d9a05b",
          "--dark": "#2c2c2c",
          "--text": "#444444",
          "--bg-light": "#f9f5f0",
          "--bg-cream": "#eedec9",
        },
      },
    ],
    component: BarcelonaTemplate,
  },
  classic: {
    id: "classic",
    name: "Classic",
    description: "Dimension style modal tab interface featuring immersive background music and loop video overlays.",
    thumbnail: "/templates/classic-thumb.jpg",
    supportedSections: ["couple", "events", "contactPersons", "keyGuests", "invitationCard", "videoBg", "audioMusic"],
    fonts: {
      heading: "'Merienda', serif",
      body: "'Meddon', serif",
      script: "'Pinyon Script', cursive",
    },
    colorSchemes: [
      {
        id: "mystic-dark",
        name: "Mystic Charcoal",
        primary: "#ffffff",
        secondary: "rgba(255, 255, 255, 0.5)",
        background: "rgba(19, 21, 25, 0.8)",
        text: "rgba(255, 255, 255, 0.75)",
        accent: "#e0c992",
        cssVars: {
          "--header-color": "#ffffff",
          "--body-color": "rgba(255, 255, 255, 0.75)",
          "--bg-color": "rgba(19, 21, 25, 0.8)",
          "--accent-color": "#e0c992",
        },
      },
      {
        id: "emerald-dark",
        name: "Emerald Night",
        primary: "#e8f5e9",
        secondary: "rgba(232, 245, 233, 0.5)",
        background: "rgba(12, 36, 20, 0.85)",
        text: "rgba(232, 245, 233, 0.8)",
        accent: "#ffd54f",
        cssVars: {
          "--header-color": "#e8f5e9",
          "--body-color": "rgba(232, 245, 233, 0.8)",
          "--bg-color": "rgba(12, 36, 20, 0.85)",
          "--accent-color": "#ffd54f",
        },
      },
    ],
    component: ClassicTemplate,
  },
};
