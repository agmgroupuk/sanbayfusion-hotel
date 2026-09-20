import type { PortableTextBlock } from "@portabletext/react";

export type Dietary = "v" | "vg" | "gf";

export const dietaryLabels: Record<Dietary, string> = {
  v: "Vegetarian",
  vg: "Vegan",
  gf: "Gluten-free",
};

export interface MenuItem {
  name: string;
  description?: string;
  dietary?: Dietary[];
}

export interface MenuSection {
  name: string;
  items: MenuItem[];
}

export interface WinePairing {
  title: string;
  description: string;
}

export interface MenuContent {
  title: string;
  intro?: string;
  priceNote?: string;
  sections: MenuSection[];
  winePairing?: WinePairing;
}

export interface PortraitImage {
  src: string;
  alt?: string;
}

export interface StoryContent {
  chefName: string;
  role: string;
  portrait?: PortraitImage | null;
  intro: string;
  body: PortableTextBlock[];
  accolades?: string[];
}
