# 01 — 网络保护与总开关

**Type:** implementation  
**Parent:** `../spec.md`  
**Blocked by:** None — can start immediately  
**Status:** ready-for-agent  
**Required skills:** `extension-create`, `chrome-extensions`, `implement`, `tdd`, `code-review`  
**Ownership:** WXT scaffold and manifest, static DNR rules, persistent master state, service worker adapter, popup master status, network fixtures

**What to build:** 用户加载真实扩展并打开工具栏 popup 后，可以看到默认开启的网络保护，关闭或重新开启总开关；刷新测试页后，已知广告子资源分别恢复或再次被阻断，选择在 popup 重开后保留。

## Acceptance criteria

- [ ] AC-01 从真实 unpacked 产物安装并以原生 action 打开 popup，显示扩展名称、当前状态和总开关。
- [ ] AC-02 默认启用自有小规模 `core` DNR 规则；固定正例子资源被阻止，相似合法 URL 与所有 main-frame URL 放行。
- [ ] AC-03 关闭总开关后 `core` 被禁用，刷新后正例请求不再由扩展阻止；重新开启并刷新后再次阻止。
- [ ] AC-04 总开关通过 `storage.local` 持久化，关闭并重开 popup 后保持；service worker 不依赖全局内存状态。
- [ ] AC-05 popup 对不支持页显示准确说明，不声称已统计广告数；所有权限和图标引用都与真实文件一致。
- [ ] AC-06 类型检查、规则检查、测试和正式构建通过；以固定基线完成 Standards/Spec 双轴审查。
- [ ] AC-07 当前构建完成 install/native_entry/primary_flow/reopen 的真实 Chrome DevTools MCP 票内验收并有 gate 报告。

## Out of scope

DOM 元素隐藏、本站允许清单、设置页和最终跨功能回归由后续票负责。

## Evidence

待实施后回填提交、审查、浏览器原始记录、截图、candidate 与 gate 报告。

## Comments

- 技术默认由本轮明确授权的主编排决定；Local Markdown 发布即生效。
