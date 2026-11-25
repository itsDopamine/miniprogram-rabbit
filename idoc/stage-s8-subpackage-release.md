# 阶段 S8 · 分包与上线测试准备

> 状态：**2026-11-25 建立任务书，业务代码未改**。S0–S7 代码已落地；本阶段只做分包、性能收尾与上线测试准备。
> 工时：1.5 天 · 前置：S7 结算 / 订单 / 支付
> 协作方式：默认「我讲你写」——每次只推进一个小步，先讲概念和依据，再给可验收任务；纯样板壳子可代写，但会明确说明。
> 关联：[`03-roadmap.md`](./03-roadmap.md) S8、[`assignments.md`](./assignments.md) G9、[`checklist.md`](./checklist.md) M8、[`stage-s7-order-pay.md`](./stage-s7-order-pay.md)

---

## 1. 学习目标

- 说清「为什么要分包」：主包 / 单分包 2M、总包 20M 的硬限制，以及分包不解决「主包里公共依赖过大」的问题
- 会判断哪些页面**必须留主包**（tabBar 页）、哪些可以搬进分包
- 会做「搬页面 → 改绝对路径 → 跑全链路」这套最小闭环，而不是只改 `app.json`
- 知道 `preloadRule` 解决的是「进入分包前的等待」，不是「包变小」
- 会给长列表图片开 `lazy-load`，会用数据路径做局部 `setData`
- 能把体验版上传所需的域名、包体、回跳链路三项检查做完

---

## 2. 两条路线：先选走哪条

| 路线 | 做法 | 适合 |
| --- | --- | --- |
| **A 先上线测试，再分包** | 不改页面路径，先按当前 17 页全主包上传体验版，验证域名 / 登录 / 下单链路 | 只想先在手机上看看效果；前提是开发者工具「代码依赖分析」显示主包 < 2M |
| **B 完整 S8** | 先分包，再做性能项，最后上传体验版 | 本阶段正式收尾，目标 M8 |

> 本项目原始计划走 **B**。但「准备上线测试一下」可以先做 A 的前置检查：它不需要改代码，且能尽早暴露合法域名 / appid 这类环境问题。

**本阶段默认推进顺序**：Step 0（基线 + 上线前置检查）→ Step 1（分包，先拿详情页试水）→ Step 2（全量路径）→ Step 3（可选预下载）→ Step 4（性能）→ Step 5（体验版验收）。

---

## 3. 配置与事实（必须可溯源）

