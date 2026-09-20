import { Fraunces, Geist, Geist_Mono } from "next/font/google";

/** Expressive high-contrast display serif — carries the brand voice. */
export const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

/** Clean neutral grotesque for body + UI. */
export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

/** Mono used sparingly for eyebrow labels and editorial accents. */
export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const fontVariables = `${fraunces.variable} ${geistSans.variable} ${geistMono.variable}`;
