import type { Metadata } from "next";
import { DeliveryCheck } from "@/components/delivery/delivery-check";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = {
  title: "Check Delivery Availability",
  description: "Check whether your city or urban address is within the Sanbay Fusion delivery network.",
  alternates: { canonical: "/delivery-area" },
};

export default function DeliveryAreaCheckPage() {
  return <div className="pb-28"><PageHeader eyebrow="Delivery checker" title="Can we deliver to you?" lead="Search for your exact address and we will check it against the configured city delivery network." /><div className="mx-auto max-w-7xl px-5 sm:px-8"><DeliveryCheck /></div></div>;
}