# ADR-0010: Use content-free, schema-limited telemetry

**Status:** Accepted  
**Context:** Performance, reliability and model regressions need observability, but conventional logs/APM can capture screenshots, prompts, OCR, URLs and values.

## Decision

Define a separate fixed telemetry schema containing only component timing, capability flags, versions, counts, size/resource buckets, decision enums and safe error codes. No generic message, URL, prompt, response, stack-local or arbitrary tags. Diagnostics are opt-in and short-retention. Scrub failure drops the event.

## Alternatives

- No telemetry: minimizes leakage but blocks production operations.
- Conventional structured logs with redaction: flexible but fields/exception capture drift.
- Content logs under consent: too risky for the default product path.

## Consequences

Operators can detect latency/failure trends without page content. Debugging individual semantic failures is harder and relies on local synthetic reproduction.

## Risks

Counts/timing can still be identifying in combination, and infrastructure can add body logging. Bucket values, rotate trace IDs, limit retention and audit every hop with synthetic canaries.
