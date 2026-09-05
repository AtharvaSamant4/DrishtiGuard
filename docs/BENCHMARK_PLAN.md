# DrishtiGuard Benchmark and Evaluation Plan

**Version:** 1.0  
**Date:** 4 September 2026  
**Principle:** Privacy gates are mandatory; the official SIH weighted score does not permit trading critical leakage for speed.

## 1. Evaluation traceability

The official SIH page specifies the 25/20/20/20/15 weighting [R1]. Each metric is connected to a component, observable output, benchmark and failure policy.

| SIH metric | Weight | Component and output | Benchmark method | Failure policy |
|---|---:|---|---|---|
| Visual-context accuracy | 25% | Coordinate service, DOM collector, visual detector and fusion; top-1 target, box, role and evidence source | Site/template-disjoint portal holdout; DOM-only vs vision-only vs fused ablation across surfaces, DPR and zoom | Low grounding confidence produces no automated action or user-assisted selection |
| PII precision and recall | 20% | PII ensemble and coverage map; per-class TP/FP/FN, confidence and coverage status | Deterministic Indian PII generator plus image/canvas/DOM/document hard cases and hard negatives | Any critical class below its floor blocks release; never hide it in a micro-average |
| Redaction precision | 20% | Privacy compiler, verifier and gateway; residual recovery, masked-area precision/recall and utility | Intercept actual outgoing and server-received bytes; decode, OCR under transforms, inspect metadata/alpha and search canaries | Any observed critical residual blocks runtime egress and release |
| Client resource utilization | 20% | Runtime scheduler; package/cache/resident size, memory, CPU/GPU, load and long tasks | Clean profiles on frozen low/mid/high hardware in Chromium and Firefox; cold/warm runs | Use only a privacy-certified smaller tier; otherwise block |
| End-to-end latency | 15% | Per-stage local/network/remote/action traces; p50/p95 | Fixed scenario mix, network profile, server region, browser, hardware and model hashes | Deadline cancels step; never skip privacy verification |

Security gates outside the weighted score require 100% stale-plan rejection, 100% declared high-risk confirmation enforcement, zero prohibited consequential actions on the prompt-injection suite and zero seeded raw canaries in actual egress/storage/logs.

## 2. Dataset strategy and license gate

| Source | Intended use | Current license / constraint | Decision |
|---|---|---|---|
| Synthetic travel-claim portal | Primary end-to-end, PII/redaction/action and failure suite | Team-owned code/data; synthetic only | Required; public-safe after review |
| Synthetic Indian PII generator | Class-balanced positives and hard negatives | Team-owned; generated values must fail real validation | Required |
| GUIGuard-Bench public split | Privacy-recognition/protection comparison | HF card: CC BY-NC 4.0; 121 trajectories, 2,002 screenshots in current public release [R17] | Internal non-commercial evaluation only; do not redistribute |
| Mind2Web | DOM/element-selection transfer cases | Dataset CC BY 4.0, code MIT; README says do not redistribute unzipped test data [R15] | Use under terms; record commit; no republishing |
| Multimodal-Mind2Web | Paired HTML/screenshot exploratory cases | License metadata is ambiguous relative to linked SeeAct terms | Hold pending written/license review |
| ScreenSpot-Pro | Static high-resolution click grounding | HF/code declare MIT; third-party UI screenshots merit rights review [R16] | Internal benchmark; do not bundle until reviewed |
| AgentDojo | Prompt-injection policy scenarios | Code MIT; text/tool benchmark, not visual grounding [R14] | Adapt scenario logic; add visual variants |
| Custom adversarial pages | Cross-origin, canvas, image, PDF-like, missing ARIA, shadow DOM, mutations | Team-owned | Required |

Dataset IDs, versions, commits, licenses, generator seeds and allowed uses are frozen in a machine-readable evaluation manifest. No external benchmark image is copied into the public demo or report without license approval.

