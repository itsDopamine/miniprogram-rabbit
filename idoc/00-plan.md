# 小兔鲜儿小程序版 · 学习与开发计划

> 目标：用微信小程序**原生框架（JavaScript + SCSS + TDesign）**重做已完成的小兔鲜儿商城（React 版：`F:/Web/react-rabbit`），
> 在**边学边开发**的过程中覆盖小程序核心能力。
>
> 节奏：每天 3 小时以上，按模块分 9 个阶段（S0–S8），预计 **19–22 个工作日**（约 4 周）。
> 接口文档：https://s.apifox.cn/0e6ee326-d646-41bd-9214-29dbf47648fa （11 组 / 44 个接口）
> 计划版本：v2 · 2026-11-24（v1 误把模板默认当已定技术栈，v2 已按确认结论重写）

---

## 1 怎么用这份计划

### 1.1 协作方式（重要）

本项目是**学习驱动**，不是「AI 代写项目」。每个任务固定三段式：

| 段 | 谁做 | 内容 |
|---|---|---|
| 讲 | 我 | 只讲这一个知识点：它解决什么问题、小程序里怎么写、和 React/H5 的差异、常见坑 |
| 写 | 你 | 按「你写什么」一栏动手，我最多给最小片段，不给整文件 |
| 验收 | 我 | 对照「验收」逐条检查，指出问题，通过后才进下一个任务 |

规则：
- **一次只推进一个任务**，不跳步、不批量补代码。
- 我写代码前会先问：「这次我讲你写，还是我代写？」
- 卡住超过 20 分钟直接说，我拆更小的步骤，而不是替你写完。

### 1.2 每阶段的收口动作

1. 自测通过本轮验收清单；
2. `git commit`（提交信息带阶段号，如 `feat(S2): 首页轮播与分类宫格`）；
3. 在本文档第 7 节「推进记录」回填一行（日期 / 阶段 / 遇到的问题）；
4. 才允许进入下一阶段。

### 1.3 关于接口字段

接口文档首页只有**分组和接口名**，抓不到 path / 入参 / 响应结构。所以：

> **进入任何接口编码前**，先做「取字段」动作 —— 打开 Apifox 对应子页面截图/复制字段，或把 OpenAPI JSON 导出到 `idoc/`。

禁止凭 React 版记忆直接写死字段名（字段名、枚举值、错误码都可能不同）。

---

## 2 技术栈与工程现状

### 2.1 技术栈（已确认，2026-11-24）

| 项 | 选择 | 说明 |
|---|---|---|
| 框架 | 微信小程序**原生** | 不用 Taro / uni-app |
| 语言 | **JavaScript（ES6+）** | 现阶段写 `.js`；**保留 TS 扩展位**，按 2.4 的约定写，后续可整体迁移 |
| 样式 | **SCSS**（`.scss`） | 公共变量走 `global.scss`（当前缺失，S0 补） |
| 渲染 | **WebView 默认渲染** | 需关闭模板预置的 Skyline，兼容性与资料最好 |
| UI 库 | **TDesign Miniprogram** | 需 npm 构建；基于 WebView，与所选渲染一致 |
| 请求 | 自建 `utils/request.js` | `wx.request` Promise 封装 + 拦截 + 401 处理 |
| 接口域名 | `https://pcapi-xiaotuxian-front-devtest.itheima.net` | 生产：`https://pcapi-xiaotuxian-front.itheima.net` |
| 请求头 | `source-client: miniapp`（必带） | 鉴权：`Authorization: <token>`，无效返回 401 |

> 结论一句话：**JS + SCSS + WebView + TDesign**，模板里的 TypeScript / Skyline 都是要拆掉的，不是既定方案。

### 2.2 工程现状与必须做的迁移

当前工程是官方 `miniprogram-ts-sass-quickstart` 模板，**未做任何业务配置**。开工前要把它改造成目标形态：

