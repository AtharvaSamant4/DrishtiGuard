# ADR-0004: Verify the exact outbound bytes and fail closed

**Status:** Accepted  
**Context:** Detection and masking can fail because of missed regions, encoding metadata, alpha channels or cross-modal leaks. Scanning an intermediate canvas does not prove the network body is safe.

## Decision

After compilation and encoding, inspect the exact image and serialized multipart/JSON. Verify known values/canaries, patterns, secondary OCR, coverage, mask opacity, metadata, forbidden keys and payload limits. Mint a short-lived `VerifiedEnvelope` over the exact SHA-256 body digest. Only `SAFE_TO_SEND` authorizes the gateway. Retry masking at most twice, then block.

## Alternatives

- Single-pass sanitizer: lower latency but no independent leakage gate.
- Server-side validation: sensitive content has already crossed the boundary.
- Best-effort warning: contradicts the core privacy posture.

## Consequences

The claim can be demonstrated against actual traffic and failure is explicit. Latency and implementation cost increase.

## Risks

The verifier can share failure modes with the detector, and a compromised extension can bypass it. Use different OCR settings/model where feasible, final-byte canaries, static networking restrictions and supply-chain controls.
