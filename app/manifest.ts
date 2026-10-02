import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#1a1712",
    theme_color: "#1a1712",
    icons: [
      { src: "/brand/sanbayfusion-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/sanbayfusion-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
