import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

// All site icons come from the existing, approved header logo. At favicon sizes
// use its SF emblem; the full wordmark becomes illegible in a browser tab.
const source = "public/brand/sanbayfusion-logo.png";
const emblem = await sharp(source)
  .extract({ left: 570, top: 0, width: 645, height: 585 })
  .png()
  .toBuffer();

async function icon(size) {
  const inset = Math.max(1, Math.round(size * 0.08));
  const artwork = await sharp(emblem)
    .resize(size - inset * 2, size - inset * 2, { fit: "contain", background: "#1a1712" })
    .png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: "#1a1712" } })
    .composite([{ input: artwork, gravity: "centre" }])
    .png().toBuffer();
}

await mkdir("public/brand", { recursive: true });
for (const [path, size] of [
  ["app/icon.png", 96],
  ["app/apple-icon.png", 180],
  ["public/brand/sanbayfusion-icon-192.png", 192],
  ["public/brand/sanbayfusion-icon-512.png", 512],
]) {
  await writeFile(path, await icon(size));
}

// ICO directory with PNG-compressed images, supported by modern icon consumers.
const sizes = [16, 32, 48, 64, 128, 256];
const images = await Promise.all(sizes.map(icon));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((data, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index] === 256 ? 0 : sizes[index];
  header[entry + 1] = header[entry];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(data.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += data.length;
});
await writeFile("app/favicon.ico", Buffer.concat([header, ...images]));
console.log("Generated Sanbay Fusion ICO (16-256px), site (96px), Apple (180px), and manifest (192/512px) icons.");
