# 广告净化首版本地版

**Type:** parent specification  
**Status:** ready-for-agent  
**Delivery:** Local Markdown / local unpacked Chrome extension  
**Source:** `BRIEF.md`, `run-inputs/browser-choice/user-decision.md`, `research/verified-primary-sources.md`

## Problem Statement

普通用户在浏览新闻、博客、工具和内容网站时，会被常见第三方广告请求、悬浮广告、插屏广告以及带“关闭/确认”控件的广告打断。现有网页又包含登录、验证码、支付、安全提示、cookie 选择、正文和付费墙等外观相似但绝不能自动移除的内容。用户需要一款默认安静工作、能随时暂停并完整撤销自身页面改动的 Chrome 扩展，而不是一个宣称全网 100% 有效或以误伤换取表面清爽度的工具。

## Solution

交付一个 Manifest V3 本地 Chrome 扩展“广告净化”。它以两个相互约束的层工作：打包随版本维护的小规模 DNR 规则减少已知广告服务的子资源请求；content script 对明确候选执行多信号高置信判定，并在保护区否决后用扩展专属标记隐藏，不删除页面节点。

工具栏 popup 提供总开关、当前 hostname 的暂停/恢复、当前页页面隐藏数、清晰状态和网络状态刷新提示。设置页展示并管理精确 hostname 允许清单、产品边界与本机数据说明。关闭总开关或暂停本站时，当前页面立即撤销本扩展的 DOM 改动；DNR 已经阻断的网络响应不能找回，因此明确要求刷新后恢复。状态保存在 `storage.local`，浏览器或原生入口关闭重开后仍保留。

首版不下载远程规则或代码，不复制第三方整包列表，不点击任意网页按钮，不绕过登录、验证码、安全确认、cookie 选择或付费墙。

## User Stories

1. 作为普通浏览者，我希望扩展安装后默认减少已知广告服务的子资源请求，以便少受常见广告干扰。
2. 作为普通浏览者，我希望扩展自动隐藏满足多项广告证据的悬浮或插屏容器，以便不用逐个关闭明显广告。
3. 作为普通浏览者，我希望动态插入的高置信广告也被节流处理，以便单页应用继续浏览时不反复出现广告。
4. 作为普通浏览者，我希望扩展不因为元素是 fixed、dialog、overlay 或名称含 popup/ad 就单独隐藏它，以便普通网页控件不被误伤。
5. 作为需要登录的用户，我希望登录、密码、OTP 和 CAPTCHA 区域始终受保护，以便扩展不妨碍身份验证。
6. 作为进行敏感操作的用户，我希望支付、checkout、安全和风控提示始终受保护，以便扩展不绕过必要确认。
7. 作为内容读者，我希望正文、导航、cookie/隐私选择和付费墙始终保留，以便页面核心任务和用户选择完整可用。
8. 作为谨慎用户，我希望隐藏操作不删除 DOM 节点，并且只撤销本扩展自己的标记和样式，以便网页本身的后续变化不被覆盖。
9. 作为遇到兼容问题的用户，我希望在 popup 一键暂停精确的当前 hostname，以便立即恢复扩展隐藏的页面内容。
10. 作为暂停本站的用户，我希望看到“刷新后恢复网络请求”的准确提示，以便理解页面恢复与网络恢复的差异。
11. 作为恢复过滤的用户，我希望重新启用本站并刷新后恢复网络阻断和页面过滤，以便不必重装扩展。
12. 作为想临时停用的用户，我希望总开关立即撤销当前页页面隐藏，并在刷新后停止网络阻断，以便快速比较页面原貌。
13. 作为回访用户，我希望总开关和允许清单在关闭并重开 popup 或浏览器后仍保留，以便设置可靠。
14. 作为需要核对范围的用户，我希望 popup 明确显示当前 hostname，而不是模糊的“整个网站”，以便知道暂停影响哪里。
15. 作为维护允许清单的用户，我希望在设置页查看、移除单个 hostname 或清空清单，以便恢复默认保护。
16. 作为查看结果的用户，我希望“页面已隐藏数量”与“网络保护状态”分开呈现，以免把网络请求数误称为广告数。
17. 作为访问 Chrome 内部页或其他不支持页面的用户，我希望看到不能处理当前页面的明确反馈，而不是一个失效开关。
18. 作为隐私敏感用户，我希望设置和允许清单只保存在本机，网页内容不上传，以便无需账号或远程服务。
19. 作为性能敏感用户，我希望动态页面只扫描新增子树、合并变更并限制单批工作量，以便扩展不会持续全 DOM 暴扫。
20. 作为审慎用户，我希望扩展对遮罩或滚动锁只在它们与已确认广告同属一个广告界面时处理，并能撤销，以免干扰正常对话框。
21. 作为测试者，我希望固定正反例能验证每条生产 DNR 规则、每类保护区和动态插入路径，以便规则扩展不会静默增加误伤。
22. 作为测试者，我希望在 ABP 官方测试页只声明并验证首版支持的 basic blocking、普通 element hiding 与受限 DOM mutation 子集，以免把范围外能力包装成通过。
23. 作为测试者，我希望在至少一个公开广告测试页和至少一个普通公开网站匿名观察正文与导航，以便本地 fixture 之外也有真实性检查。
24. 作为使用者，我希望说明文档明确“不保证所有网站或 100% 过滤”，以便形成正确预期。
25. 作为维护者，我希望每条生产规则都有来源说明、唯一 ID、资源类型边界和负例，以便小规模规则可审查。
26. 作为维护者，我希望最终 `extension/` 是正式构建复制品而非开发服务器输出，以便可直接加载。

