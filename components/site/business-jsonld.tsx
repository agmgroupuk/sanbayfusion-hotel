import { businessStructuredData, serializeJsonLd } from "@/lib/business-schema";

export function BusinessJsonLd() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(businessStructuredData()) }} />;
}
