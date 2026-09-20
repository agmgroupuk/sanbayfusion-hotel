import { defineField, defineType, defineArrayMember } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", initialValue: "Site Settings" }),
    defineField({
      name: "hours",
      title: "Opening hours",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "days", title: "Days", type: "string" }),
            defineField({ name: "time", title: "Time", type: "string" }),
          ],
          preview: { select: { title: "days", subtitle: "time" } },
        }),
      ],
    }),
    defineField({
      name: "reservation",
      title: "Reservation settings",
      type: "object",
      fields: [
        defineField({
          name: "serviceTimes",
          title: "Service times",
          type: "array",
          of: [{ type: "string" }],
          description: "Bookable slots, e.g. 18:00, 18:30, 19:00",
        }),
        defineField({
          name: "maxCoversPerSlot",
          title: "Max covers per slot",
          type: "number",
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Site Settings" }) },
});
