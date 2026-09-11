# Chrome MV3 广告过滤：首版边界与验收建议

调研日期：2026-09-11

## 结论

首版应定位为“减少常见广告与跟踪请求，并自动隐藏高置信的悬浮、插屏和确认式广告”，同时允许用户按站点暂停；不要承诺“清除所有广告”或“100% 过滤”。实现上分两层：打包随扩展发布的静态 DNR 网络规则，加少量动态例外规则保存站点暂停状态；页面层使用打包的域限定选择器和多信号判定，只隐藏可安全回退的候选元素。

页面层不能用 `position: fixed`、遮罩、`role="dialog"` 或名称含 `popup` 等单一特征直接删除元素。它必须先排除登录、密码、OTP、CAPTCHA、支付、checkout、`alertdialog`、安全提示、正文和付费墙，再由至少两个广告信号确认，隐藏前记录原状态，暂停时完整恢复。这样能覆盖用户核心目标，也把误伤和恢复能力纳入首版设计。

## 一手资料发现

1. Chrome 的 `declarativeNetRequest`（DNR）在浏览器网络栈中按声明式规则阻止、放行、重定向或改写请求，扩展本身无需读取请求内容。静态规则随扩展安装和升级；动态规则可在运行时更新，并跨浏览器会话和扩展升级保留。动态更新是原子操作，失败时整批不生效。[Chrome DNR 官方文档](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest)
2. DNR 有明确配额。当前文档列出：最多声明 100 个静态规则集、同时启用 50 个，保证至少 30,000 条静态规则；会话规则上限 5,000；Chrome 121 起安全动态规则的较大上限为 30,000；每类正则规则最多 1,000 条，单条正则编译后还须小于 2 KB。实际开发不能把“能导入一份列表”当成“所有规则都会生效”。[Chrome DNR 官方文档](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#rule-limits)
3. 权限有取舍：`declarativeNetRequest` 对 `block`、`allow`、`allowAllRequests` 提供隐式主机访问，但安装时会显示权限警告；`declarativeNetRequestWithHostAccess` 本身不显示该安装警告，但执行动作前必须另有相应主机权限。首版只做网络阻断时，应避免为了未来功能提前索取页面读写权限。[Chrome DNR 官方文档](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#permissions)
4. 网络过滤与 cosmetic filtering 是两层能力。uBO Lite 维护者说明，其网络规则编译为 DNR，而 cosmetic/scriptlet 规则需要单独注入；默认模式没有通用 cosmetic filtering，且许多成熟过滤语法无法转换成 DNR，所以 MV3 版本处理反拦截和减少站点破损的能力仍受限。其权限说明也明确把 CSS/JS 页面注入用于 DNR 单独无法完成的高级过滤。[uBO Lite FAQ](https://github.com/uBlockOrigin/uBOL-home/wiki/Frequently-asked-questions-(FAQ))、[uBO Lite 权限说明](https://github.com/uBlockOrigin/uBOL-home/wiki/Justification-for-the-declared-permissions)
5. 成熟过滤器把“当前站点暂停”作为恢复误伤的基础能力。uBO 的操作会把当前站点加入 Trusted sites，并记住状态；其文档也提醒，过宽的通配符或正则会意外停用更多站点。首版应优先使用精确主机名，并让用户能查看、恢复和删除例外。[uBO Trusted sites 文档](https://github.com/gorhill/uBlock/wiki/How-to-mark-a-web-site-as-trusted)
6. Adblock Plus 维护了一组公开测试页面及其源代码，可用于验证网络阻断、元素隐藏等能力；该项目也支持在本地运行同一套页面。它适合作为外部一致性检查，但不能代替本项目自己的固定 fixtures。[ABP Test Pages](https://abptestpages.org/)、[测试页官方仓库](https://github.com/adblockplus/testpages.adblockplus.org)
7. EasyList 的维护目标明确包含通用及站点特定 CSS cosmetic filtering、弹窗/背投、较大占位和插入页面的广告元素，同时维护者会处理网站破损、渲染问题等误报。这说明 cosmetic 层有价值，也说明规则必须持续审核和处理兼容性反馈。[EasyList 官方仓库 README](https://github.com/easylist/easylist)
8. EasyList 仓库内容除非另有说明，采用 GPL-3.0-or-later 与 CC-BY-SA-3.0-or-later 双许可，可任选其一使用或修改，并在要求时归属 EasyList 作者；仓库引用的外部文件可能有不同条件，须另向权利人取得许可。因此不能把第三方清单未经审查直接复制进扩展，选用规则前须确认来源、记录归属并履行所选许可证的同许可等义务。[EasyList 官方许可页](https://easylist.to/pages/licence.html)

以上实际使用 5 组高价值一手来源：Chrome DNR；uBO Lite FAQ 与权限说明；uBO Trusted sites；ABP Test Pages；EasyList README 与许可页。

## 建议的首版范围

### 包含

- 使用随扩展打包的静态 DNR 规则，优先采用 `block` 等安全动作；按图片、脚本、XHR、子框架等资源类型约束规则，避免宽泛字符串匹配。
- 规则更新跟随扩展版本发布；首版不在后台下载或执行远程规则。
- 弹窗显示启用状态和本页被阻止的请求数，文案明确为“已阻止的请求”，不把它写成“已清除的广告数”。
- 页面层只加载随扩展打包、经过人工审核且按域限定的选择器；自动处理顶部/底部悬浮广告、全屏插屏、带确认/关闭步骤的广告和它们留下的较大占位。
- DOM 候选必须同时命中域限定规则，并满足至少两个独立广告信号，例如：明确的“广告/赞助”语义、已知广告资源或 iframe、域特定广告容器结构、广告专用关闭控件、与广告容器同时出现的遮罩。位置、尺寸、遮罩、`role="dialog"`、类名/ID 含 `popup` 中任何一项都不能单独触发隐藏。
- 设置否决保护：候选只要包含或位于登录、密码、OTP、CAPTCHA、支付、checkout、`alertdialog`、安全/风控提示、`main`/`article` 正文、付费墙或内容访问门控中，就不得自动隐藏。
- 隐藏前记录候选的 `style`、`hidden`、`aria-hidden` 及扩展添加的标记；优先通过扩展专属属性和样式表隐藏，不从 DOM 删除。恢复时只撤销本扩展的变更，不覆盖页面在此期间自行发生的其他变更。
- 动态新增广告可用 `MutationObserver` 监听，但只观察已登记的域特定候选根节点或新增子树；批量、节流处理并限制单批扫描节点数，禁止每次变动重扫整个 `document`。
- 提供“在此站点暂停/恢复”。暂停状态用少量动态例外规则保存，必须在重启后仍然有效；页面层应立即恢复全部被本扩展隐藏的元素并停止观察，网络层恢复需要刷新页面，界面须明确提示“刷新后恢复网络请求”。
- 例外默认按精确 hostname 生效。若以后支持整个站点及子域，界面需明确展示范围。
- 所有规则在打包前做格式、ID 唯一性、配额和正则支持检查；开发态可用 `testMatchOutcome()` 检查假想请求的匹配结果。
- 页面自动处理需要相应主机访问权限。权限范围应与首版实际支持的域一致；如果产品选择广泛网站覆盖，必须如实解释页面读写权限，而不能只按未来计划提前申请。
- 对任何引用或改编的第三方过滤规则保留来源、版本/提交、选用理由和许可证记录；进入生产规则前逐条复核语义、误伤和许可，不直接复制未确认权利状态的聚合清单。

### 不包含

- 无域限定的通用 cosmetic 选择器、程序化 cosmetic selectors、scriptlets、页面脚本改写、反广告拦截绕过。
- 用户自定义过滤器、第三方远程订阅、自动抓取或编译在线列表。
- 拦截顶层导航、宽泛的关键词规则，或需要修改请求/响应头的高级规则。
- “100% 无广告”“所有网站有效”“零误伤”等承诺。

后续版本可以在误伤数据充分时扩大域覆盖或支持更强的 procedural cosmetic 能力。首版不要把任意脚本注入伪装成“元素隐藏”，也不要通过广泛 DOM 删除来追求表面拦截率。

## 验收设计

### 1. 本地 fixtures：确定性回归门槛

建立版本化、本地可重复的测试资料，不依赖真实广告服务是否在线：

- `network-cases.json` 至少包含 60 个应阻止请求和 60 个必须放行请求，覆盖图片、脚本、XHR、子框架、媒体及相似但合法的 URL；顶层导航全部列为必须放行。用开发态 `testMatchOutcome()` 对每例记录命中的规则 ID。
- `page-fixtures/positive/` 至少包含 12 个应隐藏案例：顶部/底部悬浮广告、全屏插屏、确认式广告、广告 iframe、较大空占位，以及在 SPA 路由或延迟加载后动态插入的广告。每例均须满足域限定选择器和至少两个广告信号。
- `page-fixtures/protected/` 至少包含 20 个必须保留案例：登录框、密码/OTP、CAPTCHA、支付与 checkout、`alertdialog`、安全/风控提示、cookie/隐私选择、正文、付费墙、站内订阅门控、导航、视频控件和普通弹窗；另外为 `fixed`、overlay、dialog、类名含 `popup` 分别准备只命中单一特征的诱饵元素。
- 动态 DOM fixture 在允许的候选根节点内和外同时插入元素，验证观察器只检查限定子树、节流批处理，并且单一特征或保护区域中的节点绝不隐藏。
- `pause-resume` fixture 验证：开启时网络与页面过滤生效；暂停当前 hostname 后页面元素立即恢复原 `style`/`hidden`/`aria-hidden` 状态且观察器停止；界面提示刷新；刷新后网络请求恢复；重新启用并刷新后恢复阻断；关闭并重开浏览器后暂停状态仍在。
- 规则安装验证：静态规则文件无错误/警告；动态规则更新失败时旧规则集保持不变；每条正则先通过 `isRegexSupported()`。

硬门槛：

| 指标 | 首版通过线 |
| --- | --- |
| fixtures 应阻止用例命中率 | 100% |
| fixtures 必须放行用例正确率 | 100%，即 0 个误阻断 |
| 12 个正向 cosmetic fixture 隐藏率 | 100% |
| 20 个保护 fixture 误隐藏率 | 0% |
| 严重误伤 | 0 |
| 暂停后 DOM 原状态恢复率 | 100%，且无需刷新 |
| 暂停后网络恢复 | 刷新后 100% 恢复，并显示刷新提示 |
| 动态候选子树与节流边界 | 全部通过；候选根之外 0 次隐藏 |
| 所有页面的匿名核心任务 | 100% 可完成 |
| 暂停、恢复、重启持久化 | 全部通过 |
| 无效规则、重复 ID、超配额、超复杂正则 | 0 |

只有同时满足域限定规则和多信号判定的较大空广告容器才可隐藏。其余空白应作为已知限制保留；验收报告必须明确标注，产品界面也不能把它统计成 cosmetic 清理成功。

### 2. 公开页面：真实性与误伤抽检

公开页面测试只使用匿名可访问内容，不登录私人账号、不提交表单、不购买、不上传、不发布：

1. 在最新版稳定 Chrome 的干净测试配置中，只安装待测扩展。
2. 先在 [ABP Test Pages](https://abptestpages.org/) 运行 `blocking`、`element-hiding`、`hide-on-DOM-mutation` 三类页面。首版要求这三类中声明支持、且能用域限定静态选择器或受限动态观察表达的子集全部通过；未支持的 procedural/scriptlet 用例单独列为范围外。若要映射测试规则，应使用仅用于测试的打包规则集，不能把测试规则混进生产规则。
3. 再维护一个 20 个公开 URL 的固定样本，覆盖新闻、博客、视频、工具、文档、电商商品详情等匿名页面。每次记录测试日期、Chrome 版本、扩展版本、URL、页面截图、控制台错误和网络结果。
4. 每个页面分别在“未启用扩展”“启用”“本站暂停”三种状态下冷启动加载。执行阅读正文、站内导航、播放公开视频、展开菜单、搜索公开内容、下载公开文件等匿名任务。
5. 对失败用例重复三次。页面本身变更或服务不可用时，标记为环境失效并替换样本；不要为了单次波动立即扩大 allowlist。

公开样本门槛：

| 指标 | 计算方式 | 首版通过线 |
| --- | --- | --- |
| 支持子集一致性 | ABP `blocking` 中通过的已支持用例 / 已支持用例总数 | 100% |
| cosmetic 支持子集一致性 | ABP `element-hiding`、`hide-on-DOM-mutation` 中通过的已支持用例 / 已支持用例总数 | 100%；范围外用例单列，不得把残留元素计为已清理 |
| 已知广告请求阻断率 | 被阻断的基线已知广告请求 / 基线已知广告请求总数 | ≥ 90% |
| 明显广告减少页比例 | 启用后首屏明显广告少于基线的页面 / 有广告基线页面 | ≥ 80% |
| 严重误伤页比例 | 正文不可读、导航失败、视频无法播放等页面 / 20 | 0% |
| 轻微误伤页比例 | 非核心布局异常或次要功能异常页面 / 20 | ≤ 5%（最多 1 页） |
| 暂停恢复率 | 暂停后恢复到基线核心功能的误伤页 / 全部扩展致误伤页 | 100% |

“明显广告减少”必须由前后截图和网络记录共同佐证，不能只看拦截计数。计数高不代表视觉效果好，也不代表没有误伤。

## 为什么不能承诺 100% 过滤

- DNR 只处理到达网络栈且能被规则表达的请求；网页自身或 Service Worker 从 `CacheStorage` 生成的响应不一定受其影响。
- 广告可能与正文同域、内联在 HTML、服务端渲染、运行时拼接，或使用首版不支持的规则语义。
- 网络阻断不会自动隐藏广告容器；首版 CSS/DOM 层只处理经域限定、多信号确认且不在保护区域内的元素，完整的 procedural cosmetic/scriptlet 能力仍不在范围内。
- DNR 有规则数、正则数和正则复杂度限制，并且其他扩展会影响超过保证额度后的可用静态规则数量。
- 规则列表会老化，真实网站会改版，也会主动检测内容拦截器。公开页面成绩只能代表某个版本、某组样本和某个测试日期。

对外建议使用“减少常见广告与跟踪请求”“可随时在当前站点暂停”等可验证表述，并在帮助页说明同域广告、空白占位和网站兼容性限制。

## 来源（5 组）

1. [Chrome Developers：chrome.declarativeNetRequest](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest)
2. uBlock Origin Lite：[Frequently asked questions](https://github.com/uBlockOrigin/uBOL-home/wiki/Frequently-asked-questions-(FAQ))、[Justification for the declared permissions](https://github.com/uBlockOrigin/uBOL-home/wiki/Justification-for-the-declared-permissions)
3. [uBlock Origin：How to mark a web site as trusted](https://github.com/gorhill/uBlock/wiki/How-to-mark-a-web-site-as-trusted)
4. [Adblock Plus Test Pages](https://abptestpages.org/)（[官方仓库](https://github.com/adblockplus/testpages.adblockplus.org)）
5. EasyList：[官方仓库 README](https://github.com/easylist/easylist)、[官方许可页](https://easylist.to/pages/licence.html)
