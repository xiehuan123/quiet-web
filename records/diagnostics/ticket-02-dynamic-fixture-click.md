# Ticket 02 dynamic fixture click diagnosis

The first Chrome DevTools MCP pointer click reported success, but no dynamic node appeared. This could not be counted as a filter pass because the extension never removes nodes.

Network and console inspection showed `ticket2.js` loaded with status 200 and no JavaScript errors. Calling the real page button's `.click()` through DOM evaluation (explicitly allowed for invoking actual page handlers) inserted `#dynamic-ad`; after 100 ms the node remained connected and had only the extension's `data-quiet-web-hidden="true"` marker.

The load-bearing fixture issue was the fixed-position single-signal decoy left at its static coordinates, where it could cover the dynamic button's pointer target. It was moved to the top-right while preserving its fixed/dialog/popup-class negative-test semantics. The page is reloaded and the original MCP pointer-click path is repeated; the final evidence records only the verified result.