| # | 现状 | 迁移动作 | 阶段 | 状态 |
|---|---|---|---|---|
| 1 | `project.config.json`：`skylineRenderEnable: true` | 改为 `false` | S0 | ✅ 已完成 |
| 2 | `app.json`：`rendererOptions.skyline` + `componentFramework: glass-easel` | 整段移除（回默认 WebView / exparser） | S0 | ✅ 已完成 |
| 3 | `project.config.json`：`useCompilerPlugins: ["typescript","sass"]` | 去掉 `typescript`，只留 `sass` | S0 | ✅ 已完成 |
| 4 | `.ts` 文件：`app.ts`、`pages/index/index.ts`、`components/navigation-bar/navigation-bar.ts`、`utils/util.ts` | 改名为 `.js` 并去掉类型标注 | S0 | ✅ 已完成 |
| 5 | `miniprogram/global.scss` | **不存在**，但配置已引用，必须新建 | S0 | ✅ 已完成（变量 + mixin） |
| 6 | `app.json` 的 `tabBar` | 未配置，需配 4 个 tab | S0-4 | ⬜ 待做 |
| 7 | `app.json` 的 `subPackages` | 未配置（空目录 `packageGoods/` 已删除，S8 随代码重建） | S8 落地 | ⬜ 待做 |
| 8 | `pages/index`、`pages/logs` | 模板 demo：`logs` 已删除，`index` 已重写为占位页 | S0 | ✅ 已完成 |
| 9 | npm 依赖 | 仅 `miniprogram-api-typings`；需装 `tdesign-miniprogram` 并构建 | S0-2 | ⬜ 待做 |
| 10 | `mock/`、`components/goods-item`、`page-status`、`price` | 早期误建的空目录 | S0 | ✅ 已删除（用时再建） |

> 保留不动：`app.json` 的 `style: v2`、`lazyCodeLoading: requiredComponents`、`libVersion 2.32.3`、`tsconfig.json` / `typings/`（作为编辑器提示与未来 TS 化的地基）。

### 2.3 目标目录规划

```
miniprogram/
├─ app.js / app.json / app.scss
├─ global.scss                 # 全局 SCSS 变量与 mixin（S0 新建）
├─ config/
│  ├─ env.js                   # 开发/生产域名切换
│  └─ constants.js             # 订单状态、配送时间等枚举
├─ utils/
│  ├─ request.js               # wx.request Promise 封装 + 拦截
│  ├─ auth.js                  # token 存取、登录跳转
│  ├─ storage.js               # 统一 storage key 与读写
│  └─ format.js                # 价格/时间格式化
├─ api/                        # 一域一文件，只放请求定义
│  ├─ home.js  category.js  goods.js  search.js
│  ├─ user.js  address.js  cart.js  order.js  pay.js
├─ components/                 # 跨页复用组件（TDesign 补不了时才自研）
│  ├─ navigation-bar/          # 改造适配
│  ├─ goods-card/              # 商品卡（多页复用）
│  ├─ popup/                   # 底部弹层基座（也可直接用 t-popup）
│  └─ count-input/             # 数量加减（TDesign 有 t-stepper，可评估）
├─ pages/                      # 主包 = 4 个 tabBar 页
│  ├─ index/                   # 首页
│  ├─ category/                # 分类
│  ├─ cart/                    # 购物车
│  └─ member/                  # 我的
├─ packageGoods/               # 分包：非 tab 页
│  ├─ pages/detail/            # 商品详情 + SKU
│  ├─ pages/search/            # 搜索
│  ├─ pages/checkout/          # 结算
│  ├─ pages/pay/               # 支付
│  ├─ pages/order-list/        # 订单列表
│  ├─ pages/order-detail/      # 订单详情
│  └─ pages/address/           # 地址列表 / 编辑
├─ miniprogram_npm/            # TDesign 构建产物（不提交，README 写构建步骤）
└─ mock/                       # 仅开发期假数据
```

> tabBar 页面必须在主包，所以详情/搜索/结算/订单/地址全部进 `packageGoods`。

### 2.4 「现在写 JS，但不给 TS 挖坑」的五条约定

后续若要迁 TS，成本主要在「文件结构」和「类型信息」两处。所以从第一天起守这五条：

1. **用 JSDoc 标注类型，不写裸变量**。写 `/** @type {import('../api/goods.js').GoodsInfo} */`，而不是什么都不写。编辑器提示照样有，迁 TS 时删注释即可。
2. **类型定义集中放 `api/*.js` 的 `@typedef` 块**，不在页面里散落 `@typedef`。迁 TS 时每个 `api/x.js` 直接变 `api/x.ts`，类型原样搬。
3. **不用 TS 专属语法**（`enum` / `interface` / 修饰符 / 泛型调用），用 `const XXX = Object.freeze({...})` 代替 enum。
4. **文件与命名保持一致**：一页四件套 `index.js/index.json/index.wxml/index.scss`，组件同理；组件名用小写连字符（`goods-card`），目录名与组件名一致。迁 TS 时只需后缀改名。
5. **`jsconfig.json` 配 `paths` 别名**（`@/*` → `miniprogram/*`），页面里统一用别名 import，不吃相对路径的苦；同时开 `checkJs: false`，避免现在就被类型报错打断。

> 附带要求：`miniprogram-api-typings` 保留，`typings/` 不动，`tsconfig.json` 保留（迁 TS 直接复用）。

