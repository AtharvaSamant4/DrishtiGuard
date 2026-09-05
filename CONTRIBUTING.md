# Contributing

Contributions should preserve DrishtiGuard's fail-closed privacy and action boundaries.

## Before opening a pull request

1. Use only synthetic data and fixtures.
2. Keep raw captures, reversible token maps, selectors, URLs, and secrets out of wire contracts and logs.
3. Add a regression fixture for any privacy or execution-safety change.
4. Update the architecture or ADRs when changing a trust boundary or contract.
5. Run the repository checks below.

```bash
node --check apps/extension/service-worker.js
node --check apps/extension/sidepanel.js
node apps/extension/tests/privacy-gate.test.cjs

cd apps/live-demo
npm ci
npm test
```

Do not weaken a fail-closed check to improve latency or demo success rate. Unsupported surfaces must remain masked, non-actionable, or blocked until measured evidence supports a narrower policy.
