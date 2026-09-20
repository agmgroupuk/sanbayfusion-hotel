import type { PortableTextBlock } from "@portabletext/react";
import type { MenuContent, StoryContent } from "./types";

/** Turn plain paragraphs into Portable Text blocks so pages have one render path. */
export function toBlocks(paragraphs: string[]): PortableTextBlock[] {
  return paragraphs.map((text, i) => ({
    _type: "block",
    _key: `b${i}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `s${i}`, text, marks: [] }],
  })) as unknown as PortableTextBlock[];
}

/** Seed content — used until a Sanity project is connected and populated. */
export const DEFAULT_MENU: MenuContent = {
  title: "The Tasting Menu",
  intro:
    "A single menu of nine courses, changing with the season and the morning's deliveries. Served to the whole table from 18:00.",
  priceNote: "€185 per guest · Wine pairing €120",
  sections: [
    {
      name: "To Begin",
      items: [
        {
          name: "Cep & chestnut",
          description: "Smoked cep custard, roast chestnut, aged comté.",
          dietary: ["v", "gf"],
        },
        {
          name: "Oyster, charred leek",
          description: "Fine de claire, burnt leek ash, green apple.",
          dietary: ["gf"],
        },
      ],
    },
    {
      name: "From the Fire",
      items: [
        {
          name: "Hand-dived scallop",
          description: "Brown butter, sea herbs, a whisper of yuzu.",
          dietary: ["gf"],
        },
        {
          name: "Cornish turbot",
          description: "Grilled over embers, vin jaune, golden raisin.",
          dietary: ["gf"],
        },
        {
          name: "Dry-aged duck",
          description: "Lavender honey, fermented cherry, charred onion.",
          dietary: ["gf"],
        },
      ],
    },
    {
      name: "The Garden",
      items: [
        {
          name: "Heritage beetroot",
          description: "Slow-roasted in salt, blackcurrant, horseradish snow.",
          dietary: ["vg", "gf"],
        },
        {
          name: "Autumn squash",
          description: "Brown-butter squash, sage, toasted seeds.",
          dietary: ["v", "gf"],
        },
      ],
    },
    {
      name: "To Finish",
      items: [
        {
          name: "Tonka & pear",
          description: "Poached pear, tonka cream, brown sugar tuile.",
          dietary: ["v"],
        },
        {
          name: "Black forest, reimagined",
          description: "Valrhona, morello cherry, kirsch ice.",
          dietary: ["v"],
        },
      ],
    },
  ],
  winePairing: {
    title: "The Pairing",
    description:
      "An optional pairing traces the menu course by course — drawn from a cellar of small, characterful growers across France and beyond. A non-alcoholic pairing of house ferments and infusions is offered alongside.",
  },
};

export const DEFAULT_STORY: StoryContent = {
  chefName: "Élise Laurent",
  role: "Chef-Patron",
  portrait: {
    src: "/images/chef-preparing-the-plates.jpg",
    alt: "Chef Élise Laurent plating a dish",
  },
  intro:
    "Sanbay Fusion Bar & Restaurant began as a single idea: that a great meal is a piece of theatre, and that fire is its oldest, truest language.",
  body: toBlocks([
    "After years of creating memorable evenings, we opened Sanbay Fusion Bar & Restaurant as a warm, modern place for gathering, tasting, and celebration.",
    "The menu is dictated by the season and by the people who grow, fish, and forage for us. There is no à la carte; there is only the evening as we have imagined it, course by course.",
    "Sanbay Fusion Bar & Restaurant earned its reputation through thoughtful hospitality, bold flavors, and a way of cooking that feels both refined and welcoming.",
  ]),
  accolades: [
    "One Michelin Star",
    "World's 50 Best — One to Watch",
    "Gault & Millau · 18/20",
  ],
};
