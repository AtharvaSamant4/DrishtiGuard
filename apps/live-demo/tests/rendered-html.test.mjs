import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
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
  assert.match(html, /<title>DrishtiGuard[^<]*Privacy Guardrail[^<]*Extension Demo<\/title>/i);
  assert.match(html, /SIH26171/);
  assert.match(html, /Start protection demo/);
  assert.match(html, /Protect page/);
  assert.match(html, /AI suggests/);
  assert.match(html, /Guarded action/);
  assert.match(html, /HOW THE PROTOTYPE WORKS/);
  assert.match(html, /Candidate safe payload/);
  assert.match(html, /FAILURE LAB/);
  assert.match(html, /Residual PII leak/);
  assert.match(html, /Page prompt injection/);
  assert.match(html, /Stale page state/);
  assert.match(html, /SYNTHETIC PAGE/);
  assert.match(html, /Download extension \(\.zip\)/);
  assert.match(html, /\/downloads\/DrishtiGuard-Chromium-v0\.1\.0\.zip/);
  assert.match(html, /chrome:\/\/extensions/);
  assert.match(html, /Chrome blocks direct website installation/);
  assert.match(html, /does not call a remote AI/i);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/i);

  const downloadResponse = await fetch(`${server.origin}/downloads/DrishtiGuard-Chromium-v0.1.0.zip`);
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get("content-type") ?? "", /^application\/zip\b/i);
  assert.match(downloadResponse.headers.get("content-disposition") ?? "", /^attachment;/i);
  const downloadBytes = Buffer.from(await downloadResponse.arrayBuffer());
  assert.ok(downloadBytes.length > 10_000, "extension ZIP should not be an empty placeholder");
  assert.equal(downloadBytes.subarray(0, 4).toString("hex"), "504b0304");

  const healthResponse = await fetch(`${server.origin}/api/health`);
  assert.equal(healthResponse.status, 200);
  assert.match(healthResponse.headers.get("cache-control") ?? "", /^no-store\b/i);
  assert.deepEqual(await healthResponse.json(), {
    status: "ok",
    service: "drishtiguard-live-demo",
    version: "0.1.0",
  });
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

test("downloadable extension release and checksum are committed", async () => {
  const archiveUrl = new URL("../public/downloads/DrishtiGuard-Chromium-v0.1.0.zip", import.meta.url);
  const checksumUrl = new URL("../public/downloads/DrishtiGuard-Chromium-v0.1.0.zip.sha256.txt", import.meta.url);
  const archive = await readFile(archiveUrl);
  const checksum = await readFile(checksumUrl, "utf8");
  const archiveStat = await stat(archiveUrl);
  const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.equal(archive.subarray(0, 4).toString("hex"), "504b0304");
  assert.ok(archiveStat.size > 10_000);
  assert.match(checksum, /^[a-f0-9]{64}[ ]{2}DrishtiGuard-Chromium-v0\.1\.0\.zip\n$/);
  const digest = createHash("sha256").update(archive).digest("hex");
  assert.equal(checksum.slice(0, 64), digest);
  assert.match(pageSource, new RegExp(digest));
});
