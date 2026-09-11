# 02 — 高置信页面净化与可逆恢复

**Type:** implementation  
**Parent:** `../spec.md`  
**Blocked by:** 01 — 网络保护与总开关  
**Status:** ready-for-agent  
**Required skills:** `chrome-extensions`, `implement`, `tdd`, `code-review`  
**Ownership:** filtering policy module, site profiles, content script adapter and CSS, DOM fixtures and performance-boundary tests

**What to build:** 用户浏览支持的 HTTP/HTTPS 页面时，静态和动态插入的高置信广告容器会被无感隐藏，而正文、导航、登录、安全、支付、cookie 选择与付费墙保持可用；关闭总开关会立即撤销本扩展的页面改动。

## Acceptance criteria

- [ ] AC-08 候选必须具备至少两个独立广告信号，且 fixed/dialog/overlay/popup/ad-class 任一单独特征不会触发隐藏。
- [ ] AC-09 正文、导航、登录、密码、OTP、CAPTCHA、支付/checkout、安全/风控、cookie/隐私选择、付费墙和内容门控命中任何保护信号即保留。
- [ ] AC-10 静态悬浮、插屏、带关闭控件的广告、已知广告 iframe 与关联遮罩在 fixture 中按规格隐藏；节点不从 DOM 删除。
- [ ] AC-11 MutationObserver 只处理新增子树，合并到 requestAnimationFrame 队列并限制单批工作量；动态广告隐藏、根外无关节点不误处理。
- [ ] AC-12 隐藏使用扩展专属标记；总开关关闭时当前页立即恢复所有本扩展隐藏内容并停止 observer，重开时重新过滤。
- [ ] AC-13 popup 分开显示页面隐藏数和网络保护状态，不把隐藏数或规则数描述为“所有广告”。
- [ ] AC-14 DOM 公共 seam 的正反例测试、类型检查与正式构建通过；固定基线 Standards/Spec 双轴审查通过。
- [ ] AC-15 当前构建完成静态正例、保护反例、动态插入、恢复及 popup 重开的真实 Chrome DevTools MCP 票内验收并有 gate 报告。

## Out of scope

任意网页按钮自动点击、通用 procedural filtering、第三方过滤列表和本站允许清单管理。

## Evidence

待实施后回填提交、审查、浏览器原始记录、截图、candidate 与 gate 报告。

## Comments

- 保护信号优先于广告信号；为提高命中率不得降低这一否决规则。