---

## 3 阶段总览

| 阶段 | 主题 | 预计 | 主要产出 | 一句话验收 |
|---|---|---|---|---|
| S0 | 配置迁移与工程骨架 | 1.5 天 | 关 Skyline、转 JS、接 TDesign、`global.scss`、tabBar + 分包 | 四个 tab 能互跳，TDesign 按钮能渲染，样式变量生效 |
| S1 | 请求层与鉴权 | 1.5 天 | `request.js`、`env.js`、`api/*`、token 注入与 401 处理 | 首页接口打出真实数据，401 自动跳登录 |
| S2 | 首页 | 2 天 | 自定义导航、轮播、分类宫格、楼层、猜你喜欢分页 | 首屏 5 区块正确，切 tab 回来不重复请求 |
| S3 | 分类与搜索 | 2 天 | 分类左右联动、二级分类排序分页、搜索页与提示语 | 排序切 tab 回第 1 页，触底加载、搜索有结果 |
| S4 | 商品详情与 SKU | 3 天 | 详情页、图片预览、SKU 弹层、规格可选性计算、加购 | 规格禁用态正确，价格库存联动，能加购 |
| S5 | 登录与个人中心 | 2.5 天 | `wx.login` 换 token、个人中心、资料修改、地址管理 | 未登录点个人中心跳登录并回跳，地址增删改查通过 |
| S6 | 购物车 | 2 天 | 列表、单选/全选、数量防抖、删除、失效商品、登录合并 | 算价正确、失效不可结算、未登录车登录后合并 |
| S7 | 结算 / 订单 / 支付 | 3 天 | 结算页、提交订单、支付、订单列表与详情、取消收货 | 全链路下单 → 支付 → 状态正确流转 |
| S8 | 分包与性能收尾 | 1.5 天 | 分包落地、图片懒加载、setData 优化、真机调试 | 主包 < 2MB，体验评分达标，真机无卡顿 |

合计约 **19 天**。

---

## 4 接口 × 页面 × 阶段 映射表

### 4.1 请求约定

- 基础地址：`https://pcapi-xiaotuxian-front-devtest.itheima.net`，只在 `config/env.js` 出现一次。
- 必带请求头 `source-client: miniapp`；登录类接口额外带 `Authorization: <token>`（**不带 `Bearer ` 前缀**，与 React 版不同，以 Apifox 为准）。
- 响应统一 `{ code, msg, result }`，`code === 0` 视为成功（S1 用真实接口验证一次）。
- 401：清 token → 提示 → 跳登录并记录来源页，登录成功后回跳。
- 各接口 path 一律**以 Apifox 为准**；下表「参考路径」仅用于对照，不可直接照抄。

### 4.2 映射表（44 个接口）

