import { readFileSync } from "node:fs";
import { join } from "node:path";

let content: string | undefined;
/** Inline attachment avoids dependence on website bot challenges or third-party image fetching. */
export function inlineEmailLogo(html: string) {
  content ??= readFileSync(join(process.cwd(), "public/brand/sanbayfusion-email-logo.png")).toString("base64");
  return {
    html: html.replaceAll("https://sanbayfusion.com/brand/sanbayfusion-logo.png", "cid:sanbayfusion-logo.png"),
    attachments: [{ filename: "sanbayfusion-logo.png", content, contentId: "sanbayfusion-logo.png", contentType: "image/png" }],
  };
}
