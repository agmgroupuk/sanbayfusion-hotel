import { chromium } from "playwright";
import { build } from "esbuild";
import { mkdir, readFile } from "node:fs/promises";
import { existsSync, globSync } from "node:fs";
import assert from "node:assert/strict";

const origin = process.env.VERIFY_ORIGIN ?? "http://localhost:3102";
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser = await chromium.launch({ ...(existsSync(edge) ? { executablePath: edge } : {}), headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.setDefaultTimeout(20000);
await mkdir(".next/verification", { recursive: true });
try {
  if (!process.argv.includes("--active-only")) {
  assert.equal((await page.goto(`${origin}/plans`)).status(), 200);
  await page.waitForLoadState("networkidle");
  const buttons = page.getByRole("button", { name: /^Plan details for/ });
  assert.equal(await buttons.count(), 12);
  assert.equal(await page.getByRole("link", { name: "Select plan", exact: true }).count(), 12);
  for (let index = 0; index < 12; index++) {
    await buttons.nth(index).click();
    const dialog = page.getByRole("dialog");
    assert.match(await dialog.innerText(), new RegExp(`${index + 1}-Month Membership`));
    assert.match(await dialog.innerText(), /no cash value/);
    assert.match(await dialog.innerText(), new RegExp((2000 + index * 500).toLocaleString("en-US")));
    assert.equal(await dialog.getByRole("link", { name: "Select this plan" }).count(), 1);
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
  }
  await page.screenshot({ path: ".next/verification/service-plans-desktop.png", fullPage: true });
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto(`${origin}/plans/3-month-membership`);
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle");
    const nextYear = Number(await page.getByLabel("Service year").locator("option").last().getAttribute("value"));
    await page.getByLabel("Service year").selectOption(String(nextYear));
    const proceed = page.getByRole("button", { name: "Continue to Application" });
    assert.equal(await proceed.isDisabled(), true);
    for (const month of ["February", "July", "November"]) await page.getByRole("button", { name: `${month} ${nextYear}`, exact: true }).click();
    assert.equal(await proceed.isEnabled(), true);
    assert.equal(await page.getByRole("button", { name: `March ${nextYear}`, exact: true }).isDisabled(), true);
    await page.getByRole("button", { name: `July ${nextYear}`, exact: true }).click();
    assert.equal(await proceed.isDisabled(), true);
    await page.getByRole("button", { name: `July ${nextYear}`, exact: true }).click();
    await page.locator("#service-month-title").locator("..").screenshot({ path: `.next/verification/month-picker-${viewport.width}.png` });
    await page.getByRole("radio", { name: /Membership \+ prepaid package/ }).check();
    await page.getByRole("checkbox", { name: /^Tom Yum Goong/ }).check();
    for (let index = 0; index < 3; index++) await page.getByRole("button", { name: "Increase Tom Yum Goong quantity", exact: true }).click();
    assert.match(await page.locator("aside").innerText(), /18,840/);
    assert.match(await page.locator("aside").innerText(), /No additional benefit charge/);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `.next/verification/service-months-${viewport.width}.png`, fullPage: true });
    const saved = page.waitForResponse(response => response.url().endsWith("/api/membership/checkout-selection") && response.request().method() === "POST");
    await proceed.click();
    assert.equal((await saved).status(), 200);
    await page.waitForURL(/\/signin/);
    assert.ok((await page.context().cookies()).find(cookie => cookie.name === "sbf_membership_checkout")?.httpOnly);
  }
  await page.goto(`${origin}/plans/12-month-membership`);
  await page.waitForLoadState("networkidle");
  const year = await page.getByLabel("Service year").inputValue();
  for (const month of ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]) await page.getByRole("button", { name: `${month} ${year}`, exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Continue to Application" }).isEnabled(), true);
  assert.match(await page.locator("#service-month-title").locator("..").innerText(), /12 of 12/i);
  }
  // Render the active-member card with actual production components; server blocking
  // and ownership are exercised separately against the isolated database in Vitest.
  const bundle = await build({ stdin: { contents: 'import React from "react"; import { createRoot } from "react-dom/client"; import { PlanCard } from "./components/membership/plan-card"; import { membershipPlans } from "./lib/membership-plans"; createRoot(document.getElementById("root")).render(<PlanCard plan={membershipPlans[2]} activeMembership />);', resolveDir: process.cwd(), loader: "tsx" }, bundle: true, write: false, platform: "browser", jsx: "automatic", define: { "process.env": "{}", "process.env.NODE_ENV": '"production"' } });
  const cssPaths = globSync(".next/static/chunks/*.css");
  const css = (await Promise.all(cssPaths.map(path => readFile(path, "utf8")))).join("\n");
  await page.route(`${origin}/__membership-verification`, route => route.fulfill({ contentType: "text/html", body: `<html class="dark"><head><style>${css}</style></head><body><div id="root" style="max-width:440px;padding:20px;margin:auto"></div><script>${bundle.outputFiles[0].text}</script></body></html>` }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/__membership-verification`);
  assert.equal(await page.getByRole("link", { name: "Select plan", exact: true }).count(), 0);
  await page.getByRole("button", { name: "Membership already active", exact: true }).click();
  assert.match(await page.getByRole("dialog").innerText(), /cannot purchase another membership/);
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: /^Plan details for/ }).click();
  const dialog = page.getByRole("dialog");
  assert.equal(await dialog.getByRole("link", { name: "Select this plan" }).count(), 0);
  assert.equal(await dialog.getByRole("link", { name: "View my membership" }).count(), 1);
  assert.ok(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth));
  await page.screenshot({ path: ".next/verification/service-plan-modal-mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(process.argv.includes("--active-only") ? "Verified active-member notice, information dialog, unavailable purchase actions and mobile modal layout." : "Verified all 12 plan dialogs, exact non-consecutive selections, all-12 selection, unchanged prepaid arithmetic, saved checkout redirect, active-member blocking, keyboard dismissal and desktop/tablet/mobile layouts.");
} catch (error) {
  await page.screenshot({ path: ".next/verification/service-months-debug.png", fullPage: true });
  console.error("Page at failure:", page.url(), (await page.locator("body").innerText()).slice(0, 2400));
  console.error("Browser errors:", errors);
  throw error;
} finally { await browser.close(); }