| 级别 | 事实 | 来源 |
| --- | --- | --- |
| A 官方 | `app.json` 用 `subPackages` 声明分包；`root` 是分包根目录，`pages` 相对 `root`；主包页面仍在最外层 `pages` | 微信开放文档《使用分包》<https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/basic.html> |
| A 官方 | tabBar 页面必须在主包；分包可引用主包 JS / 组件 / 资源，不能引用其它分包 | 同上 |
| A 官方 | 整个小程序所有分包 ≤ 20M，单个分包 / 主包 ≤ 2M，分包数量无限制 | 同上 |
| A 官方 | `preloadRule` 在 `app.json`；key 是页面路径；`packages` 必填（填分包 `root` 或 `name`，`__APP__` 是主包）；`network` 可选，`all` / `wifi`，默认 `wifi` | 微信开放文档《分包预下载》<https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/preload.html> |
| A 官方 | `image` 的 `lazy-load` 默认 `false`，在即将进入上下三屏时加载；仅对 `page` / `scroll-view` 下的 `image` 有效；基础库 1.5.0 起支持 | 微信开放文档《image 组件》<https://developers.weixin.qq.com/miniprogram/dev/component/image.html> |
| A 官方 | `setData` 应控制频率、只传渲染相关字段、避免整棵大对象 / 大数组、后台页面不再 `setData`、局部字段用路径更新 | 微信开放文档《合理使用数据更新方法》<https://developers.weixin.qq.com/miniprogram/dev/framework/performance/tips/runtime_setData.html> |
| A 官方 | `wx.request` 域名需在小程序管理后台配置 `request` 合法域名；工具勾选「不校验合法域名」只对开发者工具有效，体验版 / 正式版仍校验 | 微信开放文档《网络》<https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html> |
| B 工具产物 | `project.config.json`：`miniprogramRoot: "miniprogram/"`、`libVersion: "2.32.3"`、`ignoreUploadUnusedFiles: true`、`minified: true`（S8 开启代码压缩）、`skylineRenderEnable: false` | 本地 `project.config.json`（开发者工具配置，字段语义以工具界面为准） |
| C 实测 2026-11-25 | `git status --short` 为空，最近提交 `70a468d`；`npm run lint` 与 `npm run format:check` 均通过 | 本地命令，Windows PowerShell / Node |
| C 实测 2026-11-25 | 源码总量约 **2026.3 KB**（排除 `node_modules`）；其中 `miniprogram_npm/` **1574.2 KB**、`data/areas.js` **134.8 KB**、`pages/` **192.8 KB** | PowerShell `Get-ChildItem -Recurse -File` 累加 `Length`；未经过开发者工具的忽略未使用文件与压缩 |
| C 实测 2026-11-25 | 业务代码只引用一个 npm 组件：`tdesign-miniprogram/icon/icon`（`pages/login/login.json:4`），WXML 用到 `<t-icon>` 两处 | 本地 `Select-String` 扫描 `pages/**/*.json` 与 `*.wxml` |
| C 实测 2026-11-25 | 上传弹窗显示「编译后代码包大小：**462.8 KB**」；底部「代码质量」面板提示「小程序表现良好，未发现代码质量问题」，分组为主包 / 代码压缩 / 代码块 / 无使用或无依赖文件 / 敏感信息 | 用户截图，2026-11-25 14:33；开发者工具版本未记录，基础库 `2.32.3`（`project.config.json`） |

> **重要推论**：单纯把页面搬进分包**不会**自动缩小主包，因为 `miniprogram_npm/`、`data/areas.js`、`utils/`、`api/` 仍在主包。但开发者工具按「忽略未使用文件」打包后的官方数字只有 **462.8 KB**，远低于 2M，所以**不需要先裁剪 npm**，可以直接推进分包。你截图里的「代码质量」面板就是此版本的依赖分析入口，展开「主包」可看明细。

---

## 4. 前置知识速成

### 4.1 分包到底解决了什么

小程序启动时先下载主包。主包越大，首屏越慢，而且主包有 2M 硬上限。分包把「不是一进小程序就要用的页面」拆出去：用户点到那些页面时才下载对应分包。

它不解决三件事：

1. 主包里的公共代码（`utils/`、`api/`、组件）不会因为拆页面就变小；
2. `miniprogram_npm` 默认仍打进主包；
3. 网络请求慢、接口 500 与包体无关。

### 4.2 为什么 tabBar 四页不能搬

`app.json` 的 `tabBar.list[].pagePath` 只能指向主包页面，这是微信的硬规则。本项目要保留在主包的是：

- `pages/index/index`
- `pages/category/category`
- `pages/cart/cart`
- `pages/member/member`

其余 13 页可以整体放进一个分包 `packageGoods`。**不要为了「分得更细」拆成 3 个分包**：订单页 ↔ 地址页 ↔ 登录页互相跳，跨分包引用规则更复杂，对首次上线测试没有收益。

### 4.3 路径为什么会坏

现在所有跳转都是绝对路径 `/pages/...`，所有自定义组件都是绝对路径 `/components/...`（指向主包，合法）。页面一旦搬到 `packageGoods/pages/...`：

- 跳到这些页面的 URL 必须改成 `/packageGoods/pages/...`；
- 这些页面自己的 `.json` 里 `usingComponents` **不用改**，因为主包组件仍在 `/components/...`；
- `.js` 里的相对 `import` / `require` **也要加一级 `../`**：`../../api/search` → `../../../api/search`，否则会报 `module 'packageGoods/api/search.js' is not defined`。
- `.scss` 的 `@import` **同样加一级 `../`**：页面搬到 `packageGoods/` 后离 `miniprogram/` 根多了一层。比如 `detail.scss` 从 `../../../global.scss` 改为 `../../../../global.scss`；`login.scss` 从 `../../global.scss` 改为 `../../../global.scss`。

