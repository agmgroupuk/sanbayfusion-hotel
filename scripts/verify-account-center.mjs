import { spawn } from "node:child_process";
if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) throw new Error("Sandbox required");
const child=spawn(process.execPath,["node_modules/vitest/vitest.mjs","run","lib/account/account.sandbox.test.ts",...process.argv.slice(2)],{env:{...process.env,RUN_ACCOUNT_SANDBOX_E2E:"true"},stdio:"inherit"});
process.exitCode=await new Promise(resolve=>child.once("exit",code=>resolve(code??1)));
