"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "./sanity/env";
import { schema } from "./sanity/schemaTypes";

const singletons = ["menu", "story", "siteSettings", "gallery"];

export default defineConfig({
  name: "sanbay-fusion",
  title: "Sanbay Fusion",
  basePath: "/studio",
  projectId: projectId || "placeholder",
  dataset,
  schema,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            S.listItem().title("Tasting Menu").id("menu").child(S.document().schemaType("menu").documentId("menu")),
            S.listItem().title("Our Story").id("story").child(S.document().schemaType("story").documentId("story")),
            S.listItem().title("Gallery").id("gallery").child(S.document().schemaType("gallery").documentId("gallery")),
            S.listItem()
              .title("Site Settings")
              .id("siteSettings")
              .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
          ]),
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  document: {
    // Hide the "create new" / duplicate / delete actions for singletons
    actions: (input, { schemaType }) =>
      singletons.includes(schemaType)
        ? input.filter(({ action }) => action !== "duplicate" && action !== "delete")
        : input,
  },
});
