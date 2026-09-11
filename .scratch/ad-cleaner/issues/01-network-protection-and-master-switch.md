# 01 — 网络保护与总开关

**Type:** implementation  
**Parent:** `../spec.md`  
**Blocked by:** None — can start immediately  
**Status:** completed
**Required skills:** `extension-create`, `chrome-extensions`, `implement`, `tdd`, `code-review`  
**Ownership:** WXT scaffold and manifest, static DNR rules, persistent master state, service worker adapter, popup master status, network fixtures

**What to build:** 用户加载真实扩展并打开工具栏 popup 后，可以看到默认开启的网络保护，关闭或重新开启总开关；刷新测试页后，已知广告子资源分别恢复或再次被阻断，选择在 popup 重开后保留。

## Acceptance criteria

- [x] AC-01 从真实 unpacked 产物安装并以原生 action 打开 popup，显示扩展名称、当前状态和总开关。
- [x] AC-02 默认启用自有小规模 `core` DNR 规则；固定正例子资源被阻止，相似合法 URL 与所有 main-frame URL 放行。
- [x] AC-03 关闭总开关后 `core` 被禁用，刷新后正例请求不再由扩展阻止；重新开启并刷新后再次阻止。
- [x] AC-04 总开关通过 `storage.local` 持久化，关闭并重开 popup 后保持；service worker 不依赖全局内存状态。
- [x] AC-05 popup 对不支持页显示准确说明，不声称已统计广告数；所有权限和图标引用都与真实文件一致。
- [x] AC-06 类型检查、规则检查、测试和正式构建通过；以固定基线完成 Standards/Spec 双轴审查。
- [x] AC-07 当前构建完成 install/native_entry/primary_flow/reopen 的真实 Chrome DevTools MCP 票内验收并有 gate 报告。

## Out of scope

DOM 元素隐藏、本站允许清单、设置页和最终跨功能回归由后续票负责。

## Evidence

- Candidate: `022c5a093184bd4a56b6325e716fb1f97d5322169888bef8add53763a2a696ac`.
- Tests: 8 passed; TypeScript compile and WXT production build passed.
- Browser: `evidence/ticket-01/acceptance.json`, raw log and screenshots in the same directory.
- Gate: `evidence/ticket-01/gate-report-after-review.json` (`gate_passed: true`).
- Review: `reviews/ticket-01.md` (Standards: no hard findings; Spec: 0 after fixes).
- Diagnostics: `records/diagnostics/ticket-01-native-target.md`.
- Recoverable implementation commit: `d6e5c12`.

## Comments

- 技术默认由本轮明确授权的主编排决定；Local Markdown 发布即生效。
- Completed after red/green tests, real native action validation, review fixes, independent re-review, and the current-candidate gate.
- Local commit `d6e5c12` records the implementation and evidence; no remote action was taken.
