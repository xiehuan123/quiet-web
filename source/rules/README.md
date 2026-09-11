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
