import { sanityClient, sanityConfigured } from "./client";
import { urlForImage } from "./image";
import { DEFAULT_MENU, DEFAULT_STORY } from "@/lib/content/defaults";
import type { MenuContent, StoryContent } from "@/lib/content/types";

const MENU_QUERY = `*[_type == "menu"][0]{
  title,
  intro,
  priceNote,
  sections[]{ name, items[]{ name, description, dietary } },
  winePairing
}`;

const STORY_QUERY = `*[_type == "story"][0]{
  chefName,
  role,
  intro,
  portrait,
  body,
  accolades
}`;

export async function getMenu(): Promise<MenuContent> {
  if (!sanityConfigured) return DEFAULT_MENU;
  try {
    const data = await sanityClient.fetch<MenuContent | null>(
      MENU_QUERY,
      {},
      { next: { revalidate: 60, tags: ["menu"] } },
    );
    return data ?? DEFAULT_MENU;
  } catch {
    return DEFAULT_MENU;
  }
}

type StoryRaw = Omit<StoryContent, "portrait"> & {
  portrait?: { alt?: string } | null;
};

export async function getStory(): Promise<StoryContent> {
  if (!sanityConfigured) return DEFAULT_STORY;
  try {
    const data = await sanityClient.fetch<StoryRaw | null>(
      STORY_QUERY,
      {},
      { next: { revalidate: 60, tags: ["story"] } },
    );
    if (!data) return DEFAULT_STORY;
    return {
      ...data,
      portrait: data.portrait
        ? {
            src: urlForImage(data.portrait as never)
              .width(1400)
              .height(1750)
              .fit("crop")
              .url(),
            alt: data.portrait.alt ?? data.chefName,
          }
        : DEFAULT_STORY.portrait,
    };
  } catch {
    return DEFAULT_STORY;
  }
}