| # | 分组 | 接口 | 方法 | 参考路径（待确认） | 落地页面 | 阶段 |
|---|---|---|---|---|---|---|
| 1 | 首页 | 首页-广告区域-小程序 | GET | `/home/banner?distributionSite=1` | 首页 / 分类页 | S2 |
| 2 | 首页 | 首页-前台分类-小程序 | GET | `/home/category/head` | 首页宫格 / 全局导航 | S2 |
| 3 | 首页 | 首页-热门推荐-小程序 | GET | `/home/hot` | 首页楼层 | S2 |
| 4 | 首页 | 首页-新鲜好物-小程序 | GET | `/home/new` | 首页楼层 | S2 |
| 5 | 首页 | 猜你喜欢-小程序 | GET | `/home/goods` | 首页猜你喜欢 | S2 |
| 6 | 热门推荐 | 特惠推荐-小程序 | GET | `/home/preference` | 分类/楼层（视文档） | S2/S3 |
| 7 | 热门推荐 | 爆款推荐-小程序 | GET | `/home/hot?type=...` | 同上 | S2/S3 |
| 8 | 热门推荐 | 一站买全-小程序 | GET | 待确认 | 同上 | S3 |
| 9 | 热门推荐 | 新鲜好物-小程序 | GET | `/home/new` | 同上 | S2 |
| 10 | 搜索 | 搜索-商品搜索-带筛选条件 | POST | `/search` | 搜索页 | S3 |
| 11 | 搜索 | 搜索-提示语 | GET | `/search/tips` | 搜索联想 | S3 |
| 12 | 商品分类 | 分类列表-小程序 | GET | `/category` | 分类页 | S3 |
| 13 | 商品详情 | 商品详情 | GET | `/goods?id=` | 详情页 | S4 |
| 14 | 商品详情 | 同类推荐（将废弃） | GET | `/goods/relevant` | 详情页底部 | S4（可选） |
| 15 | 会员登录 | 小程序登录 | POST | 待确认（code 换 token） | 登录 | S5 |
| 16 | 会员登录 | 小程序登录-内测版 | POST | 待确认 | 登录（调试用） | S5 |
| 17 | 会员登录 | 传统登录-用户名+密码 | POST | `/login` | 登录（备用） | S5 |
| 18 | 会员登录 | 刷新 token | PUT | `/refresh` | 请求层 | S5 |
| 19 | 个人信息 | 获取个人信息 | GET | `/member/profile` | 我的 | S5 |
| 20 | 个人信息 | 修改个人信息 | PUT | `/member/profile` | 资料编辑 | S5 |
| 21 | 个人信息 | 修改用户头像 | POST | `/member/profile/avatar` | 资料编辑 | S5 |
| 22 | 地址管理 | 添加收货地址 | POST | `/member/address` | 地址编辑 | S5 |
| 23 | 地址管理 | 删除收货地址 | DELETE | `/member/address/:id` | 地址列表 | S5 |
| 24 | 地址管理 | 修改收货地址 | PUT | `/member/address/:id` | 地址编辑/设默认 | S5 |
| 25 | 地址管理 | 获取地址详情 | GET | `/member/address/:id` | 地址编辑 | S5 |
| 26 | 地址管理 | 获取地址列表 | GET | `/member/address` | 地址列表/结算 | S5 |
| 27 | 订单管理 | 获取预付订单 | GET | `/member/order/pre` | 结算页 | S7 |
| 28 | 订单管理 | 获取立即购买订单 | GET | `/member/order/pre/now` | 详情页「立即购买」 | S7 |
| 29 | 订单管理 | 获取再次购买订单 | GET | `/member/order/repurchase/:id` | 订单详情 | S7 |
| 30 | 订单管理 | 提交订单 | POST | `/member/order` | 结算页 | S7 |
| 31 | 订单管理 | 获取订单详情 | GET | `/member/order/:id` | 订单详情/支付页 | S7 |
| 32 | 订单管理 | 模拟发货-内测版 | GET | `/member/order/consignment/:id` | 订单详情（调试） | S7 |
| 33 | 订单管理 | 确认收货 | PUT | `/member/order/receipt/:id` | 订单列表/详情 | S7 |
| 34 | 订单管理 | 获取订单物流 | GET | `/member/order/logistics/:id` | 物流页 | S7（可选） |
| 35 | 订单管理 | 删除订单 | DELETE | `/member/order` | 订单列表 | S7 |
| 36 | 订单管理 | 取消订单 | PUT | `/member/order/:id/cancel` | 订单详情 | S7 |
| 37 | 订单管理 | 获取订单列表 | GET | `/member/order` | 订单列表 | S7 |
| 38 | 购物车 | 加入购物车 | POST | `/member/cart` | 详情页 | S4/S6 |
| 39 | 购物车 | 获取购物车列表 | GET | `/member/cart` | 购物车/结算 | S6 |
| 40 | 购物车 | 删除/清空购物车单品 | DELETE | `/member/cart` | 购物车 | S6 |
| 41 | 购物车 | 修改购物车单品 | PUT | `/member/cart/:skuId` | 购物车 | S6 |
| 42 | 购物车 | 全选/取消全选 | PUT | `/member/cart/selected` | 购物车 | S6 |
| 43 | 支付 | 获取微信支付参数 | GET | `/member/order/:id`(payment) | 支付页 | S7 |
| 44 | 支付 | 模拟支付-内测版 | GET | `/member/order/pay/mock` | 支付页（调试） | S7 |

### 4.3 能力缺口与降级方案

| 能力 | 情况 | 方案 |
|---|---|---|
| 商品收藏 | React 版有 `/member/collect`，**小程序接口文档无收藏分组** | S5 末尾做「本地 storage 收藏」降级版；确认无接口则只保留 UI |
| SKU 库存查询 | 文档「商品详情」组只有 1 个有效接口 | 库存从详情响应 `skus` 取，不再单独查 |
| 真实微信支付 | 只有「获取微信支付参数」+「模拟支付-内测版」 | 主链路走模拟支付；`wx.requestPayment` 只做调起验证 |
| 注册 | 无接口 | 不做，登录页注明使用测试账号 |
| 搜索历史 | 无接口 | 本地 storage，可选 |

---

## 5 阶段详情

### S0 配置迁移与工程骨架（1.5 天）

> 进度：S0-1 已完成（2026-11-24），原理讲解、改动 diff、验收与踩坑见 [`stages/S0.md`](./stages/S0.md)。

**目标**：把 quickstart 模板改造成「JS + SCSS + WebView + TDesign」的目标形态，零业务代码。

