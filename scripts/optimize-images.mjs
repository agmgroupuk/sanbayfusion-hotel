/**
 * One-off: downscale + recompress the large source photos in /public/images.
 * next/image still serves AVIF/WebP at request time; this just keeps the source
 * files (originally up to ~8MB) sane in the repo. Safe to re-run (idempotent-ish:
 * it skips files already under the size threshold).
 */
import { readdir, stat, rename, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DIR = path.join(process.cwd(), "public", "images");
const MAX_WIDTH = 2560;
const QUALITY = 80;
const SKIP_UNDER_BYTES = 600 * 1024; // leave already-small files alone

const files = await readdir(DIR);
for (const file of files) {
  if (!/\.(jpe?g|png)$/i.test(file)) continue;
  const full = path.join(DIR, file);
  const { size } = await stat(full);
  if (size < SKIP_UNDER_BYTES) {
    console.log(`skip  ${file} (${(size / 1024).toFixed(0)}KB)`);
    continue;
  }
  const tmp = full + ".tmp.jpg";
  await sharp(full)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(tmp);
  const after = (await stat(tmp)).size;
  await unlink(full);
  await rename(tmp, full.replace(/\.(png)$/i, ".jpg"));
  console.log(
    `opt   ${file}: ${(size / 1024 / 1024).toFixed(2)}MB → ${(after / 1024 / 1024).toFixed(2)}MB`,
  );
}
console.log("done");
