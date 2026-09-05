import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the DrishtiGuard evidence lab", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>DrishtiGuard — Interactive Privacy Boundary<\/title>/i);
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