最容易漏的是 **`utils/request.js` 里的 `LOGIN_PAGE`**：它在主包，但登录页在分包，401 时要跳过去，常量必须同步。

### 4.4 体验版和开发者工具不是一回事

开发者工具里勾「不校验合法域名」，只影响电脑上的模拟器。手机上的体验版 / 正式版依然按小程序后台配置的合法域名校验。本项目体验版（`envVersion: 'trial'`）走 `BASE_URL_DEV`：

```
https://pcapi-xiaotuxian-front-devtest.itheima.net
```

它必须出现在小程序后台的 `request` 合法域名里，否则手机上会首屏全空。

---

## 5. Step 0 · 基线与上线前置检查

> 这一步不改业务代码；已完成的部分是实测记录，未完成的是你的小任务。

### 5.1 已记录的基线

- [x] 工作区干净，最近提交 `70a468d`
- [x] `npm run lint` 通过，`npm run format:check` 通过
- [x] `app.json` 无 `subPackages`，17 页全在主包
- [x] 体积原始数据见 §3（源码口径，非上传包体）
- [x] 开发者工具上传包体 **462.8 KB**，「代码质量」无问题（用户截图）
- [x] 后台 `request 合法域名` 已确认包含 `https://pcapi-xiaotuxian-front-devtest.itheima.net`（用户确认）

### 5.2 你的小任务（先做，不写代码）

1. 打开微信开发者工具 → 详情 → 本地设置，确认「不校验合法域名」在**开发调试时**是勾选的。
2. 菜单 **工具 → 构建 npm**，确认 `miniprogram/miniprogram_npm/tdesign-miniprogram/icon/` 存在。
3. 点顶部「编译」，在模拟器走一遍：首页 → 分类 → 详情 → 加购 → 我的 → 登录 → 购物车 → 结算 → 模拟支付 → 订单列表。
4. ~~打开调试器的「代码依赖分析」，记下主包实际大小。~~ **已完成**：这个版本入口叫「代码质量」（底部面板标签），展开「主包」看明细；上传弹窗已给出官方包体 **462.8 KB**。
5. ~~登录微信公众平台检查 `request 合法域名`。~~ **已完成**：用户已确认包含 `https://pcapi-xiaotuxian-front-devtest.itheima.net`。

**Step 0 验收**：主包官方数字 **462.8 KB**（`< 2M`），域名已确认，代码质量无问题。Step 0 完成，进入 Step 1。

---

## 6. Step 1 · 分包搬迁（我讲你写，先拿详情页试水）

### 6.1 目标结构

只搬 1 个页面，验证链路，再批量搬其余 12 个：

| 原路径 | 新路径 |
| --- | --- |
| `pages/goods/detail/detail` | `packageGoods/pages/goods/detail/detail` |

`app.json` 的目标形状（只展示结构，不是完整文件）：

```json
{
  "pages": ["pages/index/index", "pages/category/category", "pages/cart/cart", "pages/member/member"],
  "subPackages": [
    {
      "root": "packageGoods",
      "pages": ["pages/goods/detail/detail"]
    }
  ]
}
```

页面内 URL（跳转时）要写成：`/packageGoods/pages/goods/detail/detail`。

### 6.2 你的小任务

1. 在 `miniprogram/` 下新建 `packageGoods/pages/goods/`，把 `pages/goods/detail/` 整个目录剪过去，保持 `detail.js/.json/.wxml/.scss` 四件套在一起。
2. 改 `app.json`：从 `pages` 删除 `pages/goods/detail/detail`，加上面的 `subPackages`。
3. 改 `detail.scss` 第 3 行：`@import '../../../global.scss'` → `@import '../../../../global.scss'`（多了一层 `packageGoods/`）。
4. 全局搜索 `/pages/goods/detail/detail`，把**跳转目标**改为 `/packageGoods/pages/goods/detail/detail`。已知出现点：