## Implementation Decisions

- 平台为 Chrome Manifest V3；使用 WXT Vanilla TypeScript 脚手架，源码放在 `source/`，正式构建后原样复制到根目录 `extension/`。
- 权限仅服务当前功能：`storage`、`declarativeNetRequest`，以及 HTTP/HTTPS 页面的 content-script 匹配；不申请 cookies、webRequest、downloads、identity、debugger 或远程代码能力。若实际生成 manifest 为 popup 读取当前 URL 需要额外权限，优先依靠已声明的页面 host access；不能满足时才加入并说明 `tabs`。
- 网络规则集名为 `core`，只包含项目自有的少量已知广告服务域规则，限制在 `script`、`image`、`xmlhttprequest`、`sub_frame`、必要时 `media`，绝不阻断 `main_frame`。
- 总开关的持久状态是唯一权威；service worker 在安装、启动和状态变更时使 `core` 规则集与其一致，不依赖内存全局变量。
- 本站暂停以精确 URL `hostname` 为数据模型，不接收通配符或正则。每个暂停 hostname 对应高优先级动态 `allowAllRequests` 规则，只针对该 hostname 的 main/sub frame 层级；规则与本地允许清单保持一致，更新失败不提交半完成状态。
- 页面过滤模块向调用者暴露一个深接口：给定候选根或新增子树，返回已处理元素与拒绝理由的结果；多信号评分、保护区、profile 规则和恢复细节藏在模块内。
- 候选来源是狭窄的高置信属性/已登记站点 profile/已知广告 iframe。隐藏必须满足至少两个独立广告信号，并且任何保护信号立即否决。位置、尺寸、遮罩、dialog、popup/ad 类名单独均不计为足够证据。
- 页面元素通过 `data-quiet-web-hidden` 和随包样式隐藏，不从 DOM 删除。若处理广告关联遮罩或滚动锁，记录原始内联值，且只在当前值仍是本扩展设置值时撤销。
- MutationObserver 只把新增 Element 子树放入去重队列；以 requestAnimationFrame 节流，单批限制节点量并在积压时让出主线程，不在每次 mutation 重扫整个 document。
- content script 监听 `storage.onChanged` 和显式消息；全局关闭或本站暂停后立即停止 observer 并恢复，重新启用后重建一次初始扫描。
- popup 是唯一主要入口，固定紧凑宽度，主状态、总开关、本站控制、页面隐藏反馈和设置入口按任务顺序排列。设置页只承担允许清单管理和边界说明，不复制 popup 的实时页面控制。
- 界面使用系统字体、高对比浅色、明确焦点环、至少 36px 控件高度、语义 label/status/live region；不使用装饰性动效，减少动效下无额外状态变化。
- 数据仅保存于 `storage.local`，不联网、不做 analytics、不上传网页内容；生产包不包含调研、测试、工单或审查文件。
- Chrome DevTools MCP 是用户明确批准的 Playwright 替代服务。最终证据内 `automation_provider` 为 `chrome-devtools-mcp`，并复制原始选择文件到同一验收证据目录。

