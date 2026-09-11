# 项目决定

按用户原话、已有记录或实际证据填写；区分用户已确认、AI 暂定、待决定。沉默不等于同意。

| 编号 | 要决定什么 | 答案 | 来源与日期 | 状态 | 影响规格/验收 | 替代旧决定 |
| --- | --- | --- | --- | --- | --- | --- |
| D-001 | 本轮交付目标 | 本机可直接加载，不做商店或远端 | 用户明确要求，2026-09-11 | confirmed | 全部；发布票范围外 | 初始化未决定 |
| D-002 | 验收浏览器服务 | 独立 Chrome DevTools MCP | `run-inputs/browser-choice/user-decision.md`，2026-09-11 | confirmed | install/native_entry/E2E/reopen | 默认 Playwright MCP |
| D-003 | 工单系统 | Local Markdown `.scratch/ad-cleaner/` | 用户授权默认 Local Markdown，2026-09-11 | confirmed | 规格与四张票 | 无 |
| D-004 | 技术脚手架 | WXT + Vanilla TypeScript，源码 `source/` | AI 可逆默认，2026-09-11 | adopted | 构建、测试、extension 复制 | 无 |
| D-005 | 首版过滤边界 | 自有小规模 DNR + 多信号可撤销 DOM；不引入第三方列表 | 官方资料复核与用户要求，2026-09-11 | confirmed | 规则、保护、许可、验收 | 无 |
| D-006 | 测试 seam | 规则结果、页面过滤结果、真实原生浏览器流程 | 用户授权机械决策 + TDD，2026-09-11 | adopted | 每票测试与审查 | 无 |

初始化未添加任何用户确认。浏览器默认值仅记录在 state.json 与 spec.md 中作为暂定方案。
