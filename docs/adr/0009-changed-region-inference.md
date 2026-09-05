# ADR-0009: Use changed-region inference only as a guarded optimization

**Status:** Accepted  
**Context:** Reprocessing the full viewport is expensive, but DOM mutations do not capture canvas, animation, video or compositing changes. Reusing stale safe labels can leak.

## Decision

Compute a full-frame pixel diff for each coordinated capture and reuse OCR/detection results only for stable regions whose navigation, viewport, zoom, transform and policy lineage match. Navigation, scroll/resize/zoom, dynamic surfaces, high diff or uncertainty resets the baseline. Final verification covers the complete outgoing artifact every time.

## Alternatives

- Full inference every step: simplest/safest but may miss resource and latency targets.
- DOM-mutation-only invalidation: fast but blind to pixel-only changes.
- Continuous video capture: violates capture cost/rate and resource constraints.

## Consequences

Warm steps can be faster while privacy gates remain complete. Cache keys and invalidation logic are security-critical.

## Risks

False stability is a privacy failure. Use conservative thresholds, salted local hashes, short lineage and regression cases for canvas/video/animation.
