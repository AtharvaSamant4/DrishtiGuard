# DrishtiGuard Privacy Model

**Version:** 1.0  
**Date:** 4 September 2026  
**Default posture:** Data minimization, transient local processing, exact-payload verification and fail-closed egress

## 1. Privacy promise and limitation

DrishtiGuard is designed so that original captured-image buffers and reversible token mappings have no representable path through the outbound gateway. Values that the local system discovers or classifies as sensitive are removed or replaced across every outbound modality.

The system does not claim universal detection of all sensitive meaning. Names without context, confidential project codes, steganography, unique combinations of public facts and adversarial visuals can evade probabilistic classifiers. That residual risk is reduced by coverage analysis, conservative policy, final-byte verification and restricted pilot scopes, then measured and disclosed.

## 2. Privacy principles

- **Local first:** Raw pixels, raw DOM/task text, OCR output and token mappings are processed only inside the user-device boundary.
- **Minimize before sanitize:** Prefer a sanitized scene graph or locally derived predicate over sending an image or exact value.
- **All modalities:** Image masks alone are insufficient; task, labels, attributes, URL components and action arguments follow the same policy.
- **Purpose binding:** A token is usable only for a declared task, origin, target field, purpose and short lifetime.
- **Exact artifact:** The verifier examines the final encoded image and serialized request and authorizes their digest, not an abstract intermediate.
- **Fail closed:** Incomplete coverage, residual critical PII, invalid metadata or policy uncertainty blocks egress.
- **No hidden retention:** Content retention is zero by default at the remote service and telemetry layer.
- **User agency:** Capture starts after an explicit gesture; consequential effects require a fresh, understandable confirmation.

## 3. Data classification

| Class | Examples | Default handling |
|---|---|---|
| P0 - Public/declared safe | Generic role names, non-identifying UI type, policy-approved static labels | May enter sanitized scene if needed |
| P1 - Sensitive-derived | Typed placeholders, origin alias, counts, coarse layout, derived predicate | Remote permitted only after verification; still confidential and no-retention |
| P2 - Personal/confidential | Name, email, phone, face, address, employee ID, medical/financial fact, exact URL path | Local only; replace, generalize or mask |
| P3 - Critical secret | Password, OTP, session/auth token, card/CVV, private key, recovery code | Never intentionally read for agent reasoning; mask region and block any requested disclosure |
| O0 - Operational metadata | Component latency, model version, safe error enum, finding counts | Telemetry permitted through a separate fixed schema |

Input is classified P2 until a local policy proves it safe or transforms it into P1. "Sanitized" does not mean public.

## 4. Data inventory and lifecycle

| Data | Location | Lifetime | Egress | Logging |
|---|---|---:|---|---|
| Raw screenshot buffer | Privileged capture -> local compute | One snapshot; overwritten/dereferenced immediately after compile | Never | Never |
| Raw DOM/ARIA/task text | Page probe/local compute | One snapshot/task sanitization | Never | Never |
| Raw OCR output/crops | Local OCR worker | One processing attempt; stable safe cache only after classification | Never | Never |
| `ValueHandle` / token map | In-memory vault in active compute host | 10 min idle, 30 min hard max, or earlier invalidation | Never | Never |
| Sensitive finding geometry/class | Local pipeline | Current snapshot; public variant may enter manifest without value | Class/count only | Counts only |
| Sanitized scene graph | Local compute, transient remote request | Until response or timeout | Allowed after verification | No content |
| Sanitized image | Local compute and transient server memory | Until response or 60 s hard server timeout | Allowed only when needed and verified | Never retained |
| Verified envelope/digest | Extension memory | Request lifetime | Digest/IDs allowed | Safe fields only |
| Action plan | Server response/local validator | Current snapshot only | Returns to client | No content logging |
| Execution receipt | Local extension | Session by default; optional 24 h safe history | Never by default | Safe enums/latencies only |
| Telemetry event | Separate exporter/sink | Suggested 7 days for pilot, subject to approval | O0 fields only | It is the log record |

The exact TTLs are recommended defaults, not sponsor-approved policy. Closing the tab, canceling the task, losing the compute host, extension update/reload, unexpected navigation or expiry destroys handles and cancels dependent work.

## 5. Collection and consent

