# DrishtiGuard API and Contract Specification

**Schema family:** `com.drishtiguard.contracts/1.0`  
**Wire authority:** JSON Schema Draft 2020-12  
**Rule:** Local raw capabilities and remote wire objects are separate types. Conversion is one-way through the privacy compiler and final verifier.

## 1. Contract governance

- Every object includes `schema_version` and uses `additionalProperties: false`.
- Network objects have explicit size/count/string limits and closed enums.
- IDs are random opaque identifiers. They do not encode tab, URL, selector, value or person.
- Time is RFC 3339 UTC on the wire; local freshness uses a monotonic clock.
- Coordinates use an explicit coordinate-space identifier and carry snapshot lineage.
- Unknown major versions fail closed. A newer minor version is accepted only if its exact schema is registered; no permissive unknown-field behavior.
- JSON Schema is validated on client egress, server ingress, server egress and client response.
- TypeScript is generated or checked from the same schema in CI; hand-edited drift blocks release.
- Sensitive fields are not "optional" in wire types - they are impossible to represent.

## 2. Trust-aware type split

| Type | Boundary | May contain raw content? | Serializable remotely? |
|---|---|---:|---:|
| `FrameSnapshotLocal` | Privileged extension/local worker | Opaque raw bitmap and DOM handles | No |
| `RawDomElementLocal` | Page probe/local compute | Local text/value handles | No |
| `SensitiveFindingLocal` | PII ensemble/compiler | Non-serializable `SensitiveValueHandle` | No |
| `SensitiveFinding` | Sanitized internal/public | No value or stable value-derived hash | Yes only where included by policy |
| `SanitizedSceneLocal` | Compiler/verifier | Final encoded sanitized asset | No generic serialization |
| `VerifiedEnvelope` | Verifier/gateway | Digest and short-lived capability only | Gateway-internal |
| `RemoteInferenceRequest` | Gateway/server | Sanitized P1 data only | Yes |
| `ActionPlan` | Server/client | Sanitized arguments or token refs only | Yes |
| `ExecutionReceipt` | Local audit | IDs, enums and timings only | Local/default no egress |

`RawBitmapHandle`, `RawDomHandle` and `SensitiveValueHandle` are compile-time branded local capabilities whose constructors live inside trusted modules. Runtime serializers reject their prefixes and any object graph carrying a local-only brand; TypeScript branding alone is not a runtime control.

The canonical `FrameSnapshotLocal` fields are `origin_handle`, `raw_bitmap_handle` and `raw_dom_handle`. JSON Schema marks them `writeOnly` as an annotation; the trusted runtime serializer remains responsible for enforcing non-serialization.

## 3. Common identifiers

- `task_id`: one user-authorized task in one tab.
- `request_id`: one idempotent remote inference request.
- `snapshot_id`: one coordinated DOM/pixel observation.
- `document_frame_id`: top-level document or iframe identity.
- `document_id`: browser document identity where available; otherwise adapter-generated and navigation-scoped.
- `navigation_id`: top-level navigation epoch.
- `mutation_epoch`: monotonic material-change counter.
- `element_id`: task-random opaque UI target, invalid after navigation.
- `token_id`: task-random secret capability; display labels are never token IDs.
- `action_id`: one action response/attempt.

Runtime prefixes are type-specific: `tsk_`, `req_`, `snp_`, `nav_`, `doc_`, `frm_`, `elm_`, `fnd_`, `rgn_`, `tok_`, `act_` and `cor_`. JSON Schema rejects an otherwise well-formed ID used in the wrong identifier field.

The original brief's overloaded `frame_id` is replaced by `snapshot_id` and `document_frame_id`.

## 4. Geometry

`BoundingBox` is `{x, y, width, height}` in root visual-viewport CSS pixels unless another declared `coordinate_space` is used. Values are finite, non-negative and bounded by the declared viewport. Findings retain their source frame ID and normalized root box.

`Viewport` includes CSS width/height, scroll X/Y, screenshot pixel width/height, observed X/Y scale, DPR and browser zoom. The observed scale is derived from the actual captured image dimensions; DPR/zoom are diagnostic evidence.

