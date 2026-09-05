# DrishtiGuard Implementation Roadmap

**Version:** 1.0  
**Basis:** Six-person team, pre-event preparation and a 36-48 hour SIH implementation sprint. Replan when the actual team, event format and hardware are known.

## 1. Delivery principle

The architecture describes a production target. The hackathon delivers a measured vertical slice, not a production-ready browser agent. Scope is protected in this order:

1. real privacy controls and actual network evidence;
2. stale-safe, confirmed local execution;
3. DOM + vision demonstration and benchmark;
4. compatibility and polish; and
5. broader website coverage only if every earlier gate is complete.

## 2. Team lanes

| Lane | Primary responsibilities |
|---|---|
| Extension/platform | WXT shell, side panel, capture, permissions, browser adapters, task lifecycle |
| DOM/action | Collector, opaque binding table, mutation/navigation state, validator and executor |
| Local ML | Visual detector, OCR, PII recognizers, runtime tiers, performance |
| Privacy/security | Coverage, compiler, token vault, verifier, gateway, threat/fault tests |
| Backend/VLM | FastAPI modular monolith, schema, prompt channels, constrained one-action output |
| Demo/QA | Synthetic portal/generator, benchmark harness, metrics, UX, integration and presentation |

At least two people review privacy/gateway changes. No lane may add an independent page-data network call.

## 3. Pre-event foundation

Complete before the timed sprint:

- Freeze Chrome/Firefox versions, demo laptop, display scaling and server GPU.
- Create WXT monorepo, exact locks, lint rule restricting network APIs and CI.
- Implement versioned JSON Schema and generated/checked TypeScript types.
- Build the synthetic travel-claim portal and deterministic invalid PII generator.
- Spike `captureVisibleTab`, coordinate mapping and mutation/navigation identity at multiple zoom/DPR settings.
- Spike PaddleOCR.js or alternative ONNX OCR in MV3 Chrome and Firefox workers; record size, operator support and latency.
- Select/freeze small local detector/NER assets and signed hashes.
- Prepare a Qwen3-VL-4B-Instruct or alternative server endpoint with strict one-action schema.
- Write canary interception, leak scan, action race and prompt-injection harnesses.
- Pre-record a degraded-mode backup video only as presentation insurance, never as substitute for live evidence.

If the browser OCR/model spike fails, narrow the MVP to a smaller validated OCR/model combination rather than improvising an unmeasured runtime during the finale.

## 4. Hackathon MVP

### 4.1 Must have

- Explicit extension-owned activation and consent/preview.
- Chromium visible-viewport capture with exact two/s throttle.
- DOM/ARIA-derived graph, opaque IDs and live local binding table.
- Read-capture-read state consistency and stale job cancellation.
- Actual-dimension coordinate normalization.
- Local vision + ROI OCR on one hard canvas/image region.
- Deterministic Indian PII rules, face/document masking and coverage map.
- Cross-modal task/graph/image sanitizer.
- Task-random typed token capability vault.
- Solid opaque masks in a newly encoded bitmap.
- Final-byte verifier and bounded remask/block path.
- Gateway digest binding and intercepted network/server-ingress canary proof.
- FastAPI modular monolith with validated sanitized request and one-action result.
- DOM-backed submit target, effect-based risk and extension-owned confirmation.
- Revalidation after confirmation, execution receipt and page-state diff.
- Seeded residual leak, stale plan and prompt-injection negative demonstrations.
- Measured DOM-only/vision-only/fused confusion counts, p50/p95 latency, memory and size.

### 4.2 Should have

- Scene-graph-only versus graph+image payload switch.
- WASM fallback on the same Chromium build.
- Firefox capture/collector/runtime smoke test with safe unsupported behavior.
- OCR cache and changed-region optimization with full-frame diff guard.
- Safe local metrics dashboard and generated benchmark manifest.
- Model/policy/schema version view in the demo UI.

### 4.3 Could have

- Open shadow-root case and accessible same-origin iframe.
- One additional workflow step before submit.
- Alternative remote model adapter.
- Local derived-value function for claim-limit logic.
- Automated extension package/signature demo.

### 4.4 Will not have

- Universal websites, arbitrary cross-origin/canvas execution, closed shadow DOM or protected PDF automation.
- Password/OTP/login, uploads, payments, deletion, permission changes or arbitrary navigation.
- Production auth, enterprise policy, content diagnostics or fleet deployment.
- Full Firefox performance parity.
- Kubernetes, microservice decomposition, database or screenshot object storage.

## 5. Suggested 48-hour run plan

| Window | Integration objective | Exit evidence |
|---|---|---|
| H0-H4 | Reconfirm versions/hardware, build all packages, run golden contracts | Green build and frozen manifest |
| H4-H10 | Capture + DOM graph + coordinate/state IDs integrated | Zoom/DPR/stale capture tests pass |
| H6-H14 | Local detector/OCR/PII/coverage integrated | Overlay on all synthetic classes |
| H10-H18 | Compiler, token vault, fresh bitmap and verifier | Seeded leak remasks/blocks |
| H14-H22 | Gateway and server strict request/action loop | Intercepted body and digest match |
| H18-H28 | Validator, confirmation, DOM execution and postcondition | Safe submit; stale/malicious plan rejected |
| H24-H34 | Benchmark harness, ablations, resource traces | Named-hardware scorecard |
| H30-H40 | Firefox smoke, failure paths and UX polish | Capability matrix; safe blocking |
| H38-H46 | Rehearsal, defect fixes, clean install and offline backup | Two complete timed demo runs |
| H46-H48 | Freeze artifacts and claims | Reproducible release bundle |

Parallel windows are intentional. Stop feature work at H40.

## 6. MVP acceptance gates

The prototype is SIH-demo ready only when:

