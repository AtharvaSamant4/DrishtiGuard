# ADR-0007: Isolate browser differences behind capability adapters

**Status:** Accepted  
**Context:** Chromium and Firefox differ in MV3 lifecycle, capture permissions, offscreen facilities and WebGPU availability. Forked codebases would duplicate privacy-critical logic.

## Decision

Use one TypeScript/domain codebase and interfaces for `CaptureAdapter`, `PermissionAdapter`, `ComputeHostAdapter`, `ModelRuntimeAdapter`, `DocumentIdentityAdapter` and `StorageAdapter`. Select by tested capability, not scattered browser-name branches. Build browser manifests from one WXT project [R6].

## Alternatives

- Chromium only: simplest but does not meet stated cross-browser direction.
- Separate browser repositories: flexible but high drift/security review cost.
- Lowest-common-denominator runtime: wastes WebGPU while still not solving lifecycle differences.

## Consequences

Core privacy/policy logic is shared and adapters are contract-tested. Equal performance is not implied. Adapter test burden remains.

## Risks

An adapter may claim a capability incorrectly. Freeze supported versions, run end-to-end matrix tests and block unsupported surfaces.
