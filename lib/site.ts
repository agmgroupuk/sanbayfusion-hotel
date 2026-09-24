export const site = {
  name: "Sanbay Fusion",
  tagline: "Seasonal food memberships & delivery",
  description:
    "Sanbay Fusion delivers seasonal food packages, drinks, and pantry products through flexible weekly and monthly memberships in Thailand.",
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
  { href: "/plans", label: "Membership Plans" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/events", label: "Private Events" },
  { href: "/delivery-areas", label: "Delivery Areas" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;
