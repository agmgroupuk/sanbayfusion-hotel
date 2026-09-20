import { site } from "@/lib/site";

/** Restaurant structured data for rich results. Rendered once in the site layout. */
export function RestaurantJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: site.name,
    description: site.description,
    url: site.url,
    image: `${site.url}/images/nicely-plated-food-served-at-decorated-table.jpg`,
    telephone: site.phone,
    email: site.email,
    servesCuisine: "Contemporary tasting menu",
    priceRange: "€€€€",
    acceptsReservations: `${site.url}/reservations`,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.line1,
      addressLocality: "Paris",
      postalCode: "75001",
      addressCountry: "FR",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Tuesday", "Wednesday", "Thursday"],
        opens: "18:00",
        closes: "22:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Friday", "Saturday"],
        opens: "18:00",
        closes: "23:00",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
