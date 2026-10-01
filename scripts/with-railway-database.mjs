// Run only through `railway run --service sanbayfusion-hotel --environment production`.
// Resolve the same Postgres service's public endpoint in memory for local tools.
import { execFileSync, spawn } from "node:child_process";
import { join } from "node:path";
import { createConnection } from "node:net";

let tunnel;

try {
  if (process.env.RAILWAY_PROJECT_ID !== "ea31f46e-5f06-4394-8580-22f343c28132" || process.env.RAILWAY_ENVIRONMENT_NAME !== "production") throw new Error("Unexpected Railway target");
  const original = new URL(process.env.DATABASE_URL ?? "");
  if (original.hostname.endsWith(".railway.internal")) {
    const cli = join(process.env.APPDATA ?? "", "npm/node_modules/@railway/cli/bin/railway.js");
    const raw = execFileSync(process.execPath, [cli, "variables", "--service", "Postgres", "--environment", "production", "--json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const vars = JSON.parse(raw);
    const internal = new URL(vars.DATABASE_URL);
    if (original.hostname !== internal.hostname || original.username !== internal.username || original.password !== internal.password || original.pathname !== internal.pathname) throw new Error("Database identity mismatch");
    if (vars.DATABASE_PUBLIC_URL) {
      const external = new URL(vars.DATABASE_PUBLIC_URL);
      if (external.username !== internal.username || external.password !== internal.password || external.pathname !== internal.pathname) throw new Error("Database identity mismatch");
      process.env.DATABASE_URL = external.toString();
    } else {
      const port = 55439;
      const reachable = () => new Promise(resolve => { const socket = createConnection({ host: "127.0.0.1", port }); socket.once("connect", () => { socket.destroy(); resolve(true); }); socket.once("error", () => resolve(false)); });
      if (await reachable()) throw new Error("Tunnel port already occupied");
      tunnel = spawn(process.execPath, [cli, "connect", "Postgres", "--environment", "production", "--tunnel-only", "--port", String(port)], { stdio: ["ignore", "pipe", "pipe"] });
      // Connection details may contain credentials. Drain them without printing.
      tunnel.stdout.on("data", () => {});
      tunnel.stderr.on("data", () => {});
      let ready = false;
      for (let i = 0; i < 60; i++) {
        if (tunnel.exitCode !== null) throw new Error("Railway SSH tunnel exited");
        if (await reachable()) { ready = true; break; }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      if (!ready) throw new Error("Railway SSH tunnel unavailable");
      internal.hostname = "127.0.0.1";
      internal.port = String(port);
      process.env.DATABASE_URL = internal.toString();
    }
    console.log("Database connection: verified same Railway Postgres service; private connection resolved in memory.");
  }
  const args = process.argv.slice(2);
  if (!args.length) throw new Error("Missing script");
  const child = spawn(process.execPath, ["--import", "tsx", ...args], { env: process.env, stdio: "inherit" });
  process.exitCode = await new Promise(resolve => child.once("exit", code => resolve(code ?? 1)));
} catch (error) {
  const safeMessages = ["Unexpected Railway target", "Database identity mismatch", "Missing script", "Railway SSH tunnel exited", "Railway SSH tunnel unavailable", "Tunnel port already occupied"];
  console.error(`Railway database injection failed: ${safeMessages.includes(error.message) ? error.message : error.code ?? error.name}. Sensitive details suppressed.`);
  process.exitCode = 1;
} finally {
  if (tunnel) {
    // The Railway wrapper spawns its own SSH children on Windows.
    if (process.platform === "win32") { try { execFileSync("taskkill", ["/PID", String(tunnel.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} }
    else tunnel.kill("SIGTERM");
  }
}
