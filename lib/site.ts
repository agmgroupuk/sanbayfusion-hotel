export const site = {
  name: "Sanbay Fusion",
  legalName: "Sanbay Fusion Foods Company Limited",
  tagline: "Seasonal food memberships & delivery",
  description:
    "Sanbay Fusion is a membership-based food and beverage service in Thailand, offering member ordering, scheduled deliveries, membership plans, and a wide selection of food and beverages.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://sanbayfusion.com").replace(/\/+$/, ""),
  address: {
    line1: "395/2 Sathu Pradit Rd",
    line2: "Chong Nonsi, Yan Nawa",
    city: "Bangkok",
    postalCode: "10120",
    country: "Thailand",
  },
  phone: "+66 80 897 2129",
  email: "info@sanbayfusion.com",
} as const;

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
