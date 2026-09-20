import { defineField, defineType, defineArrayMember } from "sanity";

export const galleryType = defineType({
  name: "gallery",
  title: "Gallery",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", initialValue: "Gallery" }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [defineField({ name: "caption", title: "Caption", type: "string" })],
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Gallery" }) },
});