| 文件 | 行号（改前） | 说明 |
| --- | --- | --- |
| `pages/index/index.js` | 128 | 首页商品卡进详情 |
| `pages/category/category.js` | 185 | 分类列表进详情 |
| `pages/search/search.js` | 240 | 搜索结果进详情 |
| `pages/category/sub/sub.js` | 73 | 二级分类进详情（此页稍后也会搬） |
| `pages/collect/collect.js` | 19 | 收藏列表进详情（此页稍后也会搬） |

4. 编译，从首页点一个商品进详情，确认：图片出得来、SKU 面板能选、加购成功、返回不白屏。

**Step 1 验收**：详情页可正常打开；Network / AppData 无 `page not found`；控制台无组件找不到。

> 不要一次改 13 个页面。先跑通这一个，再进入 Step 2。

---

## 7. Step 2 · 批量搬迁与全量路径回归

### 7.1 待搬的 13 页

| 域 | 页面（原路径 → 分包路径） |
| --- | --- |
| 商品 | `pages/search/search` → `packageGoods/pages/search/search` |
| 商品 | `pages/category/sub/sub` → `packageGoods/pages/category/sub/sub` |
| 商品 | `pages/collect/collect` → `packageGoods/pages/collect/collect` |
| 用户 | `pages/login/login` → `packageGoods/pages/login/login` |
| 用户 | `pages/profile/profile` → `packageGoods/pages/profile/profile` |
| 用户 | `pages/address/list/list` → `packageGoods/pages/address/list/list` |
| 用户 | `pages/address/edit/edit` → `packageGoods/pages/address/edit/edit` |
| 订单 | `pages/order/confirm/confirm` → `packageGoods/pages/order/confirm/confirm` |
| 订单 | `pages/order/pay/pay` → `packageGoods/pages/order/pay/pay` |
| 订单 | `pages/order/list/list` → `packageGoods/pages/order/list/list` |
| 订单 | `pages/order/detail/detail` → `packageGoods/pages/order/detail/detail` |
| 订单 | `pages/order/logistics/logistics` → `packageGoods/pages/order/logistics/logistics` |
| 商品 | `pages/goods/detail/detail` → `packageGoods/pages/goods/detail/detail`（Step 1 已完成） |

### 7.2 必改的路径点

| 位置 | 改成 |
| --- | --- |
| `app.json` 的 `pages` / `subPackages` | 只留 4 个 tabBar 页在 `pages`，其余进 `subPackages[0].pages` |
| `utils/request.js:11` 的 `LOGIN_PAGE` | `/packageGoods/pages/login/login` |
| `pages/cart/cart.js:241` 的 `redirect=` | 购物车是 tabBar 页，保持 `/pages/cart/cart` |
| `pages/member/member.js:34` 的 `redirect=` | `/pages/member/member` 保持不变 |
| `pages/login/login.js` 的 `redirectTo` 动态目标 | 目标可能是订单 / 地址等分包页，必须已带 `packageGoods` 前缀；`TAB_PAGES` 四个值不变 |
| 各页 JS 的 `wx.navigateTo/redirectTo/switchTab` | 按 §7.1 新路径逐个替换；`switchTab` 的 4 个 tabBar 目标不动 |
| `components/navigation-bar/navigation-bar.js:44` | 首页仍在主包，`/pages/index/index` 不动 |
| 每个已搬页面的 `.js` | 相对 `import` / `require` 统一加一级 `../`，才能指回 `miniprogram/api`、`miniprogram/utils` |
| 每个已搬页面的 `.scss` | `@import` 统一加一级 `../`，才能指回 `miniprogram/global.scss` |

### 7.3 不改的点（别顺手改坏）

- 所有页面 `.json` 的 `usingComponents`：`/components/...` 是主包组件，分包引用主包合法。
- `config/constants.js` 的 `TAB_PAGES`：四个 tabBar 页没动。
- `app.js` 的 `globalData`：`pendingCategoryId` 只在两个 tabBar 主包页之间使用，不受影响。

### 7.4 你的小任务

按「一个域一批」推进：商品域 → 用户域 → 订单域。每批搬完立刻跑对应链路：

