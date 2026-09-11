# Ticket 02 Chrome DevTools MCP raw operation record

Date: 2026-09-12. Browser: isolated `HeadlessChrome/153.0.0.0`; provider: `chrome-devtools-mcp`.

```text
build candidate fingerprint after browser metadata generation
c74c6a32e30152043744f48f379e437634c00af4eaf78d0ef1764d305030b875

reload_extension id=ooadlcdjhdoaanegcfieeidedohkbnjg after final review fixes
Extension reloaded from /Users/xiehuan/Desktop/浏览器插件/quiet-web/source/.output/chrome-mv3

list_extensions
id=ooadlcdjhdoaanegcfieeidedohkbnjg "广告净化" v0.1.0 Enabled

navigate_page pageId=2 type=reload ignoreCache=true
URL=http://127.0.0.1:4181/ticket2.html

evaluate_script static state
{"floatingHidden":"true","overlayHidden":"true","protected":{"article":true,"login":true,"dialogDecoy":true,"navigation":true},"bodyOverflow":"auto","nodesConnected":true}

click uid=24_14 name="插入动态广告"
Successfully clicked on the element

evaluate_script dynamic state
{"dynamicExists":true,"dynamicHidden":"true","dynamicConnected":true,"hiddenIds":["floating-ad","ad-overlay","dynamic-ad"]}

trigger_extension_action id=ooadlcdjhdoaanegcfieeidedohkbnjg
Extension page 13 opened: chrome-extension://ooadlcdjhdoaanegcfieeidedohkbnjg/popup.html
Popup snapshot: 保护已开启; current page 127.0.0.1; 页面已隐藏 3.

click popup master switch off
evaluate_script restored state
Popup immediately displayed 页面已隐藏 0.
{"hiddenIds":[],"nodesConnected":true,"bodyOverflow":"hidden","protected":{"article":true,"login":true,"dialogDecoy":true,"navigation":true}}

click popup master switch on
Protection returned to enabled state.

Same-build close/reopen check
Closed native popup page 13, selected the fixture, triggered extension action, waited, and listed a new popup page 14.
Reopened popup: 保护已开启; switch checked; current page 127.0.0.1; 页面已隐藏 3.
```

The first pointer-based dynamic-fixture attempt did not insert a node because the fixed decoy overlapped the button. That diagnosis and the corrected real pointer retest are preserved in `dynamic-trigger-diagnostic.json`, `../../records/diagnostics/ticket-02-dynamic-fixture-click.md`, and `dynamic-filter-state-after-retest.json`. No fake Chrome API or direct storage writes were used.
