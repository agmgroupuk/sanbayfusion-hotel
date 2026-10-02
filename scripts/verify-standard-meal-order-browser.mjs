import { build } from "esbuild";
import { chromium } from "playwright";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";

// Exercise the actual confirmation component without credentials or a payment provider.
// The corresponding isolated Postgres tests exercise the real API/service and ledger.
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser = await chromium.launch({ ...(existsSync(edge) ? { executablePath: edge } : {}), headless: true });
const page = await browser.newPage();
const errors = []; page.on("pageerror", error => errors.push(error.message));
let requests = 0;
await page.route("https://meal-preview.invalid/api/orders/payment-intent", async route => {
  requests++;
  assert.equal(route.request().postDataJSON().expectedTotal, 0);
  await route.fulfill({ contentType: "application/json", body: JSON.stringify({ confirmed: true, orderNumber: "SBF-O-PREVIEW", total: 0 }) });
});
try {
  for (const total of [840, 0]) {
    const props = { items: [{ category: "Thai soups", name: "Tom Yum Goong", quantity: total ? 12 : 8, price: 320, lineTotal: total ? 3840 : 2560 }], subtotal: total, notes: "", customer: { name: "Preview", email: "preview@example.invalid", phone: "" }, membership: { plan: "1-Month Membership", memberId: "preview", status: "active" }, delivery: {}, orderNumber: "Pending", standardMeal: { membershipId: "00000000-0000-4000-8000-000000000001", serviceMonth: "2027-01", allowanceApplied: total ? 3000 : 2560, scheduledDate: "2027-01-15", scheduledTime: "19:30" } };
    const bundle = await build({ stdin: { contents: `import React from "react"; import { createRoot } from "react-dom/client"; import { CheckoutPayment } from "./components/orders/checkout-payment"; createRoot(document.getElementById("root")).render(<CheckoutPayment {...${JSON.stringify(props)}} />);`, resolveDir: process.cwd(), loader: "tsx" }, bundle: true, write: false, platform: "browser", jsx: "automatic", define: { "process.env": "{}", "process.env.NODE_ENV": '"production"' } });
    await page.route(`https://meal-preview.invalid/${total}`, route => route.fulfill({ contentType: "text/html", body: `<html><meta charset="utf-8"><body><div id="root"></div><script>${bundle.outputFiles[0].text}</script></body></html>` }));
    await page.goto(`https://meal-preview.invalid/${total}`);
    await page.getByRole("heading", { name: "Confirm your Standard Meal" }).waitFor();
    assert.equal(requests, 0, "Viewing a free meal must not spend its allowance");
    assert.ok((await page.locator("body").innerText()).includes(`Amount payable: ฿${total}`));
    if (total === 0) {
      await page.getByRole("button", { name: /Confirm included meal/ }).click();
      await page.getByRole("heading", { name: "Order Confirmed" }).waitFor();
      assert.equal(requests, 1);
    }
  }
  assert.deepEqual(errors, []);
  console.log("Verified actual meal checkout displays only the excess and makes no order request until explicit zero-payment confirmation.");
} finally { await browser.close(); }
