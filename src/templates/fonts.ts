import { Cormorant_Garamond, Josefin_Sans, Great_Vibes, Merienda, Meddon, Pinyon_Script, Lavishly_Yours } from "next/font/google";

export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
});

export const josefin = Josefin_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-josefin",
});

export const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-great-vibes",
});

export const merienda = Merienda({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-merienda",
});

export const meddon = Meddon({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-meddon",
});

export const pinyon = Pinyon_Script({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pinyon",
});

export const lavishly = Lavishly_Yours({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-lavishly",
});

export const allFontVariables = `${cormorant.variable} ${josefin.variable} ${greatVibes.variable} ${merienda.variable} ${meddon.variable} ${pinyon.variable} ${lavishly.variable}`;

