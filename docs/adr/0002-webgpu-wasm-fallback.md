# ADR-0002: Use WebGPU with a certified WASM fallback

**Status:** Accepted  
**Context:** Browser hardware and execution-provider support varies. ONNX Runtime Web currently lists broad WASM support and Chromium WebGPU, but not Firefox WebGPU parity [R7]. Privacy cannot depend on an optional accelerator.

## Decision

Feature-detect and benchmark a WebGPU tier for supported Chromium and a quantized WASM SIMD tier for all supported browsers. Model manifests declare compatible operators, memory budgets and privacy-equivalent detector coverage. Runtime failure may switch only to a prevalidated equivalent tier; otherwise the request blocks.

## Alternatives

- WebGPU only: faster on some devices but incompatible/fragile.
- WASM only: widest compatibility but may miss latency targets.
- Separate browser implementations: duplicates security-critical logic and drifts.

## Consequences

One pipeline supports heterogeneous devices while keeping privacy gates constant. Build/test complexity and model packaging increase. Firefox may be functionally supported without equal performance.

## Risks

Operator fallback, GPU driver loss and memory duplication can invalidate targets. Mitigate with model export tests, cold/warm profiling, buffer reuse, bounded inputs and no silent detector omission.
