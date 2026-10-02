import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { membershipPlans } from "@/lib/membership-plans";
import { publicPageSeo } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    ...Object.keys(publicPageSeo),
    ...membershipPlans.map((plan) => `/plans/${plan.slug}`),
  ];
  // Do not invent a fresh modification date each time a deployment builds.
  return routes.map((path) => ({
    url: new URL(path, site.url).href,
  }));
}