The extension does not run continuous background capture. The user invokes the extension through its action, shortcut or extension-owned UI, granting temporary active-tab authority. Before first remote use on an origin, the UI explains:

- what visible content is captured locally;
- what categories are masked or tokenized;
- whether a sanitized image is required or a scene graph is sufficient;
- which remote service receives transient sanitized content;
- that automated recognition has residual error; and
- which effects require confirmation.

Consent is bound to task and origin scope. Cross-origin navigation, permission expiry or material task change requires a new decision. A preview mode shows the sanitized artifact before sending and is mandatory for the MVP demo.

High-risk action confirmation is separate from processing consent. It is displayed in the extension surface, references a sanitized effect and origin alias, expires in 30 seconds, and binds to the exact action digest.

## 6. Detection and redaction policy

### 6.1 Critical classes

Credentials, OTPs, authentication/session tokens, private keys, recovery codes, Aadhaar, PAN, bank account details, payment cards/CVV and policy-declared high-impact organizational secrets are critical. Critical uncertainty results in expanded solid masking or blocking. Blur and weak pixelation are never accepted.

### 6.2 Other sensitive classes

Names, faces, email, phone, employee ID, address, medical facts, financial amounts, invoice identifiers and documents are replaced by typed tokens, generalized into a safe derived fact, or masked according to task purpose. Exact values are not sent merely because they are useful; the local system computes predicates such as `within_policy_limit=true` when possible.

### 6.3 Detection sources

The canonical privacy set is the union of DOM/form metadata, local OCR, patterns/validation, NER, face/document/QR/barcode detection, nearby labels, user declaration and site/enterprise policy. A coverage map proves that every visible region was scanned, masked, explicitly safe by policy or marked unknown. Unknown image/canvas/frame regions do not pass by default.

### 6.4 Geometric policy

Text regions expand to line height and receive class-specific padding. Overlapping regions merge. For disagreement, use the larger union. Masks are drawn into a new opaque bitmap and then encoded with a fixed profile. The original image is not retained as a background with reversible overlays.

## 7. Typed token vault

A token has two representations:

- a human-readable display label such as `[PAN_1]`; and
- a random task capability such as `tkn_7Y9...` with at least 128 bits of entropy.

Only the random ID can be resolved. The vault entry binds:

- privacy class and raw value buffer/handle;
- task ID and user-authorized purpose;
- allowed origin alias and target element/field;
- creation navigation epoch;
- expiry and remaining use count; and
- provenance of the local finding.

A model-created token string, copied display label, cross-task ID or expired ID never resolves. Resolution happens only after policy, confirmation and post-confirmation freshness checks, immediately before a permitted local field operation.

The vault is memory-only in the active compute host. It is not put in `chrome.storage`, IndexedDB, local storage, service-worker event state, logs, traces or crash reports. If multi-page operation is approved, page-derived mappings are destroyed on navigation. A user-task token may be reissued with a new ID only after explicit purpose/origin reauthorization.

JavaScript cannot guarantee physical erasure of immutable strings. The implementation minimizes copies, uses mutable byte buffers where practical, overwrites them before release and treats local memory inspection as a residual risk.

## 8. Cross-modal sanitization

The compiler processes:

- screenshot pixels and image metadata;
- scene-graph labels and values;
- accessible names, `alt`, `title`, `placeholder`, `autocomplete` and selected attributes;
- URL path, query and fragment; raw origin is replaced with a local alias unless necessary;
- user task and local conversation context;
- local derived facts and action arguments; and
- error/debug fields.

Remote-bound schemas cannot express raw HTML, selectors, tab IDs, raw handles, token maps or arbitrary URLs. Any unknown field fails schema validation.

## 9. Verification and egress

The final verifier decodes and inspects the exact image bytes and parses the exact serialized JSON/multipart structure. Checks include known-value/canary search, critical patterns, secondary OCR, mask coverage, alpha/metadata, dimensions, forbidden keys, coverage completeness and payload size.

Possible outcomes are:

- `SAFE_TO_SEND`
- `REQUIRES_ADDITIONAL_MASKING`
- `BLOCKED_LOW_COVERAGE`
- `BLOCKED_RESIDUAL_PII`
- `BLOCKED_POLICY`

