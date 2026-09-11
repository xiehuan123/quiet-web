# 广告净化：一手资料核验与首版范围

核验日期：2026-09-11（Asia/Shanghai）

## 结论摘要

首版应定位为“减少常见广告请求，并隐藏高置信广告容器”，而不是“全网 100% 无广告”。实现采用两层：随扩展打包的小规模静态 DNR 网络规则；运行在页面隔离环境中的、可撤销的 DOM/CSS 过滤。总开关和精确 hostname 允许清单持久化；暂停本站后立即恢复本扩展隐藏的 DOM，网络请求是否恢复则以刷新后的真实加载为准，并在界面明确提示。

首版不导入 EasyList 或其他第三方过滤列表，不下载远程规则，不执行远程代码；仅维护项目自有、逐条可解释且有负例保护的少量规则。ABP Test Pages 只作为公开兼容性测试目标，其官方测试订阅明确标注不可用于生产。

## 已核实的一手事实

### 1. Chrome DNR：能力、规则生命周期与硬边界

- `chrome.declarativeNetRequest` 通过声明式规则阻止或修改网络请求，扩展无需拦截并查看请求内容；支持 `block`、`allow`、`allowAllRequests`、重定向、协议升级及请求/响应头修改。[Chrome DNR API](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest)
- 静态规则随扩展打包，并在安装或升级时安装/更新；动态规则由 JavaScript 管理，跨浏览器会话和扩展升级保留；会话规则在浏览器关闭或扩展更新时清除。[Chrome DNR：Rules and rulesets](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#rules-and-rulesets)
- `updateDynamicRules()` 是原子更新：指定的移除和新增要么全部成功，要么返回错误且规则集不变；动态规则也明确跨会话、跨扩展升级保留。[Chrome DNR：updateDynamicRules](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#method-updateDynamicRules)
- 同一扩展内，相同优先级时 `allow` / `allowAllRequests` 优先于 `block`；需要稳定排序时应显式设置不同优先级。`allowAllRequests` 作用于一个 frame hierarchy，条件的 `resourceTypes` 必须指定且只能包含 `main_frame`、`sub_frame`。[Chrome DNR：Rule evaluation](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#rule-evaluation)、[Chrome DNR：RuleActionType](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#type-RuleActionType)、[Chrome DNR：RuleCondition](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#type-RuleCondition)
- 当前官方文档列出的主要配额是：最多声明 100 个静态规则集，同时启用 50 个，保证至少 30,000 条静态规则；会话规则最多 5,000 条；Chrome 121 起安全动态规则上限 30,000 条，非安全动态规则上限 5,000 条并计入前者；每种规则类型最多 1,000 条正则规则，单条正则编译后须小于 2 KB。[Chrome DNR：Rule limits](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#rule-limits)
- `testMatchOutcome()` 可对假想请求检查本扩展规则的匹配结果，但仅供未打包扩展的开发阶段使用；`isRegexSupported()` 可在使用前验证正则是否被 DNR 支持。[Chrome DNR：testMatchOutcome](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#method-testMatchOutcome)、[Chrome DNR：isRegexSupported](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#method-isRegexSupported)
- DNR 只影响到达网络栈的请求。它覆盖 HTTP cache 的响应，但不一定覆盖网页 Service Worker 的 `fetch` handler；不会影响由网页 Service Worker 自行生成或从 `CacheStorage` 取出的响应，但会影响该 Service Worker 发起的 `fetch()`。[Chrome DNR：Interactions with service workers](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#interactions-with-service-workers)
- Chrome 官方把网络过滤和页面元素过滤明确分开：网络请求主要用 DNR；页面元素隐藏通过 content script 修改 DOM 完成。[Chrome：Content filtering](https://developer.chrome.com/docs/extensions/develop/concepts/content-filtering)

据此确定：本站暂停的网络例外可以使用高优先级动态 `allowAllRequests` 规则并按精确 hostname 建模，但新增规则只影响之后发生的请求，无法“找回”本次页面已经被阻止的响应，所以界面必须提示刷新。任何实现都不能把 DNR 计数等同于“广告元素数量”，也不能声称覆盖同域内联广告、服务端渲染广告或 `CacheStorage` 已生成内容。

### 2. Content scripts、service worker、storage 与权限

- content script 可读取和修改网页 DOM，并与扩展其他部分通信；默认运行在隔离环境中，脚本变量不会暴露给页面或其他扩展，但双方仍共享页面 DOM。[Chrome：Content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)、[Chrome：Work in isolated worlds](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#work-in-isolated-worlds)
- 静态 content script 通过 manifest 的 `content_scripts` 声明，所有自动运行的脚本都必须给出 `matches`；程序化注入则需要页面 host permission，或用户手势授予的 `activeTab`，并使用 `scripting`。[Chrome：Inject scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#inject-scripts)
- MV3 extension service worker 是中心事件处理器，按需加载、休眠时卸载且不能直接访问 DOM。[Chrome：About extension service workers](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers)
- Chrome 通常会在约 30 秒无活动后终止 service worker；全局变量会随终止丢失，官方要求把需要保留的值写入 storage，而不是依赖内存全局状态。[Chrome：Extension service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle#idle-shutdown)
- `chrome.storage` 可由 service worker 和 content script 使用，是异步、扩展专用的持久化存储；清除浏览器缓存和浏览历史不会清除这些数据。`storage.local` 在卸载扩展时清除，当前配额为 10 MB；使用该 API需在 manifest 声明 `storage` 权限。[Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)
- Chrome 将 API 权限、`content_scripts.matches`、host permissions 和 optional permissions 分开声明；`content_scripts.matches` 或 host permission 范围变化可能触发权限警告，官方建议在功能允许时使用可选权限并限制授权范围。[Chrome：Declare permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)
- `declarativeNetRequest` 与 `declarativeNetRequestWithHostAccess` 能力相同，但授权方式不同：前者安装时显示权限警告，并对 `block`、`allow`、`allowAllRequests` 提供隐式主机访问；后者本身不显示该安装警告，但执行动作前必须另有相应 host permission。[Chrome DNR：Permissions](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#permissions)
- MV3 的后台环境改为按需运行的 service worker，并禁止扩展执行远程托管代码；可执行 JavaScript 应随扩展包提供。[Chrome：Manifest V3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)

据此确定：首版用静态 content script 覆盖实际支持的 HTTP/HTTPS 页面，不需要为该路径再申请 `scripting`；用 `storage.local` 保存总开关与精确 hostname 允许清单；service worker 每次事件处理都从持久化状态恢复，不能依赖常驻后台或未持久化全局变量。由于产品目标是常见网站上的无感处理，广泛页面匹配属于真实功能需要，但 manifest 和中文说明必须如实说明“读取并修改网页内容”的作用；不申请与首版无关的 `tabs`、`cookies`、`webRequest`、`unlimitedStorage` 等权限。

### 3. uBO Lite 与 Trusted Sites 提供的产品边界证据

- uBO Lite 官方 FAQ 说明：默认模式没有通用 cosmetic filtering；许多成熟过滤语法无法转换为 DNR，因此与完整 uBO 相比，处理反内容拦截和减少网站破损的能力有限。[uBO Lite FAQ](https://github.com/uBlockOrigin/uBOL-home/wiki/Frequently-asked-questions-%28FAQ%29)
- uBO Lite 的权限说明把 `declarativeNetRequest` 用于网络请求决策，把 `scripting` 用于 DNR 单独无法完成的 CSS/JS 高级页面过滤，并用 `storage.local` 跨浏览器启动持久化用户设置。[uBO Lite：Justification for the declared permissions](https://github.com/uBlockOrigin/uBOL-home/wiki/Justification-for-the-declared-permissions)
- uBO 的 Trusted Sites 文档说明，当前网站关闭过滤会将其加入 Trusted sites，且再次访问时仍记住该状态；文档同时展示 hostname、URL、通配符和正则等不同范围，并警告正则例外很容易停用超出预期的网站。[uBO：How to mark a web site as trusted](https://github.com/gorhill/uBlock/wiki/How-to-mark-a-web-site-as-trusted)

据此确定：首版允许清单只接受经 URL 解析得到的精确 `hostname`，界面直接展示这个范围，不开放通配符或正则；页面暂停后立即撤销本扩展产生的隐藏效果并停止新的过滤，刷新后再验证网络层恢复。uBO/uBOL 只作为能力边界和交互先例，不复制其代码或规则。

### 4. ABP 官方测试页的正确用途

- ABP Test Pages 官方首页说明它用于测试 Adblock Plus 功能，并提供 blocking、element hiding、DOM mutation、资源类型、例外、扩展选择器、snippet 与 Service Worker 等多类测试；它同时明确写明测试订阅不应用于生产。[ABP Test Pages](https://abptestpages.org/)
- Basic Blocking 页面覆盖完整路径、部分路径、通配路径、动态插入资源及深层子域等案例；Element Hiding 页面覆盖 ID、class、后代、兄弟和属性等普通 CSS 选择器；DOM Mutation 页面用于测试变化后出现的元素。[ABP：Blocking](https://abptestpages.org/en/filters/blocking)、[ABP：Element Hiding](https://abptestpages.org/en/filters/element-hiding)、[ABP：Hide on DOM Mutation](https://abptestpages.org/en/filters/hide-on-DOM-mutation)
- 官方首页链接到 eyeo 自有 GitLab 项目；项目说明其内容用于生成测试站点。GitHub 上的 `adblockplus/testpages.adblockplus.org` 也公开说明网站内容由仓库文件自动生成，并提供本地/容器化测试方式。[eyeo GitLab：testpages.adblockplus.org](https://gitlab.com/eyeo/developer-experience/testpages.adblockplus.org)、[Adblock Plus GitHub mirror](https://github.com/adblockplus/testpages.adblockplus.org)

据此确定：只为首版明确支持的普通 DNR URL 匹配、普通 CSS 选择器和受限动态插入建立测试映射。Extended Selectors、snippet、remove、CSP、rewrite、popup API 等不属于首版，不能把这些测试的失败算进“已支持功能”，也不能把官方测试订阅放入生产规则。

### 5. EasyList 许可证结论

- EasyList 官方许可页写明：除非另有说明，EasyList 仓库内容可选择按 GPL v3 或任何后续版本，或 CC BY-SA 3.0 Unported 或任何后续版本使用/修改；需要时来源署名为 “The EasyList authors”。仓库引用的外部文件可能适用其他条件，必须由对应权利人授权。[EasyList 官方许可页](https://easylist.to/pages/licence.html)
- EasyList 官方仓库说明其覆盖网络广告、CSS cosmetic filtering、弹窗/背投与非小型占位等，并维护网站破损、直接链接和渲染误报；这也说明成熟规则集需要持续维护，而不是一次复制即可长期可靠。[EasyList 官方仓库](https://github.com/easylist/easylist)

许可证决定：首版不复制、改编或打包 EasyList/EasyPrivacy/Fanboy 列表，也不引用仓库所指向的外部订阅，因此首版生产规则不存在来自这些列表的许可证继承问题。若后续逐条采用其中内容，必须先记录具体文件、提交版本和规则来源，选择并履行 GPL 或 CC BY-SA 的完整条款，并另行核查外部引用文件的权利；不能把“公开可访问”或“写了署名”当成已经满足许可。此处是工程合规边界记录，不构成法律意见。

## 有证据的首版范围

### 包含

1. 随扩展打包、版本更新时一起更新的小规模静态 DNR 规则；规则只针对已知广告服务主机或足够具体的广告资源路径，并限制到必要的子资源类型，不阻止 `main_frame` 顶层导航。
2. 页面层只隐藏高置信候选：候选须命中明确的广告语义/已知广告资源/受控站点结构等至少两个独立信号，并在保护检查通过后才处理。`position: fixed`、尺寸、overlay、`role=dialog`、类名含 `ad`/`popup` 中任何单一信号都不得触发删除或隐藏。
3. 保护正文、导航、登录、密码、OTP、CAPTCHA、支付/checkout、安全/风控提示、cookie/隐私选择、付费墙和内容访问门控；不绕过安全确认或付费墙。
4. 使用扩展专属属性和样式隐藏，不从 DOM 删除；记录并只撤销本扩展自己的改动。暂停或关闭后，当前页面的 DOM 改动应立即恢复。
5. 对动态插入使用 `MutationObserver`，只处理新增子树，合并/节流任务并限制单批节点量；不在每次 mutation 时扫描全页。
6. 提供总开关、精确 hostname 的本站暂停/恢复、当前状态与刷新提示；设置通过 `storage.local` 持久化，重启后仍有效。网络过滤状态变更后以刷新作为完整恢复/重新阻断的验收步骤。
7. 生产包不联网获取规则或脚本，不包含第三方整包列表；所有规则有项目内说明、唯一 ID、资源类型边界及正反例。

### 不包含

- “全网 100% 无广告”“零误伤”或对所有站点有效的承诺。
- 通用宽泛 DOM 删除、仅凭布局/类名猜测广告、自动点击任意关闭/确认按钮。
- 反付费墙、反安全验证、反 CAPTCHA、反登录门控或反内容拦截脚本。
- ABP Extended Selectors、procedural cosmetic filtering、snippet、页面脚本改写、响应体改写。
- 用户自定义规则、远程订阅、自动下载/编译第三方列表、规则云更新。
- `main_frame` 阻断、宽泛关键词 URL 规则、请求/响应头修改、WebSocket/CSP 等高级过滤。

## 首版验收重点

- DNR：用少量但完整的固定正例/负例覆盖每条生产规则和关键资源类型，负例包含相似合法 URL 与全部顶层导航；开发态用 `testMatchOutcome()` 记录命中规则 ID，有正则时先调用 `isRegexSupported()`。
- DOM：至少覆盖静态高置信广告、悬浮/插屏广告、广告遮罩、动态插入广告；反例覆盖正文、导航、登录、OTP、CAPTCHA、支付、安全提示、cookie 选择、付费墙，以及只有 fixed/dialog/popup 类名单一信号的诱饵。
- 恢复：开启时过滤；暂停本站后 DOM 立即恢复并停止继续处理；界面提示刷新；刷新后网络请求恢复；重新启用并刷新后再次阻断；关闭并重开浏览器后允许清单仍保留。
- 公开抽检：ABP Test Pages 仅验证已声明支持的 basic blocking、普通 element hiding 和受限 DOM mutation 子集；再选择少量匿名可访问的真实普通网站观察正文、导航和基础交互是否完整。不登录、不提交表单、不购买。
- 报告必须分开记录“已阻止网络请求”“已隐藏 DOM 元素”“范围外/未验证”，并保留截图与原始自动化工具记录；计数不能替代页面效果和误伤检查。

## 2026-09-12 动态允许规则复核

再次核对 Chrome 官方 DNR API：`allowAllRequests` 会允许匹配 frame hierarchy 内的请求，条件必须指定且只能使用 `main_frame`/`sub_frame` 资源类型；高于 block 规则的开发者优先级会使较低优先级规则不再生效。`updateDynamicRules()` 的单次 remove/add 是原子的，动态规则跨浏览器会话和扩展升级持久化。[Chrome DNR API](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest)

据此，本站暂停使用优先级 100 的 `allowAllRequests` 动态规则，只让精确 hostname 的 HTTP(S) frame URL 正则匹配；不使用会自动覆盖子域名的 `initiatorDomains`。扩展每次以保留 ID 范围整体重建自身站点规则，并在持久设置写入失败时恢复上一个动态规则集合。

## 一手来源索引

1. [Chrome DNR API](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest)
2. [Chrome Content filtering](https://developer.chrome.com/docs/extensions/develop/concepts/content-filtering)
3. [Chrome Content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
4. [Chrome Extension service workers](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers) 与 [生命周期](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
5. [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)
6. [Chrome Declare permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)
7. [Chrome Manifest V3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
8. [uBO Lite FAQ](https://github.com/uBlockOrigin/uBOL-home/wiki/Frequently-asked-questions-%28FAQ%29) 与 [权限说明](https://github.com/uBlockOrigin/uBOL-home/wiki/Justification-for-the-declared-permissions)
9. [uBO Trusted Sites](https://github.com/gorhill/uBlock/wiki/How-to-mark-a-web-site-as-trusted)
10. [ABP Test Pages](https://abptestpages.org/) 与 [官方项目](https://gitlab.com/eyeo/developer-experience/testpages.adblockplus.org)
11. [EasyList 官方许可证](https://easylist.to/pages/licence.html) 与 [官方仓库](https://github.com/easylist/easylist)
