# Production network rules

These six rules are project-owned, hand-reviewed host rules. They were not copied from EasyList, ABP subscriptions, uBO, or another third-party list.

| ID | Host | Reason | Resource boundary |
| --- | --- | --- | --- |
| 1 | `doubleclick.net` | Google advertising delivery endpoints | subresources only |
| 2 | `googlesyndication.com` | Google ad script and creative delivery | subresources only |
| 3 | `googleadservices.com` | Google advertising conversion/delivery endpoints | subresources only |
| 4 | `amazon-adsystem.com` | Amazon advertising delivery endpoints | subresources only |
| 5 | `taboola.com` | Taboola sponsored-content delivery endpoints | subresources only |
| 6 | `outbrain.com` | Outbrain sponsored-content delivery endpoints | subresources only |

Every rule is limited to script, image, XHR, sub-frame, and media resources. No rule includes `main_frame`; direct navigation remains allowed. Positive and similar-looking negative cases live in `tests/network-cases.json`.

## Local site-pause rules

Paused exact hostnames are not added to this static file. `lib/site-policy.ts` deterministically builds priority-100 dynamic `allowAllRequests` frame rules in the reserved ID range `1000000000..1999999999`. Its anchored HTTP(S) regex includes the exact hostname and optional port, but excludes subdomains and suffix attacks. The background adapter atomically replaces only IDs in that range and rolls the prior set back if `storage.local` persistence fails. Tests cover URL parsing, exact matching, deterministic hash collisions, ordering and rollback.
