# Ticket 01 Chrome DevTools MCP raw operation record

Date: 2026-09-11, isolated project browser profile.

```text
install_extension path=/Users/xiehuan/Desktop/浏览器插件/quiet-web/source/.output/chrome-mv3
Extension installed. Id: ooadlcdjhdoaanegcfieeidedohkbnjg

list_extensions
id=ooadlcdjhdoaanegcfieeidedohkbnjg "广告净化" v0.1.0 Enabled

new_page http://127.0.0.1:4181/ticket1.html
service worker: chrome-extension://ooadlcdjhdoaanegcfieeidedohkbnjg/background.js

network with protection enabled
GET /ticket1.html [200]
GET /allowed-pixel.svg [200]
GET https://pagead2.googlesyndication.com/simgad/quiet-web-test [net::ERR_BLOCKED_BY_CLIENT]

trigger_extension_action id=ooadlcdjhdoaanegcfieeidedohkbnjg
Extension page: chrome-extension://ooadlcdjhdoaanegcfieeidedohkbnjg/popup.html
Popup displayed: 保护已开启; current page 127.0.0.1

click master switch off
Popup displayed: 保护已暂停; 页面改动已恢复；刷新后恢复网络请求。

reload fixture with protection off
GET /ticket1.html [200]
GET /allowed-pixel.svg [200]
GET https://pagead2.googlesyndication.com/simgad/quiet-web-test [404]

close popup; trigger_extension_action again
Popup reopened with master switch off and current page 127.0.0.1.

click master switch on; wait_for success; reload fixture
GET https://pagead2.googlesyndication.com/simgad/quiet-web-test [net::ERR_BLOCKED_BY_CLIENT]
```

The first native-entry attempt exposed a target-tab defect. The original failure is preserved in `popup-open.snapshot.txt`; the regression evidence is `tabs-query-before-fix.json` and `popup-after-fix.snapshot.txt`.

After independent review, the active-tab selection was tightened. With `about:blank` selected while an older HTTP tab remained open, the native popup correctly showed “此页面不受支持”; after selecting the fixture tab and triggering the action again, it showed `127.0.0.1`. Evidence: `popup-unsupported-after-review-fix.snapshot.txt`, `popup-supported-after-review-fix.snapshot.txt`, and `tabs-query-with-permission.json`.
