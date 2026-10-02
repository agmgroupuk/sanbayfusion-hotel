import { pageMetadata } from "@/lib/seo";
import { DeliveryCheck } from "@/components/delivery/delivery-check";
import { PageHeader } from "@/components/site/page-header";

export const metadata = pageMetadata("/delivery-area");

export default function DeliveryAreaCheckPage() {
  return <div className="pb-28"><PageHeader eyebrow="Delivery checker" title="Check Delivery Availability" lead="Search any address worldwide. Sanbay Fusion currently delivers throughout Bangkok only." /><div className="mx-auto max-w-7xl px-5 sm:px-8"><DeliveryCheck /></div></div>;
}