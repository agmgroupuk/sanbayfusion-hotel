import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const origin = process.env.VERIFY_ORIGIN || "http://127.0.0.1:3108";
const folder = ".next/contact-social-audit";
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
let checks = 0;
const check = (condition, label) => { assert.ok(condition, label); checks++; };
const destinations = { Facebook: "https://facebook.com/sanbayfusion", Instagram: "https://instagram.com/sanbayfusion", TikTok: "https://tiktok.com/@sanbayfusion" };
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(origin + "/contact", { waitUntil: "domcontentloaded" });
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    check((await footer.innerText()).includes("Manager: Suchada Burandech"), "official manager");
    check(await footer.locator('a[href="tel:+66808972129"]').count() === 1, "official telephone");
    for (const [name, url] of Object.entries(destinations)) {
      const link = footer.getByRole("link", { name: `${name}: Sanbay Fusion (opens in a new tab)`, exact: true });
      check(await link.getAttribute("href") === url, name + " destination");
      check(await link.getAttribute("rel") === "noopener noreferrer", name + " safe new tab");
      check(await link.locator("img").evaluate(img => img.complete && img.naturalWidth > 0), name + " local icon loads");
      await link.focus();
      check(await link.evaluate(e => document.activeElement === e), name + " keyboard focus");
    }
    for (const name of ["LINE", "WhatsApp"]) {
      check(await footer.getByRole("img", { name: `${name}: direct contact link not yet available` }).count() === 1, name + " accessible pending icon");
      check(await footer.locator(`a[aria-label^="${name}:"]`).count() === 0, name + " no invented link");
    }
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "responsive without overflow");
    await footer.screenshot({ path: `${folder}/footer-${width}.png` });
  }
  for (const path of ["/about", "/how-it-works", "/events"]) {
    const response = await page.goto(origin + path, { waitUntil: "domcontentloaded" });
    check(response.status() === 200, path + " available");
    check(await page.locator('main a[href="tel:+66808972129"]').count() > 0, path + " direct assistance");
  }
  for (const name of ["facebook", "instagram", "tiktok", "line", "whatsapp"]) for (const ext of ["svg", "png"]) {
    const response = await page.request.get(origin + `/brand/social/${name}.${ext}`);
    check(response.status() === 200 && response.headers()["content-type"].startsWith("image/"), name + " " + ext + " served");
  }
  check(errors.length === 0, "no browser errors");
  await writeFile(`${folder}/results.json`, JSON.stringify({ checks, result: "PASS", errors }, null, 2));
  console.log(JSON.stringify({ checks, result: "PASS", evidence: folder }));
} finally { await browser.close(); }
