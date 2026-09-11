# Ticket 03 设置页原生入口诊断

Chrome DevTools MCP 在真实 native action popup 中点击“管理暂停列表与使用边界”后，popup 关闭但没有出现可列出、可操作的设置页。检查正式构建 manifest，WXT 自动生成的是 `options_ui.open_in_tab: false`，即嵌入式设置入口；独立 headless 浏览器没有暴露对应目标。

第一次只在 `wxt.config.ts` 声明 `open_in_tab: true` 无效：WXT 的 options HTML entrypoint 元数据在构建时仍覆盖为 `false`，真实运行中的 `chrome.runtime.getManifest()` 也证实这一点。最终修复是在 options HTML 写入 `manifest.open_in_tab=true` 元数据，并让 popup 的设置按钮通过真实 `chrome.tabs.create()` 打开随包 `options.html` 标签页；这仍由原生 action popup 的实际点击处理函数触发，且提供失败反馈。随后重新执行测试、类型检查、production build、扩展 reload 和 native action 点击，不以 manifest 存在代替验收。
