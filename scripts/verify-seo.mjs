import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const origin = process.env.VERIFY_ORIGIN || "http://127.0.0.1:3107";
const canonicalOrigin = process.env.NEXT_PUBLIC_CANONICAL_URL?.replace(/\/+$/, "");
if (!canonicalOrigin || !canonicalOrigin.startsWith("https://")) throw new Error("Set NEXT_PUBLIC_CANONICAL_URL to the intended permanent SEO domain before running this verifier.");
const decode = text => text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], decode(m[2])]));
const results = [];
let checks = 0;
function check(value, label) { assert.ok(value, label); checks++; }
async function get(path) {
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(20000) });
  check(response.status === 200, `${path}: HTTP ${response.status}`);
  return response;
}
const xml = await (await get("/sitemap.xml")).text();
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => decode(m[1]));
check(new Set(urls).size === urls.length, "unique sitemap URLs");
check(urls.length === 31, "19 public pages and 12 plans");
check(!xml.includes("<lastmod>"), "no fabricated modification dates");
for (const url of urls) {
  const path = new URL(url).pathname;
  check(new URL(url).origin === canonicalOrigin, `${path}: official host`);
  check(!/^\/(?:admin|api|dashboard|studio|signup|signin|join)(?:\/|$)/.test(path), "no private or duplicate routes");
  const html = await (await get(path)).text();
  const title = decode(html.match(/<title>(.*?)<\/title>/)?.[1] || "");
  const metas = [...html.matchAll(/<meta\b[^>]*>/g)].map(m => attributes(m[0]));
  const meta = key => metas.find(item => item.name === key || item.property === key)?.content;
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map(m => attributes(m[0]));
  check(new URL(links.find(link => link.rel === "canonical")?.href || "https://invalid.invalid").href === url, `${path}: self canonical`);
  check(new URL(meta("og:url") || "https://invalid.invalid").href === url, `${path}: social URL`);
  check(meta("og:title") === title && meta("twitter:title") === title, `${path}: social titles`);
  check(Boolean(meta("description")) && meta("og:description") === meta("description") && meta("twitter:description") === meta("description"), `${path}: matching descriptions`);
  check(!/noindex/.test(meta("robots") || ""), `${path}: indexable`);
  check(!/maula|\bmola\b|membership-based food and beverage/i.test(html), `${path}: current branding`);
  for (const key of ["og:image", "twitter:image"]) check(meta(key)?.startsWith(canonicalOrigin + "/"), `${path}: public ${key}`);
  const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  check(scripts.length === 1, `${path}: one identity graph`);
  const graph = JSON.parse(scripts[0][1])["@graph"];
  const business = graph.find(item => item["@id"] === canonicalOrigin + "/#organization");
  check(business["@type"].includes("Organization") && business["@type"].includes("LocalBusiness"), `${path}: business types`);
  check(business.name === "Sanbay Fusion Foods Company Limited", `${path}: legal name`);
  check(business.logo.url === canonicalOrigin + "/brand/sanbayfusion-logo.png", `${path}: preferred logo`);
  results.push({ path, title, description: meta("description"), canonical: url });
}
const robots = await (await get("/robots.txt")).text();
check(robots.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`), "sitemap discovery");
check(!/Disallow:.*(?:brand|favicon|icon|plans|events)/.test(robots), "public pages and branding allowed");
const logo = await get("/brand/sanbayfusion-logo.png");
check(logo.headers.get("content-type")?.startsWith("image/png"), "public PNG logo");
const bytes = Buffer.from(await logo.arrayBuffer());
check(bytes.readUInt32BE(16) >= 112 && bytes.readUInt32BE(20) >= 112, "sufficient logo dimensions");
await mkdir(".next/seo-audit", { recursive: true });
await writeFile(".next/seo-audit/verification.json", JSON.stringify({ origin, checks, results }, null, 2));
console.log(JSON.stringify({ result: "PASS", pages: results.length, checks, origin }));
