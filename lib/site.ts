export const site = {
  name: "Sanbay Fusion",
  tagline: "Bar & Restaurant",
  description:
    "Sanbay Fusion Bar & Restaurant brings together contemporary dining, warm hospitality, and a memorable atmosphere in the heart of the city.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://sanbayfusion.com",
  address: {
    line1: "Sanbay Fusion Bar & Restaurant",
    line2: "sanbayfusion.com",
  },
  phone: "+00 000 000 0000",
  email: "info@sanbayfusion.com",
  hours: [
    { days: "Tuesday — Thursday", time: "18:00 — 22:00" },
    { days: "Friday — Saturday", time: "18:00 — 23:00" },
    { days: "Sunday — Monday", time: "Closed" },
  ],
  social: {
    instagram: "https://instagram.com",
    // add others as needed
  },
} as const;

export const navLinks = [
  { href: "/menu", label: "Menu" },
  { href: "/story", label: "Our Story" },
  { href: "/membership", label: "Membership" },
  { href: "/contact", label: "Contact" },
] as const;
