# 原始会话与可读记录

- `../conversation.md`：原生主会话中完整的公开用户输入、主线程委派/恢复指令和 AI 回复，按实际顺序整理。
- `raw/codex-native/main/`：当前开发主会话的原始 JSONL 文件；恢复同一会话的轮次保留在其中。
- `raw/codex-native/development-subagents/`：开发、研究、审查子会话的原始文件（若有）。
- `raw/cli-events.log`：CLI 输出事件及错误流；运行器已对已知认证串脱敏。
- `raw/queued-inputs.json`：仍在队列中、未进入主会话历史的实际主线程输入。
- `manifest.json`：消息数量、原文件位置、归档文件和 SHA-256。

运行中是定期快照，结束后会再次核对。原生运行文件同时继续保存在项目 `.runtime/codex-home/sessions/`，没有被删除或改写。原始记录仅保留本机并排除在 Git 外，认证文件和模型服务配置不归档。自动审批内部记录仍留在原运行目录，不展开为用户会话。
