import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "./site";

let logoDataPromise: Promise<string> | null = null;

export function logoDataUri() {
  if (!logoDataPromise) {
    logoDataPromise = readFile(join(process.cwd(), "public", site.logo), "base64").then((data) => `data:image/png;base64,${data}`);
  }
  return logoDataPromise;
}