## Testing Decisions

- 预先授权的最高公共 seam 有三个：规则清单的 URL/资源类型匹配结果；页面过滤模块对真实 DOM fixture 的“隐藏或保留/恢复”可观察结果；popup/设置页经真实 Chrome API 改变页面和持久状态的原生入口行为。
- TDD 只测试前两个纯行为 seam，不 mock 自有模块、不断言私有调用次数。Chrome adapter、权限、DNR 实装、storage 持久化和原生 action 由真实 Chrome DevTools MCP 验收，不以 fake chrome API 代替。
- 每条生产 DNR 规则至少有一个应阻止与一个相似但应放行的固定例，另覆盖所有 main-frame 顶层导航放行。
- DOM fixture 覆盖静态悬浮/插屏/带关闭控件广告、广告 iframe、关联遮罩、动态插入和恢复；保护反例覆盖正文、导航、登录、OTP、CAPTCHA、支付、安全提示、cookie 选择、付费墙，以及 fixed/dialog/popup/ad-class 单信号诱饵。
- 真实票内验收按 install、native action、该票 primary flow、reopen 记录；最终独立验收再覆盖总开关、本站暂停/恢复、刷新后的网络变化、允许清单设置、动态广告、保护反例和重开持久化。
- 公开抽检匿名执行，不登录、不提交表单、不购买：ABP Test Pages 验证声明支持的子集；普通公开网站验证正文、导航与基础操作未见严重误伤。
- 每次正式构建执行类型检查、单元/DOM 测试、规则结构检查和完整 build。每票与最终候选以固定 Git 基线执行 Standards/Spec 双轴 code-review，未提交新文件必须进入差异。
- 最终候选从 `source/.output/chrome-mv3` 复制到新的 `extension/`，核对内容，再计算 candidate 指纹；浏览器证据与截图完成后运行 `acceptance_gate.py` 和 `release_bundle.py`。

## Out of Scope

- 全网 100% 无广告、零误伤、所有页面元素过滤语法或完整 EasyList/uBO 能力。
- EasyList、EasyPrivacy、Fanboy、ABP 测试订阅或其他第三方列表的复制、打包、远程订阅与自动更新。
- 用户自定义规则、procedural selectors、scriptlets、远程脚本、页面 JavaScript 改写、响应体或请求头改写。
- 自动点击任意关闭/确认按钮；绕过登录、验证码、安全提示、cookie 选择、付费墙或反广告拦截。
- 顶层导航阻断、同域内联/服务端广告完整识别，以及网页 Service Worker 从 CacheStorage 自行生成响应的保证。
- 账号、云同步、遥测、远端服务、Chrome Web Store 材料/注册/上传/提交、GitHub 或其他远端。

## Further Notes

- 一手证据和许可证边界见 `research/verified-primary-sources.md`。首版生产规则完全自有，因此不产生第三方列表许可证继承；后续若采用任何第三方规则须逐条记录来源与许可。
- “页面已隐藏”是本扩展标记的 DOM 数量；“网络保护”只表达 DNR 规则集是否启用，不伪造无法在生产权限下可靠取得的阻断计数。
- 本规格的测试 seam、tracker、框架、票粒度与依赖属于用户明确授权本会话自行决定的可逆技术事项，无需再次采访。
