# 02 · 架构与工程约定

> 本文定「东西放哪、依赖怎么走、数据怎么流」。写代码前先看这一页，能避免 80% 的结构性返工。

---

## 1. 目录结构

```
miniprogram/
├─ app.js                     # App()：globalData、onLaunch（恢复 token）
├─ app.json                   # 全局：pages / window / tabBar / subPackages
├─ app.scss                   # 全局样式：盒模型重置、page 底色与基础字号
├─ global.scss                # SCSS 公共文件（只放变量与 mixin，禁止写选择器）
├─ sitemap.json
├─ package.json               # 依赖清单（必须在 miniprogramRoot 内，否则构建 npm 找不到）
├─ node_modules/              # 构建 npm 的输入，gitignore
├─ miniprogram_npm/           # 构建产物，gitignore
│
├─ config/
│  ├─ env.js                  # 唯一域名入口：dev / prod
│  └─ constants.js            # 订单状态、配送时间、支付方式等枚举
│
├─ utils/
│  ├─ request.js              # wx.request 封装（拦截、错误、401）
│  ├─ auth.js                 # token 存取 / 清除 / 登录跳转
│  ├─ storage.js              # 统一 storage key 与读写（带 JSON 容错）
│  └─ format.js               # 价格、时间、数量格式化
│
├─ api/                       # 一域一文件，只声明「路径 + 入参 + 返回」
│  ├─ home.js  category.js  goods.js  search.js
│  ├─ user.js  address.js   cart.js   order.js  pay.js
│
├─ components/                # 跨页复用的自有组件
│  ├─ navigation-bar/         # 自定义导航栏（已有，S2 改造）
│  └─ goods-card/             # 商品卡（S2 新建）
│
├─ pages/                     # 主包：4 个 tabBar 页
│  ├─ index/                  # 首页
│  ├─ category/               # 分类
│  ├─ cart/                   # 购物车
│  └─ member/                 # 我的
│
└─ packageGoods/              # 分包：非 tab 页
   └─ pages/
      ├─ detail/              # 商品详情 + sku-panel 组件
      ├─ search/              # 搜索
      ├─ sub-category/        # 二级分类商品列表
      ├─ login/               # 登录
      ├─ profile/             # 个人资料
      ├─ address/             # 地址列表
      ├─ address-edit/        # 地址编辑
      ├─ checkout/            # 结算
      ├─ pay/                 # 支付
      ├─ order-list/          # 订单列表
      └─ order-detail/        # 订单详情
```

**为什么这么分**

- `tabBar` 页面**必须**在主包，否则无法切换 tab；
- 其余页面进 `packageGoods`，主包体积可控（分包上限 2MB / 总包 20MB）；
- `api/` 与 `pages/` 分离，页面里不出现 URL 字符串；
- `config/` 与 `utils/` 分离：配置是常量，工具是有行为的函数。

---

## 2. 分层职责与依赖方向

```
pages / components        表现层：只管「拿数据 → 渲染 → 响应交互」
        ↓  只能调用
api/*                    数据层：声明路径、入参、返回类型
        ↓  只能调用
utils/request.js         传输层：统一 header、超时、错误、401
        ↓  只能调用
config/env.js            配置层：域名、常量
```

硬性规则：

| 规则 | 为什么 |
| --- | --- |
| 页面**不得**直接 `wx.request` | 否则 token、错误提示、401 处理会散落各处 |
| `api/*` **不得**写业务判断（如「无 token 就跳登录」） | 数据层只描述接口，不承载流程 |
| `utils/` **不得**引用 `api/` 或 `pages/` | 依赖只能单向向下，避免循环引用 |
| 组件**不得**自己发请求（除纯展示型远程图） | 组件保持可预测，数据由页面传入 |
| 域名只出现在 `config/env.js` | 换环境改一处 |

---

## 3. 请求层契约（`utils/request.js`）

```js
// 目标签名（S1 实现）
request({ url, method = 'GET', data = {}, auth = false, loading = false })
  → Promise<result>        // 成功时直接 resolve 业务数据 result
  → reject({ code, msg })  // 失败时抛业务错误
```

约定：