1. 商品域：首页/分类/搜索/收藏 → 详情 → 加购；
2. 用户域：未登录点「我的」→ 登录 → 回跳；地址新增 / 编辑 / 设默认；
3. 订单域：购物车 → 结算 → 换地址 → 提交 → 模拟支付 → 订单详情 → 物流 / 取消 / 确认收货。

**Step 2 验收**：§4 端到端用户旅程（见 `checklist.md`）全过；`utils/request.js` 的 401 回跳能落到正确的分包页。

---

## 8. Step 3 · 分包预下载（可选，不要提前做）

分包搬完且链路稳定后，才考虑 `preloadRule`。本项目只有**一个**分包，预下载等于「用户一进首页就把 13 页都下载下来」，会抹掉分包的首屏收益。

建议先**不配**。真机测出「从首页点详情有明显等待」再加，且只用 WiFi：

```json
"preloadRule": {
  "pages/index/index": {
    "network": "wifi",
    "packages": ["packageGoods"]
  }
}
```

**验收**：开 WiFi 进入首页，开发者工具 Network 能看到分包资源预下载；关 WiFi 不下载。

---

## 9. Step 4 · 性能收尾

### 9.1 图片懒加载

官方 `lazy-load` 只对 `page` / `scroll-view` 下的 `image` 有效（A 级，见 §3）。本项目长列表都在 `scroll-view` 里，符合条件。

做法：在 `goods-card` 等长列表图片上加 `lazy-load="{{true}}"`，保留 `mode` 与固定宽高。因为 `goods-card` 是主包共享组件，会影响首页 / 分类 / 搜索 / 收藏 / 二级分类全部列表，改完要逐页扫一眼。

### 9.2 `setData` 最小变更

先检查两处高频路径：

- `pages/cart/cart.js`：改数量 / 勾选时是否把整个 `list` 重新 `setData`；单条变更优先用路径 `list[{{index}}].selected` 形式。
- `pages/order/list/list.js`：切 tab / 触底加载是否整表覆盖；切 tab 本就该清空重拉，但触底追加应只追加新页。

**不要为了优化去重构 SKU 算法或请求层**；本阶段只做「能测出前后差异」的改动。

### 9.3 基线记录格式

| 场景 | 优化前 | 优化后 | 记录方式 |
| --- | --- | --- | --- |
| 首页长列表滚动 | | | 开发者工具 Trace / 帧率 |
| 购物车勾选 1 项 | | | `setData` payload 截图 |
| 主包体积 | | | 代码依赖分析截图 |

---

## 10. Step 5 · 上线测试（体验版）

### 10.1 上传前检查

- [ ] 开发者工具「代码依赖分析」主包 < 2M，总包 < 20M
- [ ] 构建 npm 已完成；`miniprogram_npm/` 未入库但本机存在
- [ ] `npm run lint` / `npm run format:check` 通过
- [ ] 小程序后台已配置 `request` 合法域名（见 §4.4）
- [ ] 体验者已在公众平台添加
- [ ] 已知限制已告知测试者：搜索 `/search/all` 可能 500、真实支付走模拟、头像上传成功路径未验

### 10.2 上传与回归

1. 工具顶部「上传」，版本号填 `1.0.0`，备注写 `S8 分包与上线测试`。
2. 公众平台 → 版本管理 → 开发版本 → 选为体验版。
3. 手机扫码体验版，按 `checklist.md` §4 的 5 段旅程走一遍。
4. 每段记录：机型、基础库版本、是否成功、问题截图（临时证据放 `idoc/tmp/`，验完清理）。

> 体验版 `envVersion = trial`，`config/env.js` 会选 `BASE_URL_DEV`。如需测生产域名，先确认 prod 域名可用且已配置为合法域名。

---

## 11. 验收

对齐 `assignments.md` 的 8-1 ~ 8-4 与 `checklist.md` M8：

- [ ] **8-1** 分包完成，`app.json` 只有 4 个 tabBar 页在主包，`subPackages` 有 13 页；主包体积截图 < 2MB
- [ ] **8-2** 至少一项性能优化有前后对比数据（体积 / `setData` payload / 帧率，三选一）
- [ ] **8-3** 真机完整走一遍下单链路，问题清单落到 §15
- [ ] **8-4** `README.md` 已更新为「S8 完成」口径，安装、构建 npm、运行、测试账号齐全
- [ ] 结项答辩 3 问通过（§13）

