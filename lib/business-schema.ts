import { site, socialProfiles } from "@/lib/site";

/** One real business, typed as both Organization and LocalBusiness, not two competing entities. */
export function businessStructuredData() {
  const businessId = `${site.url}/#organization`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "LocalBusiness"],
        "@id": businessId,
        name: site.legalName,
        legalName: site.legalName,
        alternateName: site.name,
        url: `${site.url}/`,
        description: `${site.description} Membership is exclusively for eligible foreign visitors normally living outside Thailand and visiting temporarily; applications require review and approval.`,
        logo: {
          "@type": "ImageObject",
          "@id": `${site.url}/#logo`,
          url: `${site.url}${site.logo}`,
          contentUrl: `${site.url}${site.logo}`,
          caption: site.name,
        },
        image: `${site.url}${site.logo}`,
        telephone: site.phone.replace(/\s/g, ""),
        email: site.email,
        sameAs: socialProfiles.filter(profile => profile.identityVerified && profile.url).map(profile => profile.url),
        address: {
          "@type": "PostalAddress",
          streetAddress: `${site.address.line1}, ${site.address.line2}`,
          addressLocality: site.address.city,
          addressRegion: site.address.city,
          postalCode: site.address.postalCode,
          addressCountry: "TH",
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: site.phone.replace(/\s/g, ""),
          email: site.email,
          url: `${site.url}/contact`,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: `${site.url}/`,
        name: site.name,
        publisher: { "@id": businessId },
        inLanguage: "en",
      },
    ],
  };
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