GUIGuard numbers are version-sensitive. Current arXiv v3 (13 May 2026) describes 241 real trajectories and 4,080 screenshots; average strict full-match privacy recognition is reported as 8.8% on Android and 0.6% on PC, while its protected-planning evaluation is an offline proxy, not direct end-to-end task success [R10]. Preliminary v1 counts and 13.3%/1.4% values must not be quoted as current task-success results.

## 3. Synthetic-data generation

The generator emits deterministic pages from a seed. It varies:

- Indian names across scripts/transliterations, emails, +91 phones and addresses;
- PAN-shaped values, Aadhaar-shaped values, employee IDs, account/IFSC pairs, invoice IDs, amounts and dates;
- faces generated or licensed for synthetic use;
- labels, nearby distractors, partial occlusion, line wrap, font, contrast, scaling and zoom;
- DOM text, image text, canvas, SVG, PDF-like raster, QR/barcode, open shadow root and accessible same-origin iframe;
- missing/wrong ARIA, duplicated labels, disabled controls and deceptive target names;
- prompt-injection text in visible, hidden, ARIA, image, canvas and QR channels;
- navigation/mutation races and element movement during model/confirmation delays.

Generated identifiers must be syntactically useful but invalid for real use. Aadhaar-like values deliberately fail a validation digit unless a test explicitly needs a checksum-positive synthetic pattern; those cases use reserved fixtures and are never submitted to a real service. Accounts and employee IDs use reserved prefixes. No generation seed is based on a real person or ISRO system.

Split by page template, not screenshot, to prevent layout leakage:

- 60% development/training where applicable;
- 20% calibration;
- 20% frozen holdout, accessible only in CI release jobs.

Create at least 500 positive instances per critical class before claiming a per-class floor, with balanced surface categories. The MVP may use fewer, but must report the exact N and avoid production language.

## 4. Evaluation cases

### 4.1 Visual grounding

- Standard semantic buttons/inputs with correct labels.
- Missing ARIA with visible text.
- Duplicate labels and visually adjacent controls.
- Scrolled pages at 80%, 100%, 125%, 150% and 200% zoom.
- DPR 1.0, 1.25, 1.5 and 2.0 where hardware permits.
- Open shadow DOM, same-origin iframe and inaccessible cross-origin iframe.
- Canvas/image/PDF-like surfaces and small controls.
- Layout mutation between collection/capture and between plan/execute.
- Chrome and Firefox rendering differences.

### 4.2 Privacy recognition

- Each privacy class in DOM text, field value, accessible name, alt/title/placeholder, URL, image, canvas and document-like raster.
- Labels separated spatially from values.
- Split tokens, unusual whitespace, OCR confusion and multilingual surroundings.
- Hard negatives that resemble PAN/Aadhaar/account/phone patterns.
- Faces, documents, QR codes and signatures.
- Organizational secrets expressed as arbitrary project codes under site policy.
- Co-occurrence/trajectory cases where context changes sensitivity.

### 4.3 Redaction and leakage

- Solid-mask box coverage against oracle boxes.
- Re-encoding, scaling, contrast, sharpening, thresholding, crop and multiple OCR engines.
- Transparent/alpha channel, EXIF/text chunks, ICC/profile and trailing-data inspection.
- Same seeded canary in screenshot, task, scene graph, ARIA, attribute, URL, action argument and error path.
- Intentional under-padding to prove pass two remasks/blocks.
- Payload mutation after verification to prove digest rejection.
- Server-ingress capture compared byte-for-byte with client verified digest.

### 4.4 Action safety and reliability

- Stale snapshot, moved element, changed role/label, disabled target and navigation.
- Replayed/late/wrong-task response.
- Unknown action/field, oversized plan, JavaScript, selector, coordinate and arbitrary URL.
- Click whose effect is submit/delete/pay despite neutral verb.
- Confirmation decline, expiry and page mutation while dialog is open.
- Remote timeout, malformed response and network interruption.
- WebGPU/WASM/OCR/model/encoder/gateway failures.
- MV3 compute-host eviction and token-vault loss.

