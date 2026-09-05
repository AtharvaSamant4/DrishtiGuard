# ADR-0003: Use typed, task-random token capabilities

**Status:** Accepted  
**Context:** Solid masks protect pixels but can remove task structure. Typed placeholders retain categories. Recent work already uses deterministic typed placeholders, so this is not claimed as novel [R11]. Guessable labels or stable hashes permit linkability and injection.

## Decision

Use human-facing labels such as `[EMAIL_1]` only for display. The resolvable `token_id` is random per task and bound to privacy class, purpose, origin, field, navigation scope, TTL and use count. The mapping stays in the in-memory vault. The executor resolves only an existing allowed token after policy/freshness/confirmation checks.

## Alternatives

- Black boxes only: strongest visual hiding but lower utility.
- Deterministic hash tokens: stable but linkable/dictionary-attackable.
- Encrypted values sent remotely: expands key management and reveals ciphertext/linkability.

## Consequences

The remote planner can reason about type and repeated reference without receiving the value. Local lifecycle and navigation handling become more complex.

## Risks

Token theft enables local re-identification; display-token injection could confuse the model. Mitigate with random capabilities, no serializer, strict resolution rules and task cancellation on vault loss.
