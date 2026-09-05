# ADR-0008: Use solid opaque masks for critical visual data

**Status:** Accepted  
**Context:** Blur, mosaic and weak pixelation may preserve recoverable structure. Overlay-only masks may be reversible through alpha, metadata or retained background layers.

## Decision

Critical regions use padded, solid, fully opaque masks rendered into a new flattened bitmap. The safe encoder removes metadata and alpha surprises. Non-critical values may use typed semantic replacement only when the same policy passes final verification. Blur is forbidden for critical classes.

## Alternatives

- Blur/mosaic: visually pleasant but recoverability varies.
- CSS/DOM overlay: does not change captured underlying pixels reliably.
- Crop only: can remove required task context and misses scattered findings.

## Consequences

Critical redaction is simple to test and explain. Over-redaction and remote task degradation can increase.

## Risks

Incorrect boxes still leak or hide controls. Use union findings, line expansion, configurable padding, coverage gates and geometric/pixel verification.
