export type DeliveryZone = {
  id: string;
  title: string;
  summary: string;
  coverage: string;
  conditions: string[];
  deliveryRange: string;
  additionalCharge: string;
};

export type DeliveryPlace = {
  placeId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
};

export type DeliveryAvailability = {
  status: "available" | "unavailable" | "needs_review";
  title: string;
  detail: string;
  zone?: string;
};

export const deliveryZones: DeliveryZone[] = [
  {
    id: "central",
    title: "Central delivery zone",
    summary: "The first priority for reliable city routes.",
    coverage: "Dense urban routes inside the central service area. Final boundaries will be confirmed from the selected map location.",
    conditions: ["Scheduled delivery windows", "Eligible memberships only", "Address access and delivery instructions required"],
    deliveryRange: "Planned window shown after address confirmation",
    additionalCharge: "Included with eligible memberships",
  },
  {
    id: "extended",
    title: "Extended delivery zone",
    summary: "Selected urban districts beyond the central route network.",
    coverage: "City and metropolitan routes that can be served within the operating schedule. Exact coverage remains configurable.",
    conditions: ["Route confirmation required", "Longer lead time may apply", "A delivery supplement may apply"],
    deliveryRange: "Confirmed case by case",
    additionalCharge: "Small supplement may apply",
  },
  {
    id: "business",
    title: "Business delivery",
    summary: "Planned delivery for offices, hospitality, events, and teams.",
    coverage: "Urban business addresses with volume, access, and schedule requirements agreed in advance.",
    conditions: ["Volume and access review", "Named delivery contact", "Schedule agreed before activation"],
    deliveryRange: "Planned around the event or team schedule",
    additionalCharge: "Quoted after route and volume review",
  },
];

// The coverage rules are intentionally empty until the final city boundaries or
// Google Maps polygon/radius configuration is approved.
const configuredCoverageRules: Array<{ zoneId: string; contains: (place: DeliveryPlace) => boolean }> = [];

export function checkDeliveryAvailability(place: DeliveryPlace): DeliveryAvailability {
  const matchingRule = configuredCoverageRules.find((rule) => rule.contains(place));
  if (matchingRule) {
    const zone = deliveryZones.find((item) => item.id === matchingRule.zoneId);
    return { status: "available", title: "Delivery Available", detail: zone?.summary ?? "This address is inside a configured delivery route.", zone: zone?.title };
  }

  return {
    status: "needs_review",
    title: "Delivery availability needs confirmation",
    detail: "We have the selected map location, but the final city and route boundaries are still being configured. Our team can confirm this address before membership activation.",
  };
}