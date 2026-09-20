import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId, sanityConfigured } from "@/sanity/env";

/**
 * Read-only client. When no project is configured we still create a client with
 * a placeholder id; callers guard on `sanityConfigured` and fall back to seed
 * content, so the site works fully without Sanity credentials.
 */
export const sanityClient = createClient({
  projectId: projectId || "placeholder",
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
});

export { sanityConfigured };