---

## 12. 报错急救表

| 现象 | 先查什么 | 处理 |
| --- | --- | --- |
| 渲染层 `undefined is not iterable` / `Array.from(undefined)` | 热重载残留，或某个 `wx:for` 绑定了未初始化的字段 | 批量搬目录后先「工具 → 清除缓存 → 全部清除」重编译；若稳定复现，记下页面，给该字段初始值 `[]` 或加 `wx:if` |
| WXML/WXSS 报 `ENOENT` 找旧目录，但新目录文件齐全 | 开发者工具缓存了搬迁前的页面注册树 | 源码核对 `app.json` 与新目录后，清全部缓存并重新编译；仍不行就关闭项目重开，必要时先关「保存后自动热重载」 |
| `page not found` | 跳转 URL 还是旧 `/pages/...` | 对照 §7.2 找漏改的绝对路径 |
| `component not found` | `.json` 的 `usingComponents` 路径 | 页面搬动后不要改 `/components/...`；npm 组件则重新「构建 npm」 |
| 上传提示主包 > 2M | `miniprogram_npm/` 与 `data/areas.js` | 分包页面不解决主包依赖；先做代码依赖分析，再决定裁剪 npm 或按需加载地区数据 |
| 体验版首屏全空、模拟器正常 | 手机端域名校验 | 后台配置 `request` 合法域名；工具「不校验」只对模拟器有效 |
| 401 后跳登录白屏 | `utils/request.js` 的 `LOGIN_PAGE` 没改 | 改成 `/packageGoods/pages/login/login` |
| 登录后回不到原页面 | `redirect` query 里还是旧路径 | 检查调用方传的 `redirect` 与 `login.js` 的 `TAB_PAGES` 判断 |
| SCSS 变量失效 / 编译报找不到 `global.scss` | 页面多了一层 `packageGoods/`，`@import` 少算一级 | 每个已搬页面的 `@import` 加一个 `../` |
| `module 'packageGoods/api/xxx.js' is not defined` | 分包页 JS 的相对 `import` 少算一级，指到了分包内的假目录 | 每个已搬页面的相对导入加一个 `../`；用脚本扫一遍所有 `from '../'` |
| 旧目录还剩一个 `.js` 文件 | 先改了 JS 再拖其它三个文件，Git 显示「新增 + 修改」而不是「重命名」 | 确认 `app.json` 与所有跳转都不再指向旧路径后，删掉旧目录残留文件 |
| 分包页引用另一个分包页失败 | 跨分包同步引用 | 本项目用一个分包规避；不要拆成多个分包 |

---

## 13. 阶段作业 + 闸门答辩（先读答案，再遮住自测）

**完成作业**

1. 提交 `app.json` 的前后 diff，说明哪 4 页留主包、哪 13 页进分包。
2. 提交一张主包体积截图（开发者工具代码依赖分析或上传弹窗）。
3. 提交一份真机问题清单（哪怕写「无」也要写机型和基础库版本）。

**G9 答辩 Q1：为什么 tabBar 四个页面不能放进分包？**

因为微信规定 `tabBar.list[].pagePath` 必须指向主包页面，tabBar 是小程序启动就存在的全局导航，不能依赖分包下载。本项目首页 / 分类 / 购物车 / 我的四页也必须留在 `pages` 数组里。

**G9 答辩 Q2：为什么搬完页面还要改 `utils/request.js`？**

因为 `LOGIN_PAGE` 是主包工具模块里的绝对路径常量，原来指向 `/pages/login/login`。登录页搬进分包后这个路径就不存在了；401 是全局行为，所有页面都可能触发，不改就会在鉴权失败时白屏。

**G9 答辩 Q3：把 13 页搬进分包后，主包为什么可能还是接近 2M？**

因为分包只搬页面四件套。共享的 `miniprogram_npm/`、`data/areas.js`、`utils/`、`api/`、主包组件仍在主包。本项目实测源码里 `miniprogram_npm` 约 1.57MB，是主包的大头；是否超限要看开发者工具按「忽略未使用文件」后的官方数字。

