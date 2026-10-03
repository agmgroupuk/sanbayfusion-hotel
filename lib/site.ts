import { publicSiteUrl } from "./platform-hosts";

const emails = { general: "info@sanbayfusion.com", support: "support@sanbayfusion.com", account: "account@sanbayfusion.com", reservation: "reservation@sanbayfusion.com" } as const;
const configuredCanonicalUrl = process.env.NEXT_PUBLIC_CANONICAL_URL?.trim();
let canonicalUrl: string | null = null;
if (configuredCanonicalUrl) {
  const url = new URL(configuredCanonicalUrl);
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_CANONICAL_URL must be an HTTPS origin without credentials, path, query, or fragment.");
  }
  canonicalUrl = url.origin;
}

export const site = {
  name: "Sanbay Fusion",
  legalName: "Sanbay Fusion Foods Company Limited",
  managerName: "Suchada Burandech",
  logo: "/brand/sanbayfusion-logo.png",
  tagline: "Food memberships for international visitors",
  description:
    "Food memberships for eligible international visitors travelling to Thailand, plus private events and bespoke hospitality from Sanbay Fusion.",
  url: publicSiteUrl(),
  canonicalUrl,
  address: {
    line1: "395/2 Sathu Pradit Rd",
    line2: "Chong Nonsi, Yan Nawa",
    city: "Bangkok",
    postalCode: "10120",
    country: "Thailand",
  },
  phone: "+66 80 897 2129",
  email: emails.general,
  emails,
  socialHandle: "sanbayfusion",
  social: {
    facebookUrl: "https://facebook.com/sanbayfusion",
    instagramUrl: "https://instagram.com/sanbayfusion",
    tiktokUrl: "https://tiktok.com/@sanbayfusion",
    // Populate only after the owner supplies a confirmed direct contact URL.
    lineUrl: null as string | null,
    whatsappUrl: null as string | null,
  },
} as const;

export const socialProfiles = [
  { id: "facebook", name: "Facebook", url: site.social.facebookUrl, identityVerified: true },
  { id: "instagram", name: "Instagram", url: site.social.instagramUrl, identityVerified: true },
  // All three profile URLs explicitly confirmed by the business owner.
  { id: "tiktok", name: "TikTok", url: site.social.tiktokUrl, identityVerified: true },
  { id: "line", name: "LINE", url: site.social.lineUrl, identityVerified: false },
  { id: "whatsapp", name: "WhatsApp", url: site.social.whatsappUrl, identityVerified: false },
] as const;

export const navLinks = [
  { href: "/plans", label: "Membership Plans" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About Us" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/events", label: "Private Events" },
  { href: "/delivery-areas", label: "Delivery Areas" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;
