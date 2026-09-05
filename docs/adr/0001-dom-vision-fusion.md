# ADR-0001: Fuse DOM-derived semantics and visual perception

**Status:** Accepted  
**Context:** DOM/ARIA is efficient and gives roles and live targets, but misses canvas, images, PDFs, inaccessible frames and incorrect markup. Vision sees rendered pixels but is costlier and less reliable for semantics and executable binding.

## Decision

Collect both signals locally. Privacy uses the geometric/category union of DOM, OCR, vision and policy findings. Automated action grounding requires a current DOM binding plus sufficient semantic/visual concordance. Every element records source evidence. A coverage map marks visible regions scanned, masked, policy-safe or unknown.

## Alternatives

- DOM only: fast and actionable but blind to pixel-only content.
- Vision only: covers pixels but loses reliable roles and DOM execution binding.
- Remote multimodal fusion: exposes raw context and violates the privacy boundary.

## Consequences

Recall improves and the system can demonstrate DOM-only/vision-only/fused ablations. Coordinate normalization and snapshot consistency become first-class components. The pipeline uses more memory and latency.

## Risks

Union masking can over-redact; concordance can reduce utility. Coordinate errors can create leaks or wrong actions. Mitigate with actual-dimension transforms, padding, frozen zoom/DPR tests, and user-assisted mode when binding is uncertain.