**知识点**：小程序四件套（`.js/.json/.wxml/.scss`）与 `app.json` 全局配置、`tabBar` 配置与 icon 要求、`subPackages` 与主包体积、rpx 与 `box-sizing`、SCSS 公共文件机制、npm 构建（`miniprogram_npm`）、TDesign 引入方式与主题变量。

| 任务 | 我讲 | 你写 | 验收 |
|---|---|---|---|
| S0-1 关 Skyline + 转 JS | Skyline 与 WebView 的区别，为什么现在选 WebView；关掉后哪些写法变了 | 改 `project.config.json`（`skylineRenderEnable: false`、去掉 `typescript` 编译插件）；`app.json` 删 `rendererOptions` 与 `componentFramework`；三个 `.ts` 改 `.js` 并去类型 | 编译无报错；控制台无 skyline 相关提示；页面正常渲染 |
| S0-2 接入 TDesign | npm 构建流程；`usingComponents` 按需引入 vs 全局引入；样式隔离 | `npm i tdesign-miniprogram`；工具里构建 npm；`global` 引入 `t-button`/`t-toast` 试跑；建 `components/` 引用示例 | 页面上 TDesign 按钮样式正确、能点击；`miniprogram_npm/` 已生成 |
| S0-3 样式体系 | rpx 换算；WebView 默认 `content-box` 的坑；SCSS 变量与 TDesign 主题变量覆盖 | 新建 `miniprogram/global.scss`：颜色/字号/间距变量 + `box-sizing: border-box` 重置 + `--td-brand-color` 覆盖；`app.scss` 引入 | 任意页面用变量生效；改一处变量全局变色 |
| S0-4 tabBar + 分包 + 规范 | tabBar 页面必须在主包；icon 尺寸；目录约定 | 建 `pages/category|cart|member` 占位页；配 `tabBar`（含本地 icon）；建 `api/ config/` 目录；写 `.gitignore`（忽略 `miniprogram_npm/`）与提交规范 | 四个 tab 可互跳、选中态正确；`git log` 有 S0 提交 |

**接口**：无。

**坑**：
- tabBar icon 必须本地图片（81×81 png），不支持网络图。
- 关掉 Skyline 后 `defaultDisplayBlock` / `defaultContentBox` 等参数失效，容器盒子模型回到 WebView 默认，必须在 `global.scss` 统一 `box-sizing`，否则宽度全乱。
- 去掉 `typescript` 编译插件后，残留 `.ts` 文件不会被编译，必须删干净。
- `subPackages` 里 `pages` 为空数组会报错，S0 先不写，S8 再补。

---

### S1 请求层与鉴权（1.5 天）

**目标**：写出一层「页面只调 `api/xxx.js` 里函数」的请求层，后续全部复用。

**知识点**：`wx.request` 回调式 API 的 Promise 化、请求/响应拦截器思想、超时与并发、`Promise.all`、JSDoc 类型标注、`wx.setStorageSync` 与 token 生命周期、401 统一处理与登录回跳。

| 任务 | 我讲 | 你写 | 验收 |
|---|---|---|---|
| S1-1 Promise 化 | 为什么不能每页裸写 `wx.request`；三层结构（request → api → page） | 写 `utils/request.js`：`request({url,method,data})` 返回 Promise、baseURL 拼接、`source-client` 头、超时、`code!==0` 抛错、`@typedef` 定义 `ApiResult` | 真实接口能拿到 `result`；错误路径进 catch |
| S1-2 环境与常量 | 环境切换为什么不能散落各处 | 写 `config/env.js`（dev/prod）与 `config/constants.js`（订单状态、配送时间枚举用 `Object.freeze`） | 改 `env.js` 一处即可切域名 |
| S1-3 接口定义层 | api 层只声明「路径+入参+返回」，把类型放这里 | 写 `api/home.js` 5 个函数 + `@typedef` 描述响应结构 | 调用处有字段补全；无 `any` 式写法 |
| S1-4 token 与 401 | 请求拦截、并发 401 只跳一次、回跳参数怎么带 | `utils/auth.js` 存/取/清 token；请求头注入；401 → 清 token → 跳登录带 `redirect` | 塞过期 token，任意接口 401 后只跳一次登录页 |

**接口**：第 1–5 条用于验证请求层。

**坑**：`wx.request` 无跨域但受域名白名单限制（开发者工具可临时关闭校验，真机必须配）；401 时 `navigateTo` 连续压栈会堆页面，用 `redirectTo` 或加节流。

---

### S2 首页（2 天）

**目标**：完成首页 5 个区块，抽出第一个业务组件 `goods-card`。

