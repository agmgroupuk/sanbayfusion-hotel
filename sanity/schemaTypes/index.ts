import type { SchemaTypeDefinition } from "sanity";
import { menuType } from "./menu";
import { storyType } from "./story";
import { galleryType } from "./gallery";
import { siteSettingsType } from "./siteSettings";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [menuType, storyType, galleryType, siteSettingsType],
};