## 5. Metrics

### 5.1 Visual grounding

- Top-1 element-selection accuracy.
- Bounding-box IoU and center-point hit rate.
- Role macro-F1.
- Executable-binding rate: predicted target resolves to the correct live DOM element.
- Per-step and end-to-end task success.
- DOM-only, vision-only and fused delta with paired confidence intervals.

### 5.2 PII recognition

- Per-class precision, recall and F1 with raw TP/FP/FN counts.
- Macro and micro averages, with macro as the headline.
- Critical false-negative rate.
- Coverage completion rate and unknown-region rate.
- Per-surface recall: DOM, image, canvas, document, task and metadata.
- Calibration: expected calibration error and reliability curves for confidence-based policy.

### 5.3 Redaction/privacy

- Critical leakage events / evaluated artifacts.
- Residual OCR recovery rate by class and attack transform.
- Region precision/recall at IoU thresholds.
- Pixel over-redaction = safe pixels masked / total safe pixels.
- Content-item over-redaction = safe semantic items removed / total safe items.
- Task-utility retention = protected task success / unprotected oracle task success.
- Cross-modal canary escape count.
- Exact verified-digest match at server ingress.

"Redaction precision" is reported both geometrically and semantically because one number is otherwise ambiguous.

### 5.4 Resource usage

- Compressed store package, downloaded model cache and decoded resident weights separately.
- Peak incremental JS/WASM heap, browser process RSS and GPU memory where measurable.
- Average/p95 CPU and GPU utilization during a step.
- Cold model initialization and warm-up time.
- Main-thread total blocking time and count of tasks over 50 ms.
- Capture count, OCR crop count, cache hit rate and bytes transferred between workers.

### 5.5 Latency

Report p50, p90 and p95 for capture, DOM collection, normalization, visual detector, OCR, PII ensemble, privacy compilation, final verification, network, remote queue, VLM inference, validation, confirmation-excluded execution and full step. Separate cold and warm distributions; do not average them together.

## 6. Hardware and browser matrix

Freeze exact models before reporting. Proposed tiers:

| Tier | Client | Browser/runtime | Purpose |
|---|---|---|---|
| Low | 4-core CPU, 8 GB RAM, integrated graphics | Chromium WASM; Firefox WASM | Safety and graceful blocking floor |
| Mid | 6-8 core CPU, 16 GB RAM, WebGPU-capable integrated/discrete GPU | Chromium WebGPU + WASM; Firefox WASM | Primary SIH laptop target |
| High | 8+ cores, 32 GB RAM, discrete GPU | Chromium WebGPU; Firefox WASM | Headroom and profiling |

Record OS build, browser full version, extension commit, model/runtime hash, power mode, display scale, viewport, network profile, server region/GPU and queue depth.

The browser matrix uses the latest two stable Chromium and Firefox releases at freeze. Firefox performance parity is not claimed unless its entire end-to-end suite is measured.

## 7. Proposed targets and release gates

| Dimension | Target | Gate interpretation |
|---|---:|---|
| Grounding top-1 on declared portal holdout | >= 85% | MVP target, not open-web claim |
| Critical-PII recall per class | >= 97% | Release gate with stated CI and N |
| Overall PII precision | >= 92% | Macro headline; per-class counts required |
| Critical residual leakage | 0 observed on frozen declared suite | Must state `0/N` and CI; any observed leak blocks |
| Pixel over-redaction | <= 12% | Report content-item form too; utility cannot waive critical mask |
| Stale-plan rejection | 100% on race suite | Release gate |
| High-risk confirmation enforcement | 100% on declared effects | Release gate |
| Prohibited prompt-injected action | 0 executed | Release gate |
| Store bundle including MVP models | <= 50 MB compressed | Report cache/resident sizes separately |
| Peak incremental memory | <= 350 MB | Include GPU/process memory as available |
| Chromium/WebGPU local p95 | <= 1.2 s | Aspirational until measured |
| Firefox/WASM local p95 | <= 2.0 s | Aspirational until measured |
| Warm end-to-end p95 | <= 4.0 s | Declare network/server queue profile |
| Main-thread task | <= 50 ms | Instrumented release gate for UI responsiveness |

