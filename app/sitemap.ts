import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { membershipPlans } from "@/lib/membership-plans";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/menu",
    "/story",
    "/plans",
    "/membership",
    "/how-it-works",
    "/catalogue",
    "/events",
    "/delivery-area",
    "/delivery-areas",
    "/pricing",
    "/faq",
    "/contact",
    "/reservations",
    "/accessibility",
    "/cookie-policy",
    "/privacy-policy",
    "/terms-and-conditions",
    "/join",
    ...membershipPlans.map((plan) => `/plans/${plan.slug}`),
  ];
  const now = new Date();
  return routes.map((path) => ({
    url: `${site.url}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