**G9 答辩 Q4：为什么体验版不能只靠开发者工具勾「不校验合法域名」？**

因为这个勾选只对开发者工具的模拟器生效。手机上的体验版 / 正式版由微信客户端按小程序后台配置的合法域名校验，域名没配就会请求失败。

---

## 14. 完成标志

`assignments.md` 8-1 ~ 8-4 全勾，`checklist.md` M8 变为 ☑，`README.md` 不再是「S8 未开始」。

---

## 15. 复盘

| 日期 | 内容 |
| --- | --- |
| 2026-11-25 | 任务书建立。基线：`git status` 干净、`lint` / `format:check` 通过、17 页全主包、源码约 2026.3KB（其中 npm 产物 1574.2KB）。确认业务只用了 `t-icon` 一个 TDesign 组件；单纯搬页面不会缩小主包，需以开发者工具代码依赖分析为准。体验版走 dev 域名，合法域名必须在后台配置。 |
| 2026-11-25 14:33 | 你已上传代码，弹窗显示「编译后代码包大小 462.8 KB」，底部「代码质量」面板无代码质量问题；后台 `request 合法域名` 也已确认。结论：官方包体远低于 2M，不必先裁剪 npm；此版本的依赖分析入口在「代码质量」标签，展开「主包」看明细。Step 0 完成。 |
| 2026-11-25 | Step 1 搬迁后核验：`app.json` 已从主包移除详情页并注册 `packageGoods`，5 处跳转全部改成 `/packageGoods/pages/goods/detail/detail`，`detail.scss` 已加一级 `../`。发现旧目录残留一个 `detail.js`（另外三个文件已被 Git 识别为重命名），已删除。用户提交 `cb0459d`；随后补跑 `npm run format` 修复 3 处格式问题，`lint` / `format:check` 通过。Step 1 完成。 |
| 2026-11-25 | Step 2 商品域批次（代写）：`search` / `category/sub` / `collect` 三页四件套整体搬入 `packageGoods`，`app.json` 主包剩 13 页、分包共 4 页；3 个 SCSS 各加一级 `../`；分类页搜索入口、二级分类入口与「我的」收藏入口改到分包路径。旧目录已空，`lint` / `format:check` 通过。剩用户域 4 页 + 订单域 5 页。 |
| 2026-11-25 | 编译实测暴露漏项：搜索页报 `module 'packageGoods/api/search.js' is not defined`。原因是**JS 相对导入也少一级**（只改了 SCSS）。修复 `search.js` 两处、`sub.js` 两处、`collect.js` 一处相对导入，各加一级 `../`；写脚本扫描 `packageGoods/**/*.js` 所有相对导入，确认全部可解析。`lint` / `format:check` 通过。此坑已补进 §4.3 / §7.2 / §12。 |
| 2026-11-25 | Step 2 用户域批次（代写）：`login` / `profile` / `address/list` / `address/edit` 四页整体搬入分包，`app.json` 主包 9 页、分包 8 页、合计 17 页。同步 4 页 JS/SCSS 相对路径 + 7 处入口引用（含 `utils/request.js` 的 `LOGIN_PAGE`、401 回跳、结算换地址）。旧目录清空、相对导入扫描无断链、`lint` / `format:check` 通过。源码口径主包 1951.9 KB / 分包 74.8 KB，主包比搬迁前减少约 35.7 KB。 |
| 2026-11-25 | Step 2 订单域批次（代写）：`order/confirm` / `pay` / `list` / `detail` / `logistics` 五页整体搬入分包。`app.json` 主包只剩 4 个 tabBar 页，分包 13 页，合计 17 页；5 页 JS/SCSS 相对路径各加一级 `../`；12 处入口引用改到 `/packageGoods/pages/order/...`（购物车结算、我的订单、提交→支付、支付→详情、列表四入口、详情三入口）。旧目录清空、相对导入扫描无断链、`npm run format` 后 `lint` / `format:check` 通过。源码口径主包 1903.3 KB / 分包 123.6 KB。Step 2 完成。 |
