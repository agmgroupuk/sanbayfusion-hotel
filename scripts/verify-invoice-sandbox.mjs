import { spawn } from "node:child_process";
if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") || process.env.RAILWAY_PROJECT_ID !== "ea31f46e-5f06-4394-8580-22f343c28132") throw new Error("Expected Sanbay Fusion Stripe Sandbox environment");
const child = spawn(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "lib/membership-invoice.sandbox.test.ts", ...process.argv.slice(2)], { windowsHide: true, env: { ...process.env, RUN_INVOICE_SANDBOX_E2E: "true", RESEND_API_KEY: "" }, stdio: "inherit" });
process.exitCode = await new Promise(resolve => child.once("exit", code => resolve(code ?? 1)));
