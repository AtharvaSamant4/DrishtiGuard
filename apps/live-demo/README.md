# DrishtiGuard Live Core Demo

An interactive, public-friendly evidence lab for SIH26171. It demonstrates one bounded synthetic travel-claim workflow entirely in the browser:

1. observe synthetic DOM and visual regions;
2. create task-random typed tokens;
3. irreversibly mask the face/invoice regions;
4. serialize the exact outbound JSON, re-scan it for residual identifiers, and hash those exact bytes with Web Crypto SHA-256;
5. constrain the proposed operation to one opaque element ID;
6. require explicit user confirmation; and
7. revalidate page revision before local execution.

The Failure Lab seeds three negative cases: a residual identifier, a prompt-injection instruction, and a stale page revision. Each must fail closed.

## Run and verify

```bash
npm ci
npm run dev
npm test
```

`npm test` performs a production build, renders the Worker response, verifies the reviewer-facing evidence surfaces, and statically checks that the implementation contains the exact-byte SHA-256, residual-PII, prompt-injection, confirmation, and freshness gates with no outbound network call.

## Honest scope

This hosted experience proves the interactive policy core and exact-payload authorization path. It is not the browser extension itself and does not claim model accuracy. The companion unpacked MV3 extension in `../extension` demonstrates explicit activation, visible-page capture, DOM-first masking, sanitized scene-graph construction, and guarded local click execution. A production pilot still requires measured on-device OCR/vision, broader browser-surface coverage, an authenticated server adapter, adversarial evaluation, and independent privacy/security review.

All displayed identities, identifiers, organizations, URLs, invoices, and account numbers are reserved synthetic fixtures. No API key, account, telemetry SDK, external endpoint, or reusable credential is included.
