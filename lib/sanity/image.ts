import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { dataset, projectId } from "@/sanity/env";

const builder = createImageUrlBuilder({
  projectId: projectId || "placeholder",
  dataset,
});

export function urlForImage(source: SanityImageSource) {
  return builder.image(source);
}
