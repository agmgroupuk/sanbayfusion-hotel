import { readFile } from "node:fs/promises";
import { join } from "node:path";

let logoDataPromise: Promise<string> | null = null;

export function logoDataUri() {
  if (!logoDataPromise) {
    logoDataPromise = readFile(join(process.cwd(), "public/brand/sanbayfusion-logo.png"), "base64").then((data) => `data:image/png;base64,${data}`);
  }
  return logoDataPromise;
}
