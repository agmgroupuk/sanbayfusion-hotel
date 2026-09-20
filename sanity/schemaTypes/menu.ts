import { defineField, defineType, defineArrayMember } from "sanity";

const dietaryOptions = [
  { title: "Vegetarian", value: "v" },
  { title: "Vegan", value: "vg" },
  { title: "Gluten-free", value: "gf" },
];

export const menuType = defineType({
  name: "menu",
  title: "Tasting Menu",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "intro", title: "Intro", type: "text", rows: 3 }),
    defineField({
      name: "priceNote",
      title: "Price note",
      type: "string",
      description: "e.g. €185 per guest · Wine pairing €120",
    }),
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "section",
          fields: [
            defineField({ name: "name", title: "Section name", type: "string", validation: (r) => r.required() }),
            defineField({
              name: "items",
              title: "Courses",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  name: "item",
                  fields: [
                    defineField({ name: "name", title: "Course name", type: "string", validation: (r) => r.required() }),
                    defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
                    defineField({
                      name: "dietary",
                      title: "Dietary",
                      type: "array",
                      of: [{ type: "string" }],
                      options: { list: dietaryOptions },
                    }),
                  ],
                  preview: {
                    select: { title: "name", subtitle: "description" },
                  },
                }),
              ],
            }),
          ],
          preview: { select: { title: "name", items: "items" }, prepare: ({ title, items }) => ({ title, subtitle: `${items?.length ?? 0} courses` }) },
        }),
      ],
    }),
    defineField({
      name: "winePairing",
      title: "Wine pairing",
      type: "object",
      fields: [
        defineField({ name: "title", title: "Title", type: "string" }),
        defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Tasting Menu" }) },
});