- the actual client request and server ingress contain zero seeded raw canaries in the declared suite;
- a pass-one miss is caught by pass two and blocks/remasks;
- DOM-only, vision-only and fused results are measured on a frozen holdout;
- every high-risk submit requires a current confirmation;
- stale, replayed and prompt-injected forbidden plans execute zero actions;
- failure of WebGPU/OCR/remote service cannot trigger a weaker privacy path;
- the scorecard names browser, hardware, models, N, seed and cold/warm status; and
- the team calls results targets or measured results accurately.

If these fail, show a smaller honest slice rather than a broader simulation.

## 7. Post-selection engineering - approximately 4-8 weeks

- Expand frozen synthetic corpus and build license-governed external benchmark adapters.
- Calibrate per-class thresholds and multilingual Indian names/addresses/documents.
- Complete Firefox end-to-end behavior and formal browser capability tests.
- Harden capture consistency, dynamic canvas/video policy and changed-region correctness.
- Generate TypeScript/contracts automatically and add schema fuzzing.
- Implement OIDC/PKCE, short-lived tokens, endpoint policy and rate limiting.
- Add signed model manifest/cache lifecycle and browser-store policy decision.
- Automate log/storage/network canary inspection and fault injection.
- Add content-free telemetry with opt-in and short retention.
- Establish release provenance, SBOM, dependency scanning and safe rollback.

Exit: repeatable internal alpha on declared synthetic and approved public datasets with no open critical security defects.

## 8. Pilot readiness - approximately 8-12 additional weeks

- Select a small allowlist of real portals/workflows and build reviewed site adapters.
- Obtain sponsor decisions for PII classes, action policy, residency, retention and authentication.
- Complete DPIA/privacy review and DPDP/legal analysis.
- Conduct independent extension security review and prompt-injection red team.
- Add managed enterprise deployment policy, origin allowlist and kill switch.
- Establish SLOs, on-call, incident response, vulnerability handling and key/model rotation.
- Load/capacity test GPU service and verify body logging disabled at every hop.
- Run accessibility and user comprehension studies for preview/confirmation.
- Maintain statistically adequate per-class/surface/browser benchmark history.

Exit: sponsor-approved limited pilot, signed releases, measured residual-risk acceptance and rollback exercise.

## 9. Production readiness - evidence gated, likely 3-6+ months total

- Independent privacy and security audit closed.
- Large site-disjoint, multilingual and adversarial benchmark meets frozen gates.
- Chrome and Firefox matrices pass sustained regression; unsupported surfaces fail safely.
- Model/policy/schema governance has approval, provenance, canary and rollback.
- Operational security, IAM, secrets, retention, incident and disaster-recovery controls are tested.
- GPU cost, queueing, regional availability and capacity meet SLOs.
- Store/enterprise distribution and model-update policies are approved.
- User notices, consent, deletion and support processes are deployed.
- Residual detection/inference risk is formally accepted for each supported workflow.

Production readiness is a governance and evidence state, not a branch name or successful demo.

## 10. Delivery artifacts by phase

| Artifact | MVP | Post-selection | Pilot | Production |
|---|---:|---:|---:|---:|
| Architecture, threat/privacy model, ADRs | Baseline | Revised | Approved | Controlled |
| JSON Schema + TypeScript contracts | Hand/CI checked | Generated | Compatibility matrix | Lifecycle governance |
| Synthetic portal and generator | Core suite | Expanded | Portal-specific cases | Continuous regression |
| Chromium extension | End-to-end | Hardened | Signed managed build | Store/enterprise rollout |
| Firefox | Smoke/capability | End-to-end | Signed build | Sustained parity claims only if measured |
| Local model pack | Frozen demo | Signed cache lifecycle | Calibrated | Governed updates/rollback |
| Remote service | Single GPU modular monolith | Auth/rate limit | Load-tested regional service | Autoscaled SLO service |
| Security evidence | Canaries/races/injection | Automated fault suite | External review/red team | Independent audit/continuous testing |
| Metrics | Named-laptop scorecard | Broader matrix | SLO and risk report | Release dashboard |

## 11. Go/no-go risks

| Risk | Trigger | Decision |
|---|---|---|
| Browser OCR/model incompatible or too large | Spike misses size/operator/latency budget | Choose smaller certified engine or narrow visual surface |
| Critical PII recall weak | Any class below floor | Add policy/site recognizer or block that surface; no release |
| Verifier cannot distinguish safe payload | Residual/coverage ambiguity | Scene-graph-only mode or local/manual action |
| Remote VLM cannot ground opaque IDs reliably | Low action accuracy | Improve graph/labels or use deterministic workflow adapter |
| Firefox unsafe/unstable | Smoke failures | Claim Chromium only for demo; keep Firefox planned, not falsely complete |
| End-to-end p95 exceeds 4 s | Warm measured result misses | Show measured result, optimize after privacy gates; do not skip verification |
| 50 MB package missed | Compressed artifact too large | Report categories and use reviewed model-pack strategy if allowed |
| Team capacity smaller than assumed | Missing lane ownership | Drop breadth and retain proof-focused must-haves |

## 12. Credible presentation claims

Allowed after evidence:

- "Raw capture buffers and the reversible token vault have no gateway representation."
- "Zero seeded critical canaries escaped in 0/N frozen test artifacts."
- "The second pass caught this seeded miss in the exact encoded request."
- "The local validator rejected stale and injected actions in N/N tests."
- "Measured p95 was X on named hardware and browser."

Not allowed:

- "100% private" or "no PII can ever leak."
- "First typed-placeholder GUI privacy system."
- "Production-ready" after a hackathon.
- "Works on every website" or "full Chrome/Firefox parity" without evidence.
- Presenting target numbers as measured results.
