import { businessStructuredData, serializeJsonLd } from "@/lib/business-schema";
import { site } from "@/lib/site";

export function BusinessJsonLd() {
  if (!site.canonicalUrl) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(businessStructuredData()) }} />;
}