## 5. FrameSnapshotLocal

Purpose: bind one raw capture and DOM observation to browser state.

| Field | Type | Rule |
|---|---|---|
| `schema_version` | semver | `1.0` family |
| `task_id` | opaque ID | Current local task |
| `tab_id` | browser integer | Local only |
| `snapshot_id` | opaque ID | New for every attempt |
| `navigation_id` | opaque ID | Changes on top-level navigation |
| `document_id` | opaque ID | Adapter source documented |
| `mutation_epoch` | integer | State before/after must match |
| `origin_handle` | local capability | Raw origin never enters remote request by default |
| `captured_at` | timestamp | RFC 3339 UTC; local monotonic freshness is held out of band |
| `viewport` | `Viewport` | Exact capture geometry |
| `raw_bitmap_handle` | local capability | Non-serializable |
| `raw_dom_handle` | local capability | Non-serializable |

## 6. DomElementGraph

Purpose: sanitized semantic graph used for grounding.

Each `DomElement` contains `element_id`, optional parent ID, `document_frame_id`, role enum, `sanitized_label`, bounding box, visible/enabled/editable/checked/selected states, safe input category, source and confidence. It contains no selector, DOM path, raw attribute, value, HTML or URL. The local binding table maps `element_id` to a live target and stays inside the executor.

Limits: maximum 500 elements per scene in the MVP, label length 160, graph serialized size 256 KB. The compiler ranks by viewport visibility and task relevance before truncation; truncation that loses privacy coverage blocks, while truncation of remote grounding context is declared in the manifest.

## 7. VisualElement

| Field | Meaning |
|---|---|
| `element_id` | Opaque element ID when fused to a DOM target; otherwise a non-executable observation ID |
| `role` | Closed semantic role such as button, input, text, icon, image, document, face or unknown |
| `sanitized_label` | Typed placeholder or verified safe label, max 160 characters |
| `bounding_box` | Normalized root viewport box |
| `document_frame_id` | Source document frame |
| `source` | `DOM`, `VISION` or `FUSED` |
| `confidence` | 0..1; advisory, never sole privacy authority |
| `snapshot_id` | Exact observation lineage |
| `executable` | True only when a current DOM binding exists |

## 8. SensitiveFinding

| Field | Meaning |
|---|---|
| `finding_id` | Opaque random ID |
| `privacy_class` | Closed class enum |
| `sources` | One or more of DOM, OCR, VISION, PATTERN, NER, USER, SITE_POLICY |
| `bounding_box` | Optional for text-only task/metadata findings |
| `document_frame_id` | Optional source frame |
| `confidence` | 0..1 |
| `severity` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `redaction_policy` | `TOKENIZE`, `SOLID_MASK`, `GENERALIZE`, `DROP`, `BLOCK` |
| `coverage_status` | `SCANNED`, `MASKED`, `SAFE_BY_POLICY`, `UNKNOWN` |

No original value, reversible mapping, substring, stable hash, prefix/suffix or entropy-bearing derivative is permitted in the serializable type. `SensitiveFindingLocal` refers to a non-serializable local `SensitiveValueHandle` separately.

## 9. RedactionRegion

Contains finding IDs, normalized and pixel boxes, mask mode, padding, replacement display class and compositor version. Schema fixes `normalized_box` to root visual-viewport CSS coordinates and `pixel_box` to encoded-image pixels. `replacement_class` is required only for `TYPED_REPLACEMENT` and forbidden for the other mask modes. Critical classes require `SOLID_OPAQUE`; alpha must equal 255 in the final flattened image. Region geometry is immutable after the final verifier begins; a retry creates a new sanitized artifact and digest.

## 10. SanitizedSceneLocal

Contains snapshot/navigation/mutation lineage, sanitized elements, final encoded sanitized-image handle, privacy manifest, verification state and compiler versions. The image handle refers only to the fresh encoded result, never the original capture.

## 11. PrivacyManifest

Content-free fields:

- policy, schema, compiler, detector, OCR, verifier and encoder versions;
- counts of findings, tokens and masks by privacy class;
- coverage counts and unknown-region count;
- mask pixel-area ratio bucket;
- whether a remote image is required;
- final sanitized payload byte counts;
- verification status and bounded attempt number.