| 项 | 约定 |
| --- | --- |
| 基础地址 | `config/env.js` 的 `BASE_URL`，拼接后发起 |
| 公共头 | `source-client: miniapp`（必带） |
| 鉴权头 | `auth: true` 时注入 `Authorization: <token>`（**不带 Bearer 前缀**，以 Apifox 为准） |
| 成功判定 | 业务 `code === 0`；否则 `reject` 并统一 toast |
| 401 | 清 token → 提示一次 → `wx.navigateTo` 到登录页并带 `redirect` 参数；**并发 401 只跳一次** |
| 超时 | 默认 10s，订单列表单独放宽 |
| 响应 | 只把 `res.data.result` 交给调用方，页面不接触 `code/msg` |

---

## 4. 数据流与状态策略

小程序没有 Redux，**不要**为了对齐 React 版硬造一个。本项目采用三档：

| 数据 | 放哪 | 生命周期 |
| --- | --- | --- |
| 页面展示数据（列表、表单） | 页面 `data` | 随页面销毁 |
| 跨页共享且变化频繁（购物车、登录态） | **服务端为准**，每页 `onShow` 重新拉 | 服务端 |
| 跨页共享但接口不支持（收藏、搜索历史） | `storage` | 持久 |
| 启动时一次性数据（token、用户信息） | `globalData` + `storage` 双写 | 应用级 |
| 组件内部 UI 状态（弹层开关） | 组件 `data` | 随组件销毁 |

三条铁律：

1. **单一数据源**：同一个值不要既存 `data` 又存 `globalData`。`globalData` 只做「启动时恢复」，不作为渲染来源。
2. **`onShow` 对齐**：购物车、订单列表、我的页面在 `onShow` 里重新请求，保证跨页操作后状态正确（这是替代 Redux 的关键手段）。
3. **不缓存可推导值**：合计金额、是否全选这类值在 `setData` 前算好再写入 `data`，不要在 WXML 里写复杂表达式。

---

## 5. 渲染与工程配置

| 配置 | 值 | 说明 |
| --- | --- | --- |
| 渲染引擎 | WebView（默认） | Skyline 已在 S0 拆除 |
| `style` | `v2` | 新版组件样式 |
| `lazyCodeLoading` | `requiredComponents` | 只注入用到的自定义组件 |
| `navigationStyle` | `custom` | 顶部自绘，需处理胶囊安全区 |
| 分包 | `packageGoods` | S8 正式配置并搬迁 |
| npm | `tdesign-miniprogram` | 必须「工具 → 构建 npm」，产物 `miniprogram_npm/` 不入库 |

---

## 6. 现在写 JS，但为 TS 预留（五条约定）

| # | 约定 | 迁移 TS 时省下什么 |
| --- | --- | --- |
| 1 | 用 JSDoc 标类型：`/** @type {import('../api/goods.js').GoodsInfo} */` | 类型信息已就位，删注释即 `.ts` |
| 2 | 数据结构用 `@typedef` 集中写在 `api/*.js` 顶部 | 每个 `api/x.js` 直接改名 `x.ts` |
| 3 | 不用 `enum` / `interface` / 泛型，改用 `Object.freeze({})` | 无语法级返工 |
| 4 | 一页四件套命名统一，组件目录名 = 组件名 | 只需批量改后缀 |
| 5 | 别名 `@/` 由 `jsconfig.json` 的 `paths` 提供 | 迁 TS 时 `tsconfig.json` 复用同一份 |

> 允许出现「`@param {string} id`」这类注释，不允许 `// @ts-ignore`。

---

## 7. 命名与样式规范

| 项 | 规范 | 示例 |
| --- | --- | --- |
| 页面目录 | 小写连字符 | `order-detail/` |
| 组件 | 小写连字符，`usingComponents` 的 key 同名 | `goods-card` |
| JS 变量/函数 | 小驼峰 | `cartList`、`fetchCart` |
| 常量 | 全大写下划线 | `ORDER_STATE` |
| WXML 类名 | BEM-lite：`block__element--modifier` | `goods-card__price--origin` |
| 单位 | 一律 `rpx`，边框可用 `1px` + `scaleY(.5)` | `margin: 24rpx` |
| 颜色/字号 | 走 `global.scss` 变量 | `color: $brand-color` |
| 变量引入 | **每个 scss 顶部显式 `@import`**（本机工具的自动注入未生效） | `pages/*/` 与 `components/*/` 用 `@import '../../global.scss';`，`packageGoods/pages/*/` 用 `@import '../../../global.scss';` |
| 样式隔离 | 自研组件默认 `isolated`；需覆盖 TDesign 用 `custom-style` 或 CSS 变量 | `--td-brand-color` |

