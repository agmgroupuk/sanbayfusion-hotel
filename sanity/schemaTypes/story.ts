import { defineField, defineType } from "sanity";

export const storyType = defineType({
  name: "story",
  title: "Our Story",
  type: "document",
  fields: [
    defineField({ name: "chefName", title: "Chef name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "role", title: "Role", type: "string", initialValue: "Chef-Patron" }),
    defineField({
      name: "portrait",
      title: "Portrait",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
    }),
    defineField({ name: "intro", title: "Intro", type: "text", rows: 3, validation: (r) => r.required() }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [{ type: "block", styles: [{ title: "Normal", value: "normal" }], lists: [] }],
    }),
    defineField({
      name: "accolades",
      title: "Accolades",
      type: "array",
      of: [{ type: "string" }],
    }),
  ],
  preview: { select: { title: "chefName", subtitle: "role" } },
});
