# 广告净化：复杂项目规格入口

本文件仅为调度索引，不是另一份权威规格。尚未执行 to-spec，也未发布主票或创建独立模块工单。

- 需求来源：无感剔除常见网站广告，尤其悬浮广告、需要点击确认/关闭的广告；先调研再开发。
- 复杂度理由：网络 DNR、DOM 高置信识别与可逆恢复、全局与站点级持久状态、设置界面及跨场景真实验收构成多个相互依赖的纵向功能。
- 本次交付目标：在本机使用（local；provided）
- 正式规格/主票：`.scratch/ad-cleaner/spec.md`（to-spec 已发布，`ready-for-agent`）。
- 子票：`.scratch/ad-cleaner/issues/01` 至 `04`（to-tickets 已按依赖独立发布）。

setup-matt-pocock-skills、to-spec 与 to-tickets 已执行；当前按前置依赖执行 01 票的 implement。
默认沿用这些 skills 的 Local Markdown 工作流，由主执行者自行做技术判断和拆分；更新 state.workflow.authoritative_artifacts 指向实际产物。
tasks/T-*.md 仅跟踪阶段依赖和验收证据，实施范围与验收标准以正式规格和子票为准。外部反馈或旧票需要分流时才使用 triage。
每票必须使用 code-review，并通过 Playwright MCP 实际加载插件完成端到端验证；发现问题必须使用 diagnosing-bugs。
