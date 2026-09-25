import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/studio", "/dashboard", "/signup", "/signin", "/forgot-password", "/reset-password", "/membership/apply", "/membership/thank-you"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
