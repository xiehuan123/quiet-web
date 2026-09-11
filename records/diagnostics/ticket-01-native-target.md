# Ticket 01 native popup target diagnosis

The first real native action opened the popup but displayed “此页面不受支持” while the fixture tab was selected. `tabs.query()` in the service worker showed that tab URLs were absent without the `tabs` permission; direct page fallback logic would also misidentify an old HTTP tab when a restricted page was truly active.

The regression seam is `selectTargetTab`: it must return the active HTTP/HTTPS tab and must return undefined when the active page is restricted even if an older web tab exists. Tests went red before the fix. The manifest now declares `tabs`, which is required to read the active URL for exact-host status. The popup queries only `{active: true, currentWindow: true}`.

The real failure and fix are preserved in `evidence/ticket-01/popup-open.snapshot.txt`, `tabs-query-before-fix.json`, `tabs-query-with-permission.json`, `popup-unsupported-after-review-fix.snapshot.txt`, and `popup-supported-after-review-fix.snapshot.txt`. The rebuilt candidate passed `gate-report-after-review.json`.
