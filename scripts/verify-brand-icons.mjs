import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";

const origin = process.env.VERIFY_ORIGIN || "http://localhost:3102";
const sha256 = data => createHash("sha256").update(data).digest("hex");
const audit = { origin, checkedAt: new Date().toISOString(), responses: [] };
async function get(path) {
  const response = await fetch(new URL(path, origin));
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
  audit.responses.push({ path, status: response.status, contentType: response.headers.get("content-type"), cacheControl: response.headers.get("cache-control"), sha256: sha256(bytes) });
  return { response, bytes };
}

const paths = new Map([
  ["/favicon.ico", "app/favicon.ico"],
  // Exact URLs advertised by the previous production deployment must also
  // resolve to the replacement, even when a consumer retained the old links.
  ["/favicon.ico?favicon.3rgl3u_4os27w.ico", "app/favicon.ico"],
  ["/icon.png", "app/icon.png"],
  ["/icon", "app/icon.png"],
  ["/icon?f4c64f0918568ab9", "app/icon.png"],
  ["/favicon.png", "app/icon.png"],
  ["/apple-icon.png", "app/apple-icon.png"],
  ["/apple-icon", "app/apple-icon.png"],
  ["/apple-icon?6a3e921b18136ad9", "app/apple-icon.png"],
  ["/apple-touch-icon.png", "app/apple-icon.png"],
  ["/apple-touch-icon-precomposed.png", "app/apple-icon.png"],
  ["/brand/sanbayfusion-icon-192.png", "public/brand/sanbayfusion-icon-192.png"],
  ["/brand/sanbayfusion-icon-512.png", "public/brand/sanbayfusion-icon-512.png"],
]);
for (const [path, file] of paths) {
  const { response, bytes } = await get(path);
  assert.match(response.headers.get("content-type"), /^image\//);
  assert.equal(sha256(bytes), sha256(await readFile(file)), `${path} differs from current logo asset`);
}
for (const path of ["/manifest.webmanifest", "/manifest.json", "/site.webmanifest"]) {
  const { bytes } = await get(path);
  const manifest = JSON.parse(bytes.toString());
  assert.equal(manifest.name, "Sanbay Fusion");
  assert.deepEqual(manifest.icons.map(i => i.sizes), ["192x192", "512x512"]);
  for (const icon of manifest.icons) assert.ok(paths.has(icon.src));
}
const html = (await get("/")).bytes.toString();
const links = [...html.matchAll(/<link\b[^>]*>/g)].map(m => m[0]);
const icons = links.filter(link => /rel="(?:icon|shortcut icon|apple-touch-icon)"/.test(link));
assert.ok(icons.some(link => link.includes("/icon.png?")), "Missing content-versioned site icon");
assert.ok(icons.some(link => link.includes("/apple-icon.png?")), "Missing content-versioned Apple icon");
assert.ok(icons.some(link => link.includes("/favicon.ico?")), "Missing content-versioned ICO link");
assert.ok(links.some(link => /rel="manifest"/.test(link)));
assert.doesNotMatch(html, /maula|maula\.ai|\bmola\b/i);
for (const link of icons) {
  const href = link.match(/href="([^"]+)"/)?.[1].replaceAll("&amp;", "&");
  assert.ok(href);
  const path = new URL(href, origin).pathname;
  assert.ok(paths.has(path), `Unexpected icon ${href}`);
  assert.equal(sha256((await get(href)).bytes), sha256(await readFile(paths.get(path))));
}
for (const property of ["og:image", "twitter:image"]) {
  const tag = [...html.matchAll(/<meta\b[^>]*>/g)].map(m => m[0]).find(tag => tag.includes(`="${property}"`));
  assert.ok(tag, `Missing ${property}`);
  const url = new URL(tag.match(/content="([^"]+)"/)[1].replaceAll("&amp;", "&"));
  const { response, bytes } = await get(url.pathname + url.search);
  assert.match(response.headers.get("content-type"), /^image\/png/);
  assert.equal(bytes.readUInt32BE(16), 1200);
  assert.equal(bytes.readUInt32BE(20), 630);
}
const robots = (await get("/robots.txt")).bytes.toString();
assert.doesNotMatch(robots, /Disallow:.*(?:icon|brand|manifest)/i);
await mkdir(".next/branding-audit", { recursive: true });
await writeFile(".next/branding-audit/verification.json", JSON.stringify(audit, null, 2));
console.log(`Verified ${audit.responses.length} branding responses at ${origin}: exact current icon bytes, legacy aliases, metadata, manifests, share images, and crawler access rules.`);
