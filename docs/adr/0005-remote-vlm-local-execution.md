# ADR-0005: Use remote planning with local policy and execution

**Status:** Accepted  
**Context:** A server VLM offers stronger reasoning than a lightweight browser model, but remote output is untrusted and webpage prompt injection can manipulate it.

## Decision

Send only a verified minimized request. The remote service returns exactly one closed-schema action over an opaque element ID. It has no browser, URL-fetch, filesystem or shell tool. Local code validates task/snapshot state, live target and effect policy, obtains confirmation when needed, revalidates, then executes a DOM-backed action.

## Alternatives

- Remote direct execution: violates local control and expands blast radius.
- Fully local agent: strongest confidentiality but outside MVP resource constraints.
- Multi-action plans: efficient but stale and hard to review.

## Consequences

Reasoning and authority are separated; server compromise cannot directly operate the browser. Each step incurs network latency and page re-observation.

## Risks

Sanitized context can still reveal relationships; malicious plans can exploit semantic ambiguity. Minimize payload, apply effect-based policy and default ambiguous targets to manual mode.