**知识点**：自定义导航栏与胶囊安全区（`wx.getWindowInfo` / `wx.getMenuButtonBoundingClientRect`）、`swiper` 轮播、列表渲染与 `wx:key`、自定义组件 `properties / observers / triggerEvent / slot`、`onLoad` 与 `onShow` 的差别、`onReachBottom` 分页、`onPullDownRefresh` + `wx.stopPullDownRefresh`。

| 任务 | 我讲 | 你写 | 验收 |
|---|---|---|---|
| S2-1 导航 + 轮播 | 导航栏高度怎么算；胶囊避让；`position: fixed` 与占位 | 改造 `components/navigation-bar`；首页顶部 `swiper` 渲染 banner | 不同机型顶部不遮挡；轮播可滑、指示点正确 |
| S2-2 分类宫格 + 楼层 | 组件拆分粒度；`properties` 与 `observers` 区别 | 写 `components/goods-card`；渲染「前台分类」宫格 + 热门/新鲜好物楼层 | 商品卡在 2/3 列布局下复用同一组件 |
| S2-3 猜你喜欢分页 | `onReachBottom` 触发条件；加载中/没有更多状态机 | 猜你喜欢列表 + 触底加载 + 底部状态文案 | 滑到底自动加载；到底显示「没有更多」；不重复请求 |
| S2-4 下拉刷新与骨架 | `enablePullDownRefresh` 配置位置；切 tab 是否重请求；骨架屏 | 首页 `app.json` 开下拉刷新 + `onShow` 缓存策略 + 首屏骨架 | 下拉能刷新并收起；切走再回来不重复请求；首屏不白屏 |

**接口**：第 1–9 条（热门推荐组按文档实际字段取舍）。

**坑**：`onReachBottom` 只在页面级生效，页面里有全屏 `scroll-view` 时不会触发，需改用 `scroll-view` 的 `bindscrolltolower`；自定义导航栏页面要自己算 `statusBarHeight`。

---

### S3 分类与搜索（2 天）

**目标**：分类页左右联动 + 二级分类排序分页 + 搜索页。

**知识点**：双列 `scroll-view` 联动（`scroll-into-view` + `scroll-with-animation`）、`position: sticky` 吸顶、排序参数与分页状态复位、输入防抖、`POST` 接口传 body、空态与错误态、TDesign 的 `t-search` / `t-tabs` / `t-empty` 用法。

| 任务 | 我讲 | 你写 | 验收 |
|---|---|---|---|
| S3-1 分类左菜单 | 两个 `scroll-view` 如何联动；右侧回顶 | 分类页左侧一级 + 右侧二级宫格 + banner | 点左项右侧切换并回到顶部 |
| S3-2 二级分类分页 | 排序参数有哪些；为什么切 tab 要回第 1 页 | 二级分类商品列表 `POST` 分页 + 排序 tab + 触底加载 | 切排序后从第 1 页重拉；列表正确累加 |
| S3-3 搜索页 | 防抖实现；提示语接口触发时机 | 搜索页：输入框、提示语下拉、回车/点提示执行搜索、结果列表 | 连续输入只发 1 次提示语请求；有/无结果两态正常 |
| S3-4 筛选条件 | 筛选参数结构；多条件组合 | 按文档实现筛选面板，条件变化重新搜索 | 选筛选后结果变化；清空能复原 |

**接口**：第 10–12 条（含热门推荐组剩余接口）。

**坑**：搜索是 POST，参数不全时后端可能返回空列表而非报错，先用文档示例值跑通；`t-tabs` 切换要同步重置 `page`/`list`。

---

### S4 商品详情与 SKU（3 天）

**目标**：详情页 + SKU 弹层，规格可选性判断必须正确。

**知识点**：页面传参 `onLoad(options)`、`wx.previewImage` 图片预览、底部弹层（可直接用 `t-popup`）、父子组件通信 `triggerEvent`、`properties` 传对象时的引用陷阱、幂集（组合枚举）算法、加购前的登录判断。

| 任务 | 我讲 | 你写 | 验收 |
|---|---|---|---|
| S4-1 详情页骨架 | `rich-text` 富文本与图片适配；轮播点击预览 | 详情页头部轮播 + 价格区 + 详情富文本 + 底部操作栏 | 图片可放大预览；富文本图片不溢出 |
| S4-2 SKU 弹层 | 弹层用 `t-popup` 还是自研；组件通信三种方式 | 用 `t-popup` 搭 SKU 面板骨架：规格分组、数量、确定按钮 | 打开/关闭正常，蒙层点击可关 |
| S4-3 SKU 可选性 | 规格组合为什么用幂集；无库存 sku 的路径要排除 | 在详情页实现 `buildPathMap` + `isDisabled`，渲染禁用态 | 未选规格时不误禁用；选中 A 后不存在的 B 变灰；再点可取消 |
| S4-4 价格库存联动 + 加购 | 选满规格才出 skuId；数量受库存夹取 | 价格/库存联动 + 数量上限 + 调加购接口 | 切规格价格库存同步；数量不超库存；加购后购物车有该商品 |

