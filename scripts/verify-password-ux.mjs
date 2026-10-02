import { build } from "esbuild";
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

// Mount the real production forms with offline server-action stubs; no real accounts or email sends.
const folder = path.resolve(".next/password-ux-check");
await mkdir(folder, { recursive: true });
await build({ stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {SignUpForm,ResetPasswordForm} from './components/auth/auth-forms';
const mode=new URLSearchParams(location.search).get('mode');
createRoot(document.getElementById('app')).render(mode==='signup'?<SignUpForm/>:<ResetPasswordForm token="fixture-token" tokenExpiresAt={mode==='invalid'?null:Date.now()+(mode==='expiring'?3000:600000)}/>);`, resolveDir: process.cwd(), loader: "tsx" },
  bundle: true, platform: "browser", format: "esm", splitting: true, outdir: folder, entryNames: "form", jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"', "process.env": "{}" },
  plugins: [{ name: "offline-auth-actions", setup(build) {
    build.onResolve({ filter: /^@\/app\/auth\/actions$/ }, () => ({ path: "actions", namespace: "fixture" }));
    build.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: `const action=async()=>({ok:true,message:'Offline UI test only'});export const signUp=action,signIn=action,resetPassword=action,requestPasswordReset=action;` }));
  } }],
});
const stylesFolder = path.resolve(".next/static/chunks");
const css = (await Promise.all((await readdir(stylesFolder)).filter(file => file.endsWith(".css")).map(file => readFile(path.join(stylesFolder, file), "utf8")))).join("\n");
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/") { response.setHeader("Content-Type", "text/html"); response.end('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Password UX test</title><link rel="stylesheet" href="/styles.css"></head><body><main id="app" style="padding-top:32px"></main><script type="module" src="/form.js"></script></body></html>'); return; }
  if (pathname === "/styles.css") { response.setHeader("Content-Type", "text/css"); response.end(css); return; }
  try { const name = path.basename(pathname); response.setHeader("Content-Type", "text/javascript"); response.end(await readFile(path.join(folder, name))); } catch { response.statusCode = 404; response.end(); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const base = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : { channel: "msedge" }), headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", error => { errors.push(error.message); console.error("Browser error:", error.message); });
let checks = 0;
const check = (condition, label) => { assert.ok(condition, label); checks++; };
const good = "v9&Kq2!Nz7@Tr4#Lx8";
const invalid = [["short", "Aa1!short", "length"], ["uppercase", "lowercase123!", "uppercase"], ["lowercase", "UPPERCASE123!", "lowercase"], ["number", "NoNumbersHere!", "number"], ["symbol", "NoSymbolsHere123", "symbol"], ["leading space", " GoodPassword123!", "whitespace"], ["trailing space", "GoodPassword123! ", "whitespace"]];
try {
  for (const mode of ["signup", "reset"]) {
    await page.goto(`${base}/?mode=${mode}`);
    const submit = page.getByRole("button", { name: mode === "signup" ? "CREATE ACCOUNT" : "RESET PASSWORD", exact: true });
    await submit.waitFor();
    check(await submit.isDisabled(), `${mode} starts disabled`);
    if (mode === "signup") {
      await page.getByLabel("Full Name *", { exact: true }).fill("Customer Name");
      await page.getByLabel("Email Address *", { exact: true }).fill("customer@example.invalid");
      await page.getByLabel("Mobile Number *", { exact: true }).fill("+66 81 234 5678");
      await page.getByRole("checkbox").check();
    }
    const password = page.locator('input[name="password"]');
    const confirmation = page.locator('input[name="confirmation"]');
    for (const [label, value, rule] of invalid) {
      await password.fill(value); await confirmation.fill(value);
      check(await submit.isDisabled(), `${mode}: ${label} prevents submit`);
      check(await page.locator(`[data-requirement="${rule}"]`).getAttribute("data-met") === "false", `${mode}: live ${label} checklist`);
    }
    await password.fill("Password123!");
    await page.waitForFunction(() => !document.querySelector('[role="meter"]').getAttribute("aria-valuetext").includes("Checking"));
    const weak = Number(await page.getByRole("meter").getAttribute("aria-valuenow"));
    await password.fill(good);
    await page.waitForFunction(() => ["Strong", "Very Strong"].includes(document.querySelector('[role="meter"]').getAttribute("aria-valuetext")));
    check(Number(await page.getByRole("meter").getAttribute("aria-valuenow")) > weak, `${mode}: pattern-aware strength updates`);
    await confirmation.fill("different");
    check(await submit.isDisabled(), `${mode}: mismatch prevents submit`);
    check(await page.getByText("Passwords do not match", { exact: false }).isVisible(), `${mode}: mismatch status`);
    await confirmation.fill(good);
    check(await submit.isEnabled(), `${mode}: valid form enables submit`);
    check(await page.getByText("Passwords match", { exact: false }).isVisible(), `${mode}: match status`);
    check(await page.locator('[data-requirement][data-met="true"]').count() === 6, `${mode}: all checklist items met`);
    const show = page.getByRole("button", { name: mode === "signup" ? "Show password" : "Show new password", exact: true });
    await show.focus(); await page.keyboard.press("Enter");
    check(await password.getAttribute("type") === "text", `${mode}: keyboard show password`);
    await page.keyboard.press("Enter");
    check(await password.getAttribute("type") === "password", `${mode}: keyboard hide password`);
    await page.getByRole("button", { name: mode === "signup" ? "Show confirm password" : "Show confirm new password", exact: true }).click();
    check(await confirmation.getAttribute("type") === "text" && await password.getAttribute("type") === "password", `${mode}: independent confirmation toggle`);
    for (const width of [320, 768, 1280]) {
      await page.setViewportSize({ width, height: 1100 });
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${mode}: no horizontal overflow at ${width}`);
      await page.screenshot({ path: path.join(folder, `${mode}-${width}.png`), fullPage: true });
    }
    if (mode === "signup") {
      for (const name of ["fullName", "email", "phone"]) {
        const input = page.locator(`input[name="${name}"]`); const saved = await input.inputValue();
        await input.fill(name === "email" ? "not-an-email" : ""); check(await submit.isDisabled(), `invalid ${name} prevents signup`); await input.fill(saved);
      }
      await page.getByRole("checkbox").uncheck(); check(await submit.isDisabled(), "agreements required");
    }
  }
  await page.goto(`${base}/?mode=invalid`);
  check(await page.getByRole("button", { name: "RESET PASSWORD", exact: true }).isDisabled(), "invalid reset token prevents submit");
  check(await page.getByRole("link", { name: "Request a new reset link" }).isVisible(), "invalid reset link recovery");
  await page.goto(`${base}/?mode=expiring`);
  await page.locator('input[name="password"]').fill(good); await page.locator('input[name="confirmation"]').fill(good);
  check(await page.getByRole("button", { name: "RESET PASSWORD", exact: true }).isEnabled(), "valid token enables reset");
  await page.getByRole("link", { name: "Request a new reset link" }).waitFor({ timeout: 6000 });
  check(await page.getByRole("button", { name: "RESET PASSWORD", exact: true }).isDisabled(), "expiry disables open reset form");
  check(errors.length === 0, `no browser errors: ${errors.join(", ")}`);
  await writeFile(path.join(folder, "results.json"), JSON.stringify({ checks, passed: true, actualComponents: true, offlineActions: true }, null, 2));
  console.log(`Password UX: ${checks} browser checks passed on the actual shared forms; server actions were stubbed and no external requests were sent.`);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