`SAFE_TO_SEND` requires zero unknown coverage. When `image_included` is true, a positive `sanitized_image_bytes` value and matching scene `sanitized_image_part_id` are required; both are forbidden when no image is included. The final serialized-body digest is authoritative only in `VerifiedEnvelope`, avoiding a self-referential digest inside the body being hashed.

It never contains values, labels, OCR text, token IDs/mappings, page URL, selector, raw geometry tied to a value, task text or image bytes.

## 12. VerifiedEnvelope

Gateway-internal capability minted only by the final verifier:

```json
{
  "schema_version": "1.0",
  "task_id": "tsk_7Yf...",
  "request_id": "req_N2p...",
  "snapshot_id": "snp_K8a...",
  "policy_version": "privacy-1.0.0",
  "body_sha256": "64-lowercase-hex",
  "expires_at": "2026-09-04T10:15:30Z",
  "decision": "SAFE_TO_SEND"
}
```

The capability object itself also has an unforgeable local brand. The gateway recomputes the exact multipart body digest and compares identifiers/expiry before opening a socket.

## 13. RemoteInferenceRequest

Remote wire request fields:

- `schema_version`, `request_id`, `task_id`, `snapshot_id`, `navigation_id`, `mutation_epoch`;
- `site_profile_id` or non-identifying `origin_alias`;
- `sanitized_task`;
- `sanitized_scene` containing bounded sanitized elements;
- optional `sanitized_image_part_id` inside the scene, never URL/base64 in arbitrary JSON;
- allowed action types;
- the bounded, content-free privacy manifest inside `sanitized_scene`; and
- request expiry.

The image is a separately named multipart part whose digest is covered by the envelope. Raw hostname/path/query/fragment, tab ID, DOM HTML, selector, capture URL/data URL, token mapping and arbitrary metadata are forbidden.

Example:

```json
{
  "schema_version": "1.0",
  "request_id": "req_c7R4Lk9P",
  "task_id": "tsk_W2n8Qa1M",
  "snapshot_id": "snp_f9D3Tv6K",
  "navigation_id": "nav_G4p2Mx8H",
  "mutation_epoch": 42,
  "site_profile_id": "synthetic-travel-claim-v1",
  "sanitized_task": "Check whether the claim is within policy and propose submission.",
  "sanitized_scene": {
    "schema_version": "1.0",
    "snapshot_id": "snp_f9D3Tv6K",
    "navigation_id": "nav_G4p2Mx8H",
    "mutation_epoch": 42,
    "sanitized_elements": [
      {
        "schema_version": "1.0",
        "element_id": "elm_A8p4",
        "role": "STATUS",
        "sanitized_label": "Within policy limit: yes",
        "bounding_box": {
          "x": 84,
          "y": 410,
          "width": 260,
          "height": 28,
          "coordinate_space": "ROOT_VISUAL_VIEWPORT_CSS"
        },
        "document_frame_id": "frm_Top1",
        "source": "FUSED",
        "confidence": 0.99,
        "snapshot_id": "snp_f9D3Tv6K",
        "executable": false
      },
      {
        "schema_version": "1.0",
        "element_id": "elm_Q7r2",
        "role": "BUTTON",
        "sanitized_label": "Submit claim",
        "bounding_box": {
          "x": 920,
          "y": 690,
          "width": 180,
          "height": 44,
          "coordinate_space": "ROOT_VISUAL_VIEWPORT_CSS"
        },
        "document_frame_id": "frm_Top1",
        "source": "FUSED",
        "confidence": 0.97,
        "snapshot_id": "snp_f9D3Tv6K",
        "executable": true
      }
    ],
    "privacy_manifest": {
      "schema_version": "1.0",
      "policy_version": "privacy-1.0.0",
      "components": [
        { "component": "privacy-compiler", "version": "1.0.0" },
        { "component": "final-verifier", "version": "1.0.0" }
      ],
      "finding_counts": [],
      "mask_counts": [],
      "token_counts": [],
      "coverage_total": 2,
      "coverage_unknown": 0,
      "image_included": false,
      "sanitized_json_bytes": 1850,
      "verification_status": "SAFE_TO_SEND",
      "attempt": 1
    },
    "verification_status": "SAFE_TO_SEND"
  },
  "allowed_actions": ["CLICK", "SCROLL", "FOCUS", "COMPLETE", "ABORT"],
  "policy_version": "action-1.0.0",
  "expires_at": "2026-09-04T10:15:30Z"
}
```