**接口**：第 13、14、38 条。

**坑**：`setData` 传整个 sku 列表会卡，只 setData 变化字段；`properties` 收到对象是引用，直接改不会触发视图更新；`triggerEvent` 事件名不要用驼峰。

**参考**：React 版 `src/pages/detail/components/SkuSelector` + `power-set.js`（仅对照思路，不复制代码）。

---

### S5 登录与个人中心（2.5 天）

**目标**：`wx.login` 登录闭环 + 个人中心 + 地址管理。

**知识点**：`wx.login` 的 code 一次性与 5 分钟有效、token 存 storage、登录页与来源页回跳、头像昵称填写能力（`open-type="chooseAvatar"` / `type="nickname"`）、`wx.uploadFile` 上传、`wx.chooseAddress` 授权、表单组件与校验、列表页状态管理。

| 任务 | 我讲 | 你写 | 验收 |
|---|---|---|---|
| S5-1 登录闭环 | 为什么必须 code 换 token；与 React 版账密登录的差别 | 登录页 + `api/user.js` 登录 + token 落 storage + 回跳 | 登录后回到来源页；杀进程重进仍登录 |
| S5-2 个人中心 | 登录拦截放哪一层最合适 | 「我的」页：头像昵称、订单状态入口、功能列表；未登录跳登录 | 未登录点「我的」直接跳登录并回跳 |
| S5-3 个人资料 | 头像昵称新规；上传接口与临时路径 | 资料编辑页：选头像上传、改昵称提交 | 上传后个人中心同步刷新 |
| S5-4 地址管理 | 列表/编辑拆两页还是一条页；默认地址唯一 | 地址列表 + 编辑（增删改、设默认），支持 `wx.chooseAddress` 一键填充 | 增删改查全部通过；默认地址唯一 |
| S5-5 收藏降级（可选） | 无接口时如何设计不埋雷 | 本地 storage 收藏 + 详情页心形 + 列表页 | 收藏态跨页一致；文档标注「无后端」 |

**接口**：第 15–26 条。

**坑**：内测版登录可能需要固定测试账号；`wx.chooseAddress` 需在 `app.json` 配 `requiredPrivateInfos`（以最新官方文档为准）；头像昵称的 `bindchooseavatar` 事件参数是临时路径，需先上传再保存 URL。

---

### S6 购物车（2 天）

**目标**：购物车页全交互 + 与登录态配合。

**知识点**：tabBar 页 `onShow` 刷新时机、单选/全选是「计算出来的状态」（WXML 不能写复杂表达式）、防抖（连点只发一次）、乐观更新与失败回滚、`wx.showModal` / `t-dialog` 确认交互、失效商品处理。

| 任务 | 我讲 | 你写 | 验收 |
|---|---|---|---|
| S6-1 列表与选中 | 为什么选中态要放数据里 | 列表渲染 + 单选 + 底部合计（数量/金额） | 勾选后合计即时变化 |
| S6-2 数量与删除 | 手写 debounce；乐观更新 | `t-stepper` 或自研数量控件 + 修改接口 + 删除（含确认）+ 批量清空 | 连点 5 次只发 1 次请求；删除后合计正确 |
| S6-3 全选与失效商品 | 全选要跳过失效项；失效不可结算 | 全选/反选 + 失效分组 + 结算按钮按选中数禁用 | 有失效时全选不选它；0 选中时按钮禁用 |
| S6-4 未登录与合并 | 本地车 + 登录后合并策略 | 未登录写 storage；登录后合并到服务端并重拉 | 未登录加的货登录后出现在购物车且不重复 |

**接口**：第 39–42 条。

**坑**：`setData` 用路径写法只更新单项（`'cartList[3].count'`），整表重设会闪；tabBar 页切换不会重新 `onLoad`，只走 `onShow`。

---

### S7 结算 / 订单 / 支付（3 天）

**目标**：跑通「结算 → 提交 → 支付 → 订单列表 → 订单详情 → 取消/确认收货」完整链路。

**知识点**：结算页数据组装（`pre` 订单 + 地址）、金额精度处理、`wx.requestPayment` 参数结构、页面栈（`redirectTo` vs `navigateTo`）、倒计时与 `onUnload` 清理、订单状态机与 tab 复位。