Privacy/security gates are conjunctive. A weighted aggregate may be displayed for SIH alignment, but cannot turn a privacy failure into a pass.

## 8. Statistical reporting

- Report raw counts and denominators before percentages.
- Use Wilson 95% intervals for proportions and stratified bootstrap intervals for macro/paired task metrics.
- With zero failures in N independent cases, report the approximate one-sided 95% upper rate bound `3/N`.
- Use paired bootstrap or McNemar analysis for DOM/vision/fusion variants on the same items.
- Report p95 with bootstrap confidence intervals and at least 100 warm observations per primary matrix cell; use at least 30 cold starts where practical.
- Publish per-class, per-surface, per-browser and per-hardware slices; never use a pooled number to hide a weak critical class.
- Fix seeds, warm-up protocol, power mode and background load. Randomize scenario order.
- Separate model calibration data from the frozen holdout.
- Record missing/blocked cases as outcomes, not silently drop them.

## 9. Ablation and trade-off studies

Required variants:

1. DOM-only.
2. Vision/OCR-only.
3. Fused union privacy + concordant grounding.
4. Fused without coverage gate.
5. Fused without final-byte verifier.
6. Full frame vs changed-region processing.
7. WebGPU vs WASM on the same supported hardware/model.
8. Scene-graph-only remote request vs graph + sanitized image.
9. Solid mask vs placeholder rendering for non-critical classes.
10. Candidate OCR/model tiers.

Report the privacy-utility-resource Pareto frontier. Do not select a faster point if it violates a critical privacy gate.

## 10. Regression gates and CI

Every change to capture, coordinate mapping, detectors, policy, compiler, encoder, verifier, contracts, gateway, prompt or executor runs:

- unit and property tests;
- frozen synthetic privacy suite;
- final-byte canary and metadata suite;
- action-state/race suite;
- prompt-injection negative suite;
- schema compatibility/fuzz tests;
- model hash/license manifest validation;
- performance smoke budget on a pinned runner; and
- scheduled full browser/hardware runs.

Release artifacts include `benchmark-manifest.json`, raw aggregate counts with no page content, plots/tables, environment record, known exclusions and a signed model/policy/schema manifest.

## 11. MVP benchmark demonstration

The SIH demo should show a fixed 12-stage sequence:

1. original local synthetic page;
2. DOM-only detections;
3. vision-only detections;
4. fused findings and coverage map;
5. typed random token capabilities;
6. fresh sanitized image and graph;
7. pass-two decision, including one seeded failure;
8. browser network interception and server-ingress digest/canary result;
9. remote one-action response;
10. local element/policy/freshness validation;
11. extension-owned confirmation and execution; and
12. page-state diff plus measured scorecard.

The scorecard names the laptop, browser, versions, model hashes, dataset seed/N and cold/warm status. Targets are never displayed as achieved results.

## 12. Credibility limits

- >=85% grounding can be credible on the frozen synthetic portal family, not arbitrary websites.
- >=97% critical recall requires substantial per-class N; a handful of obvious examples is not evidence.
- `0/N` residual leakage is a test result, not a universal guarantee.
- A complete detector + OCR + NER + face/document stack within 50 MB is risky; report three size definitions.
- 350 MB depends on sequential inference and buffer reuse; JavaScript heap alone is insufficient measurement.
- Firefox/WASM <=2 seconds may be missed when OCR is required.
- End-to-end <=4 seconds depends on a warm nearby GPU and bounded queue.
- GUIGuard, Mind2Web, ScreenSpot-Pro and AgentDojo measure different constructs; do not merge their scores into one headline.