Only `SAFE_TO_SEND` produces a short-lived envelope containing the exact body digest. A recoverable residual triggers at most two redaction retries. The gateway recomputes the digest immediately before sending and rejects mismatches, expiry, stale snapshot, wrong destination or missing consent.

The preferred disclosure order is:

1. locally answer the task without remote processing;
2. send a sanitized semantic graph and derived facts only;
3. attach a downscaled verified sanitized image only if visual context is necessary; or
4. block / request user-assisted action.

## 10. Remote processing and retention

The recommended remote service is self-hosted in an approved India region or on-prem environment, pending sponsor direction. It receives transient P1 data over TLS. Reverse proxy, API framework, APM, exception reporting, model server and infrastructure logs all disable body capture.

Request/image/prompt/response content is held only in volatile memory for the request, with a 60-second hard processing timeout and immediate release after response. No object storage, prompt history, training reuse, cache, support replay or human review is enabled by default. Any future diagnostic upload requires a separate explicit workflow, minimization, purpose, retention and deletion control.

## 11. Telemetry and local debugging

Telemetry uses an independent O0 schema. Allowed examples are component latency, model/policy version, capability flags, finding counts by class, mask area bucket, payload byte count, decision enum, resource buckets and generic error code.

Screenshots, snippets, OCR/DOM/task text, URLs, token IDs/mappings, prompts, responses and stack locals are forbidden. Telemetry scrubbing failure drops the event. Local debug mode is explicit, visually indicated, expires automatically and still never writes raw values by default.

Synthetic canaries are scanned in browser storage, console, crash output, proxy/service logs and telemetry sink during every privacy regression run.

## 12. Deletion behavior

- **Task complete/cancel/expiry:** overwrite mutable buffers where possible; remove references, workers and vault entries.
- **Navigation:** invalidate snapshot/targets and destroy page-derived token entries; unexpected/cross-origin navigation cancels the task.
- **Tab close or compute-host loss:** cancel task and make every capability unusable.
- **Extension removal:** clear model cache, safe preferences and local receipt history.
- **Server:** release request memory after completion/timeout; no content record exists to delete under the default design.
- **Telemetry:** delete after approved retention, suggested seven days for pilot; expose a local opt-out/reset control.

## 13. Privacy invariants

1. Raw screenshot buffers are never accepted by a network-bound contract.
2. Reversible token mappings never leave the active local compute boundary.
3. Sensitive discoveries are transformed across all outbound modalities.
4. The exact outgoing bytes must have a current `SAFE_TO_SEND` digest.
5. Critical data uses solid, opaque, flattened masking, never blur.
6. Unknown/low-coverage regions are masked or block the image path.
7. User tasks are classified and sanitized before remote planning.
8. Token resolution is random-ID, task, origin, field, purpose, TTL and use-count bound.
9. Navigation invalidates snapshots, element IDs and page-derived mappings.
10. Telemetry never contains page content or raw/sanitized personal values.
11. Availability failure never selects a weaker privacy pipeline.
12. Test/demo data is synthetic and invalid against real registries.

## 14. Legal and policy posture

The architecture minimizes personal data and emphasizes notice, purpose, security, deletion and processor controls, but it is not a legal compliance determination. India's Digital Personal Data Protection Act and notified 2025 Rules have phased commencement; counsel and the sponsor must determine applicability, notices, lawful purpose, processor terms, security safeguards, incident duties, retention and cross-border constraints for the intended deployment [R21].

UIDAI, financial-sector and organizational rules may impose stricter handling. DrishtiGuard fully masks Aadhaar-class values for remote egress even though UIDAI defines a masked-Aadhaar presentation that reveals the last four digits [R18].

## 15. Privacy acceptance evidence

- Actual intercepted request and server-ingress bytes contain zero seeded raw canaries for the declared suite.
- Critical PII recall and residual leakage are reported per class and surface with sample size and confidence interval.
- A seeded residual survives pass one, is detected by final verification and results in remasking or blocking.
- No raw content appears in storage, logs, console, crash output or telemetry.
- The user can inspect the sanitized preview and decline transmission.
- The server deployment audit proves body logging and content retention are disabled at every hop.

"Zero observed leakage" must be reported as `0 of N` declared cases. With zero failures, the approximate 95% upper bound is `3/N`; it is not proof of universal zero risk.