| 任务 | 我讲 | 你写 | 验收 |
|---|---|---|---|
| S7-1 结算页 | 结算数据从哪来；地址选择怎么做 | 结算页：地址、商品清单、配送时间、支付方式、金额明细 | 地址与金额正确；无地址时禁止提交 |
| S7-2 提交订单 | 入参只需 `skuId + count + addressId`；提交后刷新购物车 | 提交订单 → 成功后 `redirectTo` 支付页 | 下单进支付页；购物车已移除已下单项 |
| S7-3 支付 | `wx.requestPayment` 五个参数；失败分支 | 支付页：倒计时、金额、支付按钮（先跑模拟支付） | 模拟支付成功后订单变「待发货」 |
| S7-4 订单列表 | 状态 tab 与分页；切 tab 复位 | 订单列表 + 状态 tab + 触底加载 + 空态 | 各 tab 数据正确，切换不串数据 |
| S7-5 订单详情 | 状态与可操作按钮的对应关系 | 详情页：状态条、收货信息、商品清单、金额、订单信息；取消/确认收货/删除 | 取消后变「已取消」；收货后变「已完成」 |

**接口**：第 27–37、43–44 条。

**坑**：倒计时定时器必须 `onUnload` 清掉；`wx.requestPayment` 在开发者工具常调不起，先保证模拟支付链路通；`redirectTo` 会销毁当前页，别在支付页返回时依赖上一页实例。

---

### S8 分包与性能收尾（1.5 天）

**目标**：交付能真机流畅跑、体积可控的版本。

**知识点**：分包配置与主/分包划分、`preloadRule` 预下载、图片 `lazy-load` 与 CDN 尺寸裁剪、`setData` 性能（数据量/频率）、`onPageScroll` 节流、体验评分与真机调试。

| 任务 | 我讲 | 你写 | 验收 |
|---|---|---|---|
| S8-1 分包落地 | 为什么 tab 页不能进分包；分包体积上限 | 把详情/搜索/结算/支付/订单/地址迁到 `packageGoods`；配 `preloadRule` | 主包 < 2MB；首页进详情无白屏 |
| S8-2 性能优化 | setData 三条铁律；TDesign 按需引入对体积的影响 | 列表只 setData 增量；图片 `lazy-load` + CDN 参数；滚动节流 | 长列表滚动不掉帧；体验评分 ≥ 85 |
| S8-3 真机与文档 | 域名白名单、HTTPS、样式兼容等真机问题 | 真机全链路走一遍并记录；补 `README.md`（启动、构建 npm、测试账号） | 真机可完整下单支付；他人照 README 能跑起来 |

---

## 6 待确认项与风险

| # | 项 | 影响 | 处理 |
|---|---|---|---|
| 1 | 各接口真实 path / 入参 / 响应字段 | 所有阶段 | 每个接口编码前「取字段」，或导出 OpenAPI JSON 到 `idoc/` |
| 2 | 小程序登录接口需要什么字段（code？phoneCode？） | S5 | 进 S5 前查文档；不明确先用「内测版登录」跑通 |
| 3 | `Authorization` 是否需要 `Bearer` 前缀 | S1/S5 | React 版带 `Bearer`，文档写 `<token>`，以文档示例为准，S1 实测 |
| 4 | 收藏无对应接口 | S5 | 降级本地 storage，或降级为纯 UI |
| 5 | TDesign 组件与自定义样式的冲突（样式隔离、`externalClasses`） | S2–S7 | 优先用 TDesign 的 `custom-style` / CSS 变量，不硬改内部类名 |
| 6 | 微信支付在开发者工具不可用 | S7 | 主链路走模拟支付，真机再验 `requestPayment` |
| 7 | 富文本详情图宽度 | S4 | `rich-text` + 全局样式覆盖，或后端图片自带宽度 |
| 8 | JS → TS 迁移时机 | 全程 | 守 2.4 五条约定即可低成本迁移，不提前引入 |

---

## 7 推进记录

| 日期 | 阶段 | 完成情况 | 遇到的问题 / 备注 |
|---|---|---|---|
| 2026-11-24 | 计划制定 | 文档 v2 落地 | 技术栈确认为 JS + SCSS + WebView + TDesign；模板预置的 TS/Skyline 需在 S0 拆除 |
| 2026-11-24 | S0-1 | 完成 | 关闭 Skyline（两处开关）、TS→JS、删 logs 与空目录、建 `global.scss`、`getSystemInfo`→`getWindowInfo`。手册：`stages/S0.md`。待你在工具里编译确认 |
| | | | |
