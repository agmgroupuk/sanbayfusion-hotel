import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";

const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
try {
  await page.goto("http://localhost:3101/plans");
  await page.getByRole("link", { name: "SELECT PLAN", exact: true }).first().waitFor();
  assert.equal(await page.getByRole("link", { name: "SELECT PLAN", exact: true }).count(), 12);
  assert.match(await page.locator("body").innerText(), /฿6,000/);
  assert.match(await page.locator("body").innerText(), /฿30,000/);
  await mkdir(".next/verification", { recursive: true });
  await page.screenshot({ path: ".next/verification/plans-desktop.png", fullPage: true });
  await page.goto("http://localhost:3101/plans/3-month-membership");
  await page.getByRole("radio", { name: /Membership \+ prepaid package/ }).check();
  await page.getByRole("checkbox", { name: /^Tom Yum Goong/ }).check();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Increase Tom Yum Goong quantity", exact: true }).click();
  const summary = await page.locator("aside").innerText();
  assert.match(summary, /Monthly Quantity: 4/);
  assert.match(summary, /Total Included Quantity: 12/);
  assert.match(summary, /18,840/);
  assert.doesNotMatch(summary, /\[object Object\]|annually|per delivery|12-month validity/);
  await page.screenshot({ path: ".next/verification/package-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Continue to Application" }).click();
  await page.waitForURL(/\/signin/);
  assert.match(page.url(), /next=/);
  const selection = (await page.context().cookies()).find(cookie => cookie.name === "sbf_membership_checkout");
  assert.ok(selection?.httpOnly);
  await page.goto("http://localhost:3101/plans/1-month-membership");
  await page.getByRole("button", { name: "Continue to Application" }).click();
  await page.waitForURL(/\/signin/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3101/plans");
  assert.equal(await page.getByRole("link", { name: "SELECT PLAN", exact: true }).count(), 12);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: ".next/verification/plans-mobile.png", fullPage: true });
  for (const route of ["/faq", "/how-it-works", "/terms-and-conditions", "/pricing", "/membership"]) {
    const response = await page.goto(`http://localhost:3101${route}`);
    assert.equal(response.status(), 200);
    const text = await page.locator("body").innerText();
    assert.doesNotMatch(text, /all standard memberships are valid for 12|every membership is valid for 12|delivery days\/month|20 membership plans|\[object Object\]/i);
  }
  assert.deepEqual(errors, []);
  console.log("Browser verified: 12 desktop/mobile cards; monthly quantity 4 × 3 months = 12 units; total THB 18,840; both modes save selection and redirect to sign-in; supporting pages render; no page errors or mobile overflow.");
} finally { await browser.close(); }
