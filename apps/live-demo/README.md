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

The site also explains the complete prototype in plain language and serves the versioned companion extension at `/downloads/DrishtiGuard-Chromium-v0.1.0.zip`, with a published SHA-256 checksum and unpacked-install instructions.

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

## Run the production container

From the repository root:

```bash
docker compose up --build
```

Open `http://localhost:3000` and check `http://localhost:3000/api/health`. The Compose profile applies a non-root user, read-only root filesystem, dropped Linux capabilities and `no-new-privileges`.

To build the image directly with the correct canonical metadata URL:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SITE_URL=https://demo.example.com \
  --tag drishtiguard-live-demo:latest \
  .

docker run --rm --publish 3000:3000 drishtiguard-live-demo:latest
```

Run the direct-build commands from `apps/live-demo`. `NEXT_PUBLIC_SITE_URL` is a build-time value; changing it only at `docker run` time does not rewrite the statically generated social metadata.

## Deploy on Vercel

Import the repository in Vercel and set **Root Directory** to `apps/live-demo`. Keep the detected Next.js build settings. Optionally set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin so social metadata uses your canonical domain.

## Deploy on Render

Use the repository-root `render.yaml` as a Render Blueprint. It builds this Dockerfile, starts the Next.js standalone server and checks `/api/health`. Enter the service's final HTTPS origin when Render prompts for `NEXT_PUBLIC_SITE_URL`.

## Honest scope

This deployable experience proves the interactive policy core and exact-payload authorization path. The separately downloadable MV3 extension in `../extension` demonstrates explicit activation, visible-page capture, DOM-first masking, sanitized scene-graph construction, and guarded local click execution. The MVP does not call a remote AI or claim model accuracy. A production pilot still requires measured on-device OCR/vision, broader browser-surface coverage, an authenticated server adapter, adversarial evaluation, and independent privacy/security review.

## Rebuild the extension download

After changing extension runtime files or icons, regenerate the committed website download from `apps/live-demo`:

```bash
npm run package:extension
```

The packaging script creates a deterministic ZIP with `manifest.json` at the archive root and refreshes its checksum file.

All displayed identities, identifiers, organizations, URLs, invoices, and account numbers are reserved synthetic fixtures.
