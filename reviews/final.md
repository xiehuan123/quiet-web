# Ticket 03 / 04 与最终候选双轴代码审查

- 固定基线：`f7d048b`
- 范围：基线之后的全部暂存与未提交变更，包括 Ticket 03 实现、Ticket 04 最终 `extension/`、新文件、浏览器证据、gate、ZIP 和 `FINAL_REPORT.md` 草稿
- Standards reviewer：Tesla（独立子代理）
- Spec reviewer：Singer（独立子代理）
- 规格：`.scratch/ad-cleaner/spec.md`、Ticket 03 AC-16～24、Ticket 04 AC-25～33

## 首轮结论

Standards 发现 4 个硬问题与 1 个低风险判断项：设置 mutation 可并发交错、重开证据不是最终 ID、rollback 与 reconciliation 双失败不可诊断、popup 点击区不足 36px，以及事务结构重复。Spec 发现 4 组证据缺口：最终保护反例不全、没有非默认总开关的整浏览器重开、没有真实清空允许清单、公开站点没有网络/控制台记录。首轮未通过。

## 修复与复验

- 新增纯 `async`/`await` 串行队列；initialization/GET/SET 全部进队，mutation 在临界区重读权威设置。可控 interleaving 与拒绝后继续测试通过。
- 抽取通用补偿事务；rollback 失败时从 `storage.local` 重新同步，错误对象保留 primary/rollback/reconciliation 三类原因，包括双失败测试。
- popup 主按钮、文本按钮与开关的实际点击区均至少 36px。
- 扩充综合 fixture，真实验证 12 类保护/单信号反例；真实点击动态插入。
- 设置页真实验证两个排序 hostname、单项移除、清空、反馈与焦点移交。
- 用最终 ID 设置 `enabled=false` 和非空 allowlist，只正常关闭带本项目精确 profile 的 Chrome 主进程；MCP 重开后从同一最终路径重装同一 ID，两个非默认设置和 DNR 状态保留。
- ABP Blocking 和 Example Domain 均保留截图、DOM、网络和控制台结果，并逐项区分自有规则支持与 ABP 语法范围外能力。

## 最终复审

- Standards：PASS，硬问题 0，判断项 0；确认源码无 `.then(`，队列异常后释放语义有测试。
- Spec：PASS，finding 0；AC-16～33 全部满足，无范围蔓延。
- 自动检查：41 tests passed；TypeScript、WXT production build、`npm audit --omit=dev` 通过。
- 候选：`06ae81d30a4a5dd075df2851cca542456f7dd515ae7b264fb37f60e90b78b099`。
- 门禁：`evidence/final/gate-report.json` 与 `evidence/ticket-03/gate-report.json` 均为 `gate_passed: true`，各检查 22 个证据文件。
- 本地包：`artifacts/quiet-web-0.1.0.zip`，SHA-256 `f297077f13e25b9df45d541402dba1d7d4b93fc015a493be2f00d5f13422d121`。

结论：Ticket 03、Ticket 04 与最终本地候选可以关闭。
