import type { PortableTextBlock } from "@portabletext/react";
import type { MenuContent, StoryContent } from "./types";
import { catalogueCategories } from "@/lib/catalogue";

export function toBlocks(paragraphs: string[]): PortableTextBlock[] {
  return paragraphs.map((text, i) => ({
    _type: "block", _key: "b" + i, style: "normal", markDefs: [],
    children: [{ _type: "span", _key: "s" + i, text, marks: [] }],
  })) as unknown as PortableTextBlock[];
}

/** Editorial fallback uses the same products as the current catalogue. */
export const DEFAULT_MENU: MenuContent = {
  title: "Food for your selected months",
  intro: "Explore eligible food and non-alcoholic drinks. Choose a Standard Meal during your selected service month, add a prepaid package when applying, or place a separately paid member order.",
  priceNote: "See the catalogue and your final checkout for current prices in Thai baht. Availability and dietary requests require confirmation.",
  sections: catalogueCategories.filter(category => category.group !== "alcohol").map(category => ({
    name: category.name,
    items: category.products.map(product => ({ name: product.name })),
  })),
};

export const DEFAULT_STORY: StoryContent = {
  chefName: "The Sanbay Fusion team",
  role: "Food, planning and hospitality",
  portrait: { src: "/images/chef-preparing-the-plates.jpg", alt: "Food preparation in a kitchen" },
  intro: "Sanbay Fusion brings food memberships, advance planning and customer service together for selected service months in Thailand.",
  body: toBlocks([
    "A good arrangement starts with the details: when you need service, where you will receive it and what you would like to order. Our membership process brings those choices together before the team reviews your application.",
    "Choose eligible service months around your plans. After approval and verified payment, use your included Standard Meal allowance and eligible member ordering during those months.",
    "Meetings and private-event enquiries are reviewed personally by the team. Availability, service arrangements and final event pricing are confirmed before a booking is agreed.",
  ]),
  accolades: [],
};