---

## 8. 关键实现约定（踩过的坑写死在这）

1. **`<image>` 必须给宽高**，否则按 320×240 撑破布局。
2. **`wx:key` 用业务 id**，不用 `index`；否则列表复用时状态错位。
3. **`setData` 只传变化路径**：`this.setData({ 'list[2].count': 3 })`，不要整表重设。
4. **定时器必须在 `onUnload` / `detached` 清理**，否则页面销毁后仍在跑。
5. **页面栈最多 10 层**：登录、支付这类「一次性页面」用 `redirectTo`。
6. **`onReachBottom` 只在页面级生效**，页面里有全屏 `scroll-view` 时收不到，改用 `bindscrolltolower`。
7. **`triggerEvent` 事件名全小写**。
8. **每个数据页都要三态**：loading / empty / error，断网时不白屏。

---

## 9. 配置项依据表（溯源规则）

**规则**：本项目中任何配置项、API、字段，都必须能说明来源。来源分四级，可信度从高到低：

| 级别 | 含义 | 能不能写进代码 |
| --- | --- | --- |
| A 官方文档 | developers.weixin.qq.com 明文字段表 / API 文档 | 可，直接引用 |
| B 官方产物 | 开发者工具**生成**的工程文件（如模板 `project.config.json`） | 可，但必须注明「工具写入、未文档化」 |
| C 实测 | 在本机工具版本上实际跑出来的结论 | 可，必须写明环境（工具版本 + 基础库版本） |
| D 推测 | 无来源的经验判断 | **禁止**写进代码或方案 |

> 记录格式：`字段 / 来源级别 / 依据 / 实测结论`。B、C 两级的条目，工具升级后要重新验证。

### 9.1 本项目已使用的配置项

| 配置 | 级别 | 依据 | 结论 |
| --- | --- | --- | --- |
| `setting.useCompilerPlugins` | A | 项目配置文件官方文档 | 用 `["sass"]` 编译 `.scss`；去掉 `"typescript"` 后 `.ts` 不再编译 |
| `setting.es6` | A | 官方字段：ES6 转 ES5 | 必须 `true`，否则 ESM 的 `import/export` 不转译，运行时报 `Unexpected token 'export'`（实测） |
| `setting.enhance` | A | 官方字段：增强编译 | 与 `es6` 一起开，补齐可选链等语法降级 |
| `setting.skylineRenderEnable` | B | 模板生成；官方文档有渲染开关但未逐字核实 | 本项目 `false`，配合删除 `app.json` 的 `rendererOptions` 与 `componentFramework` |
| `setting.packNpmManually` / `packNpmRelationList` | A | 官方 npm 支持文档 | 实测在「`miniprogramRoot` 为子目录 + 根目录 `node_modules`」场景下未生效，已回退为默认 |
| `app.json` → `tabBar.list[].iconPath` | A | `app.json` 官方文档，图标字段为可选 | 先只配 `pagePath` + `text`，图标后补 |
| `app.json` → `rendererOptions.skyline` | B | 模板生成 | 不启用，已删除 |
| `setting.sassSetting.sassCommonUseFilePath` / `scssCommonUseFilePath` | **B（未文档化）** | 仅见于官方模板生成的 `project.config.json`（git `353151a` 基线提交）；**官方文档字段表中无此项** | 实测未生效（写 `$var` 仍报 `Undefined variable`）。**已整块删除**，改用显式 `@import` |
| `tdesign-miniprogram` 运行时依赖 `tslib` | C | 实测：`miniprogram_dist` 中 106 个文件 `import ... from "tslib"`，而包自身未声明该依赖 | `miniprogram/package.json` 显式安装 `tslib` |
| `tdesign-miniprogram` 的 `"miniprogram": "miniprogram_dist"` | C | 实测读取 `node_modules/tdesign-miniprogram/package.json` | 决定 `usingComponents` 写 `tdesign-miniprogram/button/button` |
