import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const require = createRequire(import.meta.url);
const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const nextCli = require.resolve("next/dist/bin/next");

async function availablePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const address = probe.address();
  const port = typeof address === "object" && address ? address.port : 0;
  await new Promise((resolve, reject) => probe.close((error) => (error ? reject(error) : resolve())));
  return port;
}

async function startProductionServer() {
  const port = await availablePort();
  const processHandle = spawn(
    process.execPath,
    [nextCli, "start", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: appRoot,
      env: { ...process.env, NODE_ENV: "production" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let logs = "";
  processHandle.stdout.on("data", (chunk) => {
    logs += chunk;
  });
  processHandle.stderr.on("data", (chunk) => {
    logs += chunk;
  });

  const origin = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) {
      throw new Error(`Next.js exited before it became ready.\n${logs}`);
    }
    try {
      const response = await fetch(origin, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return { logs: () => logs, origin, processHandle };
    } catch {
      // The server is still starting.
    }
    await delay(150);
  }

  processHandle.kill();
  throw new Error(`Timed out waiting for the Next.js production server.\n${logs}`);
}

async function stopProductionServer(processHandle) {
  if (processHandle.exitCode !== null) return;
  processHandle.kill();
  const exited = await Promise.race([
    new Promise((resolve) => processHandle.once("exit", () => resolve(true))),
    delay(5_000, false),
  ]);
  if (!exited && processHandle.exitCode === null) processHandle.kill("SIGKILL");
}

test("server-renders the DrishtiGuard evidence lab", { timeout: 45_000 }, async (context) => {
  const server = await startProductionServer();
  context.after(() => stopProductionServer(server.processHandle));

  const response = await fetch(server.origin);
  assert.equal(response.status, 200, server.logs());
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.equal(response.headers.get("x-powered-by"), null);
  assert.equal(response.headers.get("x-frame-options"), "DENY");

  const html = await response.text();
  assert.match(html, /<title>DrishtiGuard[^<]*Interactive Privacy Boundary<\/title>/i);
  assert.match(html, /SIH26171/);
  assert.match(html, /Run privacy pipeline/);
  assert.match(html, /Exact outbound body/);
  assert.match(html, /FAILURE LAB/);
  assert.match(html, /Residual PII leak/);
  assert.match(html, /Page prompt injection/);
  assert.match(html, /Stale page state/);
  assert.match(html, /SYNTHETIC PAGE/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/i);
});

test("source contains the claimed local safety gates", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(page, /new TextEncoder\(\)\.encode\(exactBody\)/);
  assert.match(page, /Residual identifier found in the exact serialized request/);
  assert.match(page, /Untrusted page instruction requested an out-of-scope target/);
  assert.match(page, /Stale action refused/);
  assert.match(page, /requiresConfirmation:\s*true/);
  assert.match(page, /performance\.now\(\)/);
  assert.doesNotMatch(page, /fetch\s*\(|XMLHttpRequest|WebSocket\s*\(/);
});