## 14. ActionPlan

The server returns one action only. The discriminated union allows:

- `CLICK { element_id }`
- `FOCUS { element_id }`
- `SCROLL { direction, amount }`
- `TYPE_TEXT { element_id, value: { kind: LITERAL_SAFE | TOKEN_REF, value } }`
- `SELECT_OPTION { element_id, option_element_id }`
- `NAVIGATE_OPAQUE { element_id }` for a bound link only
- `COMPLETE { outcome_code }`
- `ABORT { safe_reason_code }`

`TOKEN_REF.value` must be an existing opaque `token_id`; a display placeholder does not resolve. `LITERAL_SAFE` is rescanned locally before execution. The plan cannot carry JavaScript, selectors, coordinates, file paths, arbitrary URLs, headers or cookies.

Example:

```json
{
  "schema_version":"1.0",
  "request_id":"req_c7R4Lk9P",
  "task_id":"tsk_W2n8Qa1M",
  "action_id":"act_M5v1Zx3B",
  "snapshot_id":"snp_f9D3Tv6K",
  "navigation_id":"nav_G4p2Mx8H",
  "mutation_epoch":42,
  "action":{"type":"CLICK","element_id":"elm_Q7r2"},
  "confidence":0.93
}
```

## 15. ExecutionReceipt

Safe local record fields:

- `schema_version`, `task_id`, `action_id`;
- `snapshot_id_before`, optional `snapshot_id_after`;
- action type but no argument content;
- result enum `SUCCEEDED`, `REJECTED`, `STALE`, `CANCELLED`, `FAILED`;
- confirmation status `NOT_REQUIRED`, `CONFIRMED`, `DECLINED`, `EXPIRED`;
- policy decision and safe error code;
- total `latency_ms`; and
- `recorded_at` timestamp.

It contains no label, value, URL, selector, token ID, model rationale or screenshot.

## 16. ErrorEnvelope

Error families are closed and content-free: `PERMISSION_*`, `CAPTURE_*`, `SNAPSHOT_*`, `COORDINATE_*`, `RUNTIME_*`, `MODEL_*`, `COVERAGE_*`, `PRIVACY_*`, `EGRESS_*`, `REMOTE_*`, `ACTION_*`, `TELEMETRY_*` and `INTERNAL_SAFE`.

`ErrorEnvelope` includes a safe code, component, retryability, correlation ID, schema version and optional bounded numeric details such as attempt or elapsed bucket. It never includes exception message, stack locals, DOM/OCR/task text, URL or server body. Raw exceptions are mapped locally; unmapped exceptions become `INTERNAL_SAFE`.

## 17. Compatibility policy

- Patch changes cannot alter schema.
- Minor versions may add enum values or optional fields only through a new registered schema; older consumers reject unsupported values explicitly.
- Major versions are isolated endpoints/topics and fail closed across mismatch.
- The extension advertises supported request/action schema versions; the server selects one exact intersection.
- Policy/model versions are independent from contract versions and are recorded in every verified request.
- A downgrade requires explicit signed configuration and cannot bypass a privacy gate.

## 18. Contract tests

- Golden valid/invalid examples for every `$defs` type.
- Fuzz unknown keys, oversized arrays/strings/numbers, NaN/infinity, Unicode confusables and prototype-pollution keys.
- Prove raw local brands cannot serialize or reach gateway module types.
- Consumer-driven client/server compatibility tests for every supported exact version.
- Mutation after verification must change digest and be rejected.
- Action plans with JS, selectors, coordinates, arbitrary URLs, raw labels or multiple steps must fail.
- Receipt/error/telemetry canary scans ensure content-free serialization.
