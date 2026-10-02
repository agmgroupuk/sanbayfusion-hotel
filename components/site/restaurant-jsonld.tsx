import { site } from "@/lib/site";
import { membershipPlans } from "@/lib/membership-plans";

/** Subscription business structured data. Rendered once in the site layout. */
export function RestaurantJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    legalName: site.legalName,
    description: site.description,
    url: site.url,
    image: `${site.url}/images/nicely-plated-food-served-at-decorated-table.jpg`,
    telephone: site.phone,
    email: site.email,
    logo: `${site.url}/brand/sanbayfusion-logo.webp`,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${site.address.line1}, ${site.address.line2}`,
      addressLocality: site.address.city,
      postalCode: site.address.postalCode,
      addressCountry: "TH",
    },
    areaServed: { "@type": "Country", name: "Thailand" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Food memberships for eligible international visitors",
      description: "For foreign visitors normally living outside Thailand and visiting temporarily; not available to domestic Thai customers.",
      itemListElement: membershipPlans.map((plan) => ({
        "@type": "Offer",
        name: plan.name,
        price: plan.price,
        priceCurrency: "THB",
        url: `${site.url}/plans/${plan.slug}`,
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
