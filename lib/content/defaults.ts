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
    "A single menu of nine courses, shaped by the season and the morning's deliveries. Served to the whole table from 18:00.",
  priceNote: "฿3,950 per guest · Wine pairing ฿2,200 · Non-alcoholic pairing ฿1,200",
  sections: [
    {
      name: "To Begin",
      items: [
        {
          name: "Cep & chestnut",
          description: "Smoked cep custard, roast chestnut, aged comté, and black truffle oil.",
          dietary: ["v", "gf"],
        },
        {
          name: "Oyster, charred leek",
          description: "Fine de claire oyster, burnt leek ash, green apple, and finger lime.",
          dietary: ["gf"],
        },
      ],
    },
    {
      name: "From the Fire",
      items: [
        {
          name: "Hand-dived scallop",
          description: "Seared scallop, brown butter, sea herbs, and a whisper of yuzu.",
          dietary: ["gf"],
        },
        {
          name: "Cornish turbot",
          description: "Ember-grilled turbot, vin jaune sauce, golden raisin, and young fennel.",
          dietary: ["gf"],
        },
        {
          name: "Dry-aged duck",
          description: "Dry-aged duck breast, lavender honey, fermented cherry, and charred onion.",
          dietary: ["gf"],
        },
      ],
    },
    {
      name: "The Garden",
      items: [
        {
          name: "Heritage beetroot",
          description: "Salt-roasted heritage beetroot, blackcurrant, horseradish snow, and dill.",
          dietary: ["vg", "gf"],
        },
        {
          name: "Autumn squash",
          description: "Brown-butter squash, Thai basil, sage, toasted seeds, and fermented chilli.",
          dietary: ["v", "gf"],
        },
      ],
    },
    {
      name: "To Finish",
      items: [
        {
          name: "Tonka & pear",
          description: "Poached pear, tonka cream, brown sugar tuile, and vanilla bean.",
          dietary: ["v"],
        },
        {
          name: "Black forest, reimagined",
          description: "Valrhona chocolate, morello cherry, kirsch ice, and cacao nib.",
          dietary: ["v"],
        },
      ],
    },
  ],
  winePairing: {
    title: "The Pairing",
    description:
      "An optional pairing traces the menu course by course, with bottles from small growers across France, Italy, Australia, and Thailand. A non-alcoholic pairing of house ferments, teas, and infusions is offered alongside.",
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
