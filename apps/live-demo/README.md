# DrishtiGuard Live Core Demo

An interactive evidence lab for SIH26171, implemented as a standard Next.js application. It demonstrates one bounded synthetic travel-claim workflow entirely in the browser:

1. observe synthetic DOM and visual regions;
2. create task-random typed tokens;
3. irreversibly mask the face and invoice regions;
4. serialize the exact outbound JSON, scan it for residual identifiers, and hash those exact bytes with Web Crypto SHA-256;
5. constrain the proposed operation to one opaque element ID;
6. require explicit user confirmation; and
7. revalidate page revision before local execution.

The Failure Lab seeds three negative cases: a residual identifier, a prompt-injection instruction, and a stale page revision. Each fails closed.

## Run locally

Requirements: Node.js 22.13 or newer and npm.

```bash
npm ci
npm run dev
```

Copy `.env.example` to `.env.local` only if you want canonical social-card URLs locally. The demo needs no API key, database, external endpoint, or secret.

## Verify the production build

```bash
npm run lint
npm test
npm audit --audit-level=high
```

`npm test` creates a production Next.js build, boots it on an ephemeral local port, verifies the reviewer-facing HTML and response hardening headers, and statically checks the exact-byte SHA-256, residual-PII, prompt-injection, confirmation, freshness, and no-outbound-network gates.

## Deploy on Vercel

Import the repository in Vercel and set **Root Directory** to `apps/live-demo`. Keep the detected Next.js build settings. Optionally set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin so social metadata uses your canonical domain.

## Deploy on Render

Use the repository-root `render.yaml` as a Render Blueprint. It installs locked dependencies, builds the Next.js app, starts the production server, and checks `/` for health. Optionally set `NEXT_PUBLIC_SITE_URL` to your final custom HTTPS origin; otherwise Render's supplied external URL is used.

## Honest scope

This deployable experience proves the interactive policy core and exact-payload authorization path. It is not the browser extension itself and does not claim model accuracy. The companion unpacked MV3 extension in `../extension` demonstrates explicit activation, visible-page capture, DOM-first masking, sanitized scene-graph construction, and guarded local click execution. A production pilot still requires measured on-device OCR/vision, broader browser-surface coverage, an authenticated server adapter, adversarial evaluation, and independent privacy/security review.

All displayed identities, identifiers, organizations, URLs, invoices, and account numbers are reserved synthetic fixtures.
