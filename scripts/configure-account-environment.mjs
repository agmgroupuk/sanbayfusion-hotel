import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
try {
 if (process.env.RAILWAY_PROJECT_ID !== "ea31f46e-5f06-4394-8580-22f343c28132" || process.env.RAILWAY_ENVIRONMENT_NAME !== "production" || !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) throw new Error("Wrong environment");
 for (const name of ["STRIPE_SECRET_KEY", "DATABASE_URL", "RESEND_API_KEY", "RESERVATION_FROM_EMAIL", "NEXT_PUBLIC_SITE_URL", "ACCOUNT_SECURITY_KEY"]) console.log(`${name}: ${process.env[name] === undefined ? "MISSING" : !process.env[name].trim() ? "EMPTY" : "PRESENT"}`);
 if (!process.env.ACCOUNT_SECURITY_KEY && process.argv.includes("--configure")) {
   const cli = join(process.env.APPDATA, "npm/node_modules/@railway/cli/bin/railway.js");
   execFileSync(process.execPath, [cli, "variables", "set", "ACCOUNT_SECURITY_KEY", "--stdin", "--service", "sanbayfusion-hotel", "--environment", "production", "--skip-deploys"], { input: randomBytes(32).toString("hex"), stdio: ["pipe", "pipe", "pipe"] });
   console.log("ACCOUNT_SECURITY_KEY: PRESENT (new dedicated encryption key stored directly in Railway; no deployment triggered)");
 }
} catch { console.error("Account environment check failed; sensitive details suppressed."); process.exitCode=1; }
