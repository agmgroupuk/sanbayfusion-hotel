import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  const timer = setTimeout(() => { for (const child of children) child.kill("SIGKILL"); process.exit(code); }, 25_000);
  timer.unref();
  process.exitCode = code;
}
function launch(args) {
  const child = spawn(process.execPath, args, { stdio: "inherit", windowsHide: true });
  children.push(child);
  child.on("error", () => stop(1));
  child.on("exit", code => { if (!stopping) stop(code || 1); });
}
// Two supervised processes in the existing Railway service; no additional service or public cron endpoint.
launch([require.resolve("next/dist/bin/next"), "start"]);
if (process.env.EMAIL_WORKER_ENABLED === "true") launch([".next/email-worker.mjs"]);
process.on("SIGTERM", () => stop());
process.on("SIGINT", () => stop());
