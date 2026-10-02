import { chromium } from "playwright";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { tsImport } from "tsx/esm/api";
const { membershipPlans } = await tsImport("../lib/membership-plans.ts", import.meta.url);

const origin = process.env.VERIFY_ORIGIN ?? "http://localhost:3102";
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser = await chromium.launch({ ...(existsSync(edge) ? { executablePath: edge } : {}), headless: true });
const page = await browser.newPage({ reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const fee = plan => `฿${plan.price.toLocaleString("en-US")}`;
try {
  await mkdir(".next/verification", { recursive: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/plans`);
    const cards = page.locator("article");
    assert.equal(await cards.count(), 12);
    for (const [index, plan] of membershipPlans.entries()) {
      assert.ok((await cards.nth(index).innerText()).includes(fee(plan)), plan.name);
      assert.ok((await cards.nth(index).innerText()).includes(`฿${plan.includedBenefit.menuValue.toLocaleString("en-US")}`), `${plan.name} allowance`);
      await cards.nth(index).getByRole("button", { name: /^Plan details for/ }).click();
      assert.ok((await page.getByRole("dialog").innerText()).includes(fee(plan)), `${plan.name} dialog`);
      assert.ok((await page.getByRole("dialog").innerText()).includes("Standard Meal"));
      await page.keyboard.press("Escape");
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `.next/verification/membership-pricing-${width}.png`, fullPage: true });
  }
  for (const plan of membershipPlans) {
    await page.goto(`${origin}/plans/${plan.slug}`);
    assert.ok((await page.locator("header").last().innerText()).includes(fee(plan)), `${plan.name} configuration`);
    assert.ok((await page.locator("aside").innerText()).includes(fee(plan)), `${plan.name} cart`);
  }
  for (const path of ["/pricing", "/membership", "/join"]) {
    await page.goto(`${origin}${path}`);
    const text = await page.locator("body").innerText();
    for (const plan of membershipPlans) assert.ok(text.includes(fee(plan)), `${path}: ${plan.name}`);
  }
  assert.deepEqual(errors, []);
  console.log("Verified all 12 fees on desktop/mobile cards and dialogs, configuration/cart summaries, pricing, membership and join pages.");
} finally { await browser.close(); }
