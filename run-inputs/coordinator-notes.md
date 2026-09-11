# 主会话协调记录

- 三个开发项目分别运行独立 Codex CLI，模型 gpt-5.6-sol / high；没有继承主会话对话。
- 用户已选择独立 Chrome DevTools MCP，原始选择见 browser-choice/user-decision.md。
- 本机已有 Node 24.19.0（/Users/xiehuan/.nvm/versions/node/v24.19.0/bin），可在当前项目命令环境使用，避免 Node20 与 WXT latest 引擎要求冲突；不修改全局默认版本。此信息已通过 codex queue 发给本会话。
- 会话、配置、技能快照及浏览器 profile 位于 .runtime/，Git忽略；模型访问只复用必要认证。它不是操作系统容器，仍共享本机工具。
- 会话完成后可打开根目录“打开Codex会话.command”续接同一个 CLI 会话；开发中不要并发续接。
- 原始JSONL事件保留在 .runtime/events.jsonl，已知认证串会脱敏；可读消息见 conversation.md。
