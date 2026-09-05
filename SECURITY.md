# Security policy

## Prototype status

DrishtiGuard is a hackathon MVP and architecture baseline. It has not received an independent security or privacy audit and must not be used with real personal, financial, authentication, or production data.

Use only synthetic test pages and synthetic identifiers while evaluating this repository.

## Reporting a vulnerability

Please do not publish exploit details, leaked data, credentials, or sensitive reproduction material in a public issue.

Use GitHub's private vulnerability-reporting flow for this repository when available. If it is unavailable, open a minimal issue requesting a private maintainer contact without including sensitive technical details.

Include, when safe:

- affected commit and component;
- impact and preconditions;
- a synthetic-data reproduction;
- whether the issue can cause raw data egress or unauthorized action; and
- a proposed mitigation, if known.

## Highest-priority classes

The following are treated as release-blocking:

- raw screenshot, DOM, token-map, selector, or secret egress;
- bypass of the exact-payload verifier or coverage gate;
- capability reuse across tasks or sessions;
- action execution without explicit confirmation where required;
- stale-target or page-mutation validation bypass;
- remotely hosted extension code; and
- credential, API-key, or personal-data exposure in source, logs, fixtures, or artifacts.

See [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md) and [`docs/PRIVACY_MODEL.md`](docs/PRIVACY_MODEL.md) for the design baseline.
