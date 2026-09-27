import type { Metadata } from "next";
import { DeliveryCheck } from "@/components/delivery/delivery-check";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = {
  title: "Check Delivery Availability",
  description: "Check whether your city or urban address is within the Sanbay Fusion delivery network.",
  alternates: { canonical: "/delivery-area" },
};

export default function DeliveryAreaCheckPage() {
  return <div className="pb-28"><PageHeader eyebrow="Delivery checker" title="Check Delivery Availability" lead="Search any address worldwide. Sanbay Fusion currently delivers throughout Bangkok only." /><div className="mx-auto max-w-7xl px-5 sm:px-8"><DeliveryCheck /></div></div>;
}