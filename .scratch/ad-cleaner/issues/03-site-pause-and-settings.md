# 03 — 本站暂停、允许清单与持久恢复

**Type:** implementation  
**Parent:** `../spec.md`  
**Blocked by:** 01 — 网络保护与总开关; 02 — 高置信页面净化与可逆恢复  
**Status:** ready-for-agent  
**Required skills:** `chrome-extensions`, `implement`, `tdd`, `product-designer`, `ui-designer`, `frontend-architect`, `code-review`  
**Ownership:** exact-hostname pause policy, dynamic DNR adapter, popup site control and feedback, options allowlist management, recovery/persistence fixtures

**What to build:** 用户可在原生 popup 暂停或恢复当前精确 hostname；页面隐藏立即撤销，网络变化明确提示刷新；允许清单可在设置页查看和移除，并在入口或浏览器重开后保持。

## Acceptance criteria

- [ ] AC-16 popup 显示经 URL 解析的精确 hostname；内部页/无 hostname 页面禁用本站控制并说明原因。
- [ ] AC-17 暂停本站原子地同步 `storage.local` 允许清单和高优先级动态 allow rule；失败时不展示半成功状态。
- [ ] AC-18 暂停后当前页 DOM 立即完整恢复并停止过滤，popup 清楚提示“刷新后恢复网络请求”；刷新后广告请求恢复。
- [ ] AC-19 重新启用本站后当前页重新过滤并提示刷新；刷新后网络阻断恢复。
- [ ] AC-20 设置页按 hostname 排序展示允许清单，可移除单项和清空；空态、成功反馈与错误恢复清晰，键盘和焦点可用。
- [ ] AC-21 允许清单和总开关在 popup 关闭重开以及隔离浏览器关闭重开后保留。
- [ ] AC-22 popup 和设置页准确说明设置仅保存在本机、不上传页面内容、网络规则变更需刷新以及非 100% 覆盖边界。
- [ ] AC-23 状态策略测试、类型检查和正式构建通过；固定基线 Standards/Spec 双轴审查通过。
- [ ] AC-24 当前构建完成暂停、即时恢复、刷新网络恢复、重新启用、设置移除与重开持久化的真实 Chrome DevTools MCP 票内验收并有 gate 报告。

## Out of scope

通配符/正则允许项、跨设备同步、云账号与远程规则更新。

## Evidence

待实施后回填提交、审查、浏览器原始记录、截图、candidate 与 gate 报告。

## Comments

- hostname 和动态规则 ID 的转换必须确定、可验证，并处理 ID 冲突或无效主机输入。
