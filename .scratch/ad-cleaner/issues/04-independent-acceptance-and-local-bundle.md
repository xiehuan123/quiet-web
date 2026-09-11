# 04 — 独立整体验收与正式本地包

**Type:** independent acceptance  
**Parent:** `../spec.md`  
**Blocked by:** 01 — 网络保护与总开关; 02 — 高置信页面净化与可逆恢复; 03 — 本站暂停、允许清单与持久恢复  
**Status:** completed
**Required skills:** `chrome-extensions`, `code-review`, `browser-extension-launch` acceptance and bundle tools  
**Ownership:** final `extension/`, cross-feature browser evidence, screenshots, raw MCP records, final review, acceptance gate, release-bundle reports, Chinese usage and final report

**What to build:** 从最终正式构建复制并核对可直接加载的 `extension/`，在独立 Chrome DevTools MCP profile 真实安装，从原生 action 完成跨功能流程、失败恢复、关闭重开和浏览器重开持久化，并生成可审计的本地交付报告。

## Acceptance criteria

- [x] AC-25 `extension/` 与 `source/.output/chrome-mv3` 内容一致，不包含源码、测试、工单、凭据或开发服务器文件；manifest、规则、图标结构检查通过。
- [x] AC-26 真实安装后核对扩展 ID、版本、路径、启用状态，并从原生 action 打开 popup；不以直开 HTML 代替。
- [x] AC-27 本地综合 fixture 真实覆盖网络正/负例、静态和动态广告、所有保护反例、总开关、本站暂停/恢复、设置允许清单和明确刷新提示。
- [x] AC-28 ABP Test Pages 的声明支持子集和至少一个普通公开网站完成匿名观察，保留页面截图、网络/控制台结果和范围外说明；不登录或提交表单。
- [x] AC-29 popup 关闭重开验证状态；隔离浏览器环境重开验证允许清单与总开关持久化。若 MCP 不支持真正进程重启，保留准确 blocker，不用 popup 重开冒充。
- [x] AC-30 最终固定基线的 Standards/Spec 两个独立 code-review 均覆盖未提交文件并通过；发现故障按 diagnosing-bugs 修复后复验。
- [x] AC-31 验收目录包含用户原始浏览器选择副本，JSON 的 `browser_choice` 与 `environment.automation_provider='chrome-devtools-mcp'` 准确；candidate 对应最终 `extension/`。
- [x] AC-32 `acceptance_gate.py check` 返回 `gate_passed: true`，`release_bundle.py check` 和 `pack` 成功；所有报告使用新路径且 ZIP 在运行目录外。
- [x] AC-33 `README.md`/中文使用说明和 `FINAL_REPORT.md` 说明已实现、已验证/未验证、加载目录、证据、提交和边界，不宣称全网 100%。

## Out of scope

Chrome Web Store 材料、注册、付费、上传、审核、远端 push 和日常 Chrome。

## Evidence

- 实现与最终交付提交：`4ee2663`。
- 双轴审查：`reviews/final.md`；固定基线 `f7d048b`，最终 Standards/Spec 均 PASS。
- 最终加载目录：`extension/`；candidate `06ae81d30a4a5dd075df2851cca542456f7dd515ae7b264fb37f60e90b78b099`。
- 真实验收：`evidence/final/`；`gate-report.json` 为 `gate_passed: true`，检查 22 个证据文件。
- 发布检查：`release-check.json` 0 error/0 warning；`artifacts/quiet-web-0.1.0.zip` SHA-256 `f297077f13e25b9df45d541402dba1d7d4b93fc015a493be2f00d5f13422d121`。
- 中文说明与边界：`README.md`、`BUILD.md`、`PRIVACY.md`、`FINAL_REPORT.md`。

## Comments

- 用户已批准 Chrome DevTools MCP 替代默认 Playwright MCP，原始选择在 `run-inputs/browser-choice/user-decision.md`。
