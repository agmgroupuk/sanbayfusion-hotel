import { describe, expect, it } from "vitest";
import { businessStructuredData, serializeJsonLd } from "./business-schema";
import { createPageMetadata, pageMetadata, publicPageSeo } from "./seo";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { site } from "./site";
import { membershipPlans } from "./membership-plans";

describe("search identity and canonical inventory", () => {
  it("publishes one linked business identity, with the official logo and contact details", () => {
    const [business, website] = businessStructuredData()["@graph"];
    expect(business).toMatchObject({ "@type": ["Organization", "LocalBusiness"], name: site.legalName, email: site.email, telephone: "+66808972129", logo: { url: `${site.url}/brand/sanbayfusion-logo.png` }, address: { streetAddress: "395/2 Sathu Pradit Rd, Chong Nonsi, Yan Nawa", postalCode: "10120", addressCountry: "TH" } });
    expect(website).toMatchObject({ publisher: { "@id": business["@id"] } });
    expect(serializeJsonLd(businessStructuredData())).not.toMatch(/maula|mola|aggregateRating|openingHours|hasMap/);
  });
  it("prevents a data value from escaping a JSON-LD script element", () => {
    const input = { name: "</script><script>alert(1)</script>" };
    expect(serializeJsonLd(input)).not.toContain("<");
    expect(JSON.parse(serializeJsonLd(input))).toEqual(input);
  });
  it("does not identify the temporary app hostname as a canonical SEO origin", () => {
    for (const route of Object.keys(publicPageSeo) as (keyof typeof publicPageSeo)[]) {
      const metadata = pageMetadata(route);
      expect(metadata.alternates?.canonical).toBe(site.canonicalUrl ? new URL(route, site.canonicalUrl).href : undefined);
      expect(metadata.openGraph).toMatchObject({ url: site.canonicalUrl ? new URL(route, site.canonicalUrl).href : undefined, description: metadata.description, title: `${publicPageSeo[route].title} | ${site.name}` });
      expect(metadata.twitter).toMatchObject({ description: metadata.description, title: `${publicPageSeo[route].title} | ${site.name}` });
    }
  });
  it("describes international visitor membership and keeps events a separate service", () => {
    for (const route of ["/", "/plans", "/about", "/faq", "/membership", "/pricing"] as const) expect(pageMetadata(route).description).toMatch(/international|foreign visitors/i);
    expect(pageMetadata("/events").description).not.toMatch(/exclusively|eligible|domestic/);
  });
  it("uses the configured permanent domain for plan canonicals when one is set", () => {
    for (const plan of membershipPlans) {
      const path = `/plans/${plan.slug}`;
      expect(createPageMetadata(path, plan.name, plan.name).alternates?.canonical).toBe(site.canonicalUrl ? `${site.canonicalUrl}${path}` : undefined);
      expect(sitemap().some(entry => entry.url === `${site.canonicalUrl}${path}`)).toBe(Boolean(site.canonicalUrl));
    }
  });
  it("keeps temporary hosting out of sitemap and robots indexing signals", () => {
    const entries = sitemap();
    expect(new Set(entries.map(entry => entry.url)).size).toBe(entries.length);
    expect(entries).toHaveLength(site.canonicalUrl ? Object.keys(publicPageSeo).length + membershipPlans.length : 0);
    for (const entry of entries) {
      expect(entry.url).not.toMatch(/\/(?:api|admin|studio|dashboard|join|signin|signup)|membership\/(?:checkout|apply|payment|success|thank-you|request-received)/);
      expect(entry.lastModified).toBeUndefined();
    }
    const result = robots();
    if (site.canonicalUrl) {
      expect(result.sitemap).toBe(`${site.canonicalUrl}/sitemap.xml`);
      expect(result.rules).toMatchObject({ allow: "/" });
      expect(JSON.stringify(result.rules)).not.toMatch(/\/brand|\/icon|\/favicon|\/plans|\/events/);
      expect(JSON.stringify(result.rules)).toContain("/admin");
    } else {
      expect(result.sitemap).toBeUndefined();
      expect(result.rules).toMatchObject({ disallow: "/" });
    }
  });
});
