# ADR-0006: Keep token mappings in an active in-memory vault

**Status:** Accepted  
**Context:** Persistence improves continuity but creates durable re-identification material. MV3 service workers can be suspended, so service-worker memory alone is unreliable.

## Decision

Own the vault in the active extension compute/UI host, use short idle/hard TTLs, and persist no mappings. Host loss, task end, tab close, expiry, extension update or unexpected navigation invalidates capabilities and cancels dependent work. Same-origin continuity may reissue explicitly authorized user-task tokens with new IDs; page-derived mappings do not silently persist.

## Alternatives

- `chrome.storage`/IndexedDB encryption: durable but key storage and local compromise remain difficult.
- Service-worker memory: simpler but lifecycle loss is unpredictable.
- Server-side vault: violates the device-local invariant.

## Consequences

Privacy blast radius and forensic persistence shrink. Long tasks can be interrupted and must restart.

## Risks

JavaScript cannot guarantee physical memory zeroization; a local process can inspect memory. Minimize copies, overwrite mutable buffers and state the local-compromise boundary explicitly.
