# 00 · 项目总览与范围界定

> 目标读者：**零小程序基础**、但已经独立做完 React 版商城的你。
> 一句话：把 `F:/Web/react-rabbit` 当**需求文档 + 交互参考**，在 `f:/WeChatProjects/miniprogram-rabbit` 里用小程序原生框架再长出一套同一业务的商城。

---

## 1. 为什么是「同一份业务的第三次落地」

| 学习痛点 | 本项目的解药 |
| --- | --- |
| 小程序教程都是玩具项目，学完不知道怎么组织真实工程 | 直接继承 30 个页面、44 个接口、登录/购物车/订单/支付全链路的真实复杂度 |
| 不知道小程序的写法「对应」React 的什么 | 每个页面都能与 React 版逐行对照，差异点就是知识点（见 `01-migration-map.md`） |
| 一上来就被框架概念淹没 | 先用最小页面跑通，再逐步引入组件、请求层、分包 |
| 学完只会抄，不会判断 | 每个阶段有「新旧写法对照」与「闸门答辩」，答不出不许进入下一阶段 |

**核心方法论：三遍法。** 每做一个页面 ——
① 先读 React 版对应文件，列出「数据从哪来、有哪些交互、有哪些状态」；
② 关掉它，用小程序重写；
③ 打开它逐条对照，把差异写进该阶段文档的「复盘」一节。

第 ③ 步才是真正学到东西的地方，也是本项目区别于「抄教程」的地方。

---

## 2. 协作方式（与 React 版项目不同）

本项目是**学习驱动**，不是「AI 代写项目」。每个任务固定三段式：

| 段 | 谁做 | 内容 |
| --- | --- | --- |
| 讲 | AI | 只讲这一个知识点：解决什么问题、小程序怎么写、和 Web/React 的差异、常见坑 |
| 写 | 你 | 按阶段文档的 Step 动手；AI 最多给最小片段，不给整文件 |
| 验收 | AI | 对照验收清单逐条检查，指出问题，通过后才进下一步 |

三条节奏约束：

1. **一次只推进一个 Step**，不跳步、不批量补代码。
2. 动手前先确认「这次我讲你写，还是我代写」——默认是你写。
3. 卡住超过 20 分钟直接说，拆更小的步骤，而不是等答案。
4. 实现和规划过程中要额外参考接口文档：https://s.apifox.cn/0e6ee326-d646-41bd-9214-29dbf47648fa

---

## 3. 交付物

```
f:/WeChatProjects/miniprogram-rabbit/
├── idoc/                 # 方案 + S0~S7 阶段任务书 + 作业看板 + 验收总表
├── miniprogram/          # 小程序源码（17 个页面，全部在主包，无分包）
│   ├── package.json      # 依赖与 lint/format 脚本（构建 npm 只认这里）
│   └── data/areas.js     # 由 china-division 生成的省市区数据（勿手改）
├── typings/              # TS 类型声明（为未来迁移保留，当前不参与编译）
├── tsconfig.json         # 同上；当前无 .ts 业务源码
├── project.config.json   # 开发者工具项目配置（AppID 为公开标识）
└── README.md             # 运行入口与已知限制
```

**依赖装但 npm 构建要做。** `miniprogram/package.json` 含 `tdesign-miniprogram`、`lodash.debounce`、`tslib` 三个运行时依赖；小程序不能直接读 `node_modules`，必须在开发者工具里执行 **工具 → 构建 npm**，产物落在 `miniprogram/miniprogram_npm/`（已加入 `.gitignore`）。

---

## 4. 两条红线

1. **React 版只读**：`F:/Web/react-rabbit` 一行都不改，它是你的标准答案。
2. **先讲后写**：阶段任务书按「学习目标 → 前置知识 → Step → 验收」推进；新加页面先走 `02-architecture.md` 的页面骨架约定，再补业务。

---

## 5. 纳入范围

| 维度 | 纳入内容 |
| --- | --- |
| 框架 | 微信小程序**原生**：JavaScript（ES6+）+ SCSS + rpx |
| 渲染 | **WebView 默认渲染**（Skyline 已在 S0 拆除，理由见 `stage-s0-scaffold.md`） |
| UI | **TDesign Miniprogram**（npm 构建，按需 `usingComponents` 引入） |
| 页面 | 首页、分类、二级分类、搜索、详情+SKU、购物车、登录、我的、地址、订单列表/详情、结算、支付、物流（可选） |
| 接口 | Apifox 文档 11 组 44 个接口，dev 域名 `https://pcapi-xiaotuxian-front-devtest.itheima.net` |
| 请求层 | 自建 `utils/request.js`：Promise 封装 + 统一头 + token 注入 + 401 处理 |
| 状态 | 页面 `data` 为主 + `storage` 持久化 + `globalData` 兜底；**不引入状态库** |
| 工程 | 17 页全部在主包（未做分包，`app.json` 无 `subPackages`）；`lazyCodeLoading` 按需注入 |
| 安全 | 类型用 JSDoc 标注，保留 TS 迁移能力（见 `02-architecture.md` §6） |

## 6. 明确不纳入（附替代做法）

| 不做的 | 原因 | 替代做法 |
| --- | --- | --- |
| TypeScript | 你的选择：先聚焦小程序本身，后续再迁 | JSDoc 标类型 + 保留 `typings/`、`tsconfig.json` |
| Skyline 渲染引擎 | 组件库生态未适配，教程资料少 | WebView 默认渲染 |
| Taro / uni-app 跨端 | 会跳过小程序原生 API，与学习目标冲突 | 原生框架 |
| 真实微信支付 | 接口文档只有「获取支付参数」+「模拟支付-内测版」 | 主链路走模拟支付，`wx.requestPayment` 只做调起验证 |
| 商品收藏（服务端） | 接口文档无收藏分组 | 本地 `storage` 降级版（S5 选做） |
| 注册页 | 无注册接口 | 不做；登录页注明使用测试账号 |
| 单元测试 | 小程序测试基建成本高、对本阶段收益低 | 关键纯函数（SKU 组合）用手工用例自查 |
| CI / 自动部署 | 需要小程序私钥与云环境 | 手动上传体验版 |
| 自定义状态管理库（mobx 等） | 会掩盖「数据从哪来」的问题 | 每页 `onShow` 重新对齐服务端 + `storage` 兜底 |

## 7. 「做完」的判定口径

三层口径，缺一不可：

**L1 结构对齐（能看）**
- 目录结构与 `02-architecture.md` 一致，页面一页四件套（`.js/.json/.wxml/.scss`）
- 每个页面都能在 React 版找到对应文件（对照表见 `01-migration-map.md`）
- 组件拆分粒度与 React 版同量级，不出现「一个 wxml 800 行」

**L2 功能对齐（能用）**
- 逐页对照 `checklist.md` 的「功能对齐矩阵」勾选，含 loading / empty / error 三态
- 购物车：未登录本地加购、改数量、勾选、删除，登录后与服务端合并
- 登录：token 持久化，杀进程重进不掉线，401 自动退出并回跳

**L3 质量红线（能交付）**
- 控制台无报错、无未定义变量警告
- 无内存泄漏：倒计时 `setInterval` 在 `onUnload` 清理
- 列表 `wx:key` 用业务 id，不用数组下标
- 主包 < 2MB，真机走完整下单链路不崩

## 8. 页面清单与阶段归属

| # | 页面 | React 版对应 | 小程序目标文件 | 阶段 |
| --- | --- | --- | --- | --- |
| 1 | 首页 | `pages/home/index.jsx` + 6 个子组件 | `pages/index/` | S2 |
| 2 | 一级分类 | `pages/category/index.jsx` | `pages/category/` | S3 |
| 3 | 二级分类 | `pages/sub-category/index.jsx` | `pages/category/sub/` | S3 |
| 4 | 搜索 | 无（React 版搜索框未接接口） | `pages/search/` | S3 |
| 5 | 商品详情 | `pages/detail/index.jsx` | `pages/goods/detail/` | S4 |
| 6 | SKU 选择器 | `detail/components/SkuSelector` | `components/sku-panel/` | S4 |
| 7 | 购物车 | `pages/cart/index.jsx` | `pages/cart/` | S6 |
| 8 | 登录 | `pages/login/index.jsx` | `pages/login/` | S5 |
| 9 | 我的 | `pages/member/index.jsx` | `pages/member/` | S5 |
| 10 | 个人资料 | `member/components/UserInfo` | `pages/profile/` | S5 |
| 11 | 地址列表/编辑 | `member/components/UserAddress` | `pages/address/list/`、`pages/address/edit/` | S5 |
| 12 | 结算 | `pages/checkout/index.jsx` | `pages/order/confirm/` | S7 |
| 13 | 支付 | `pages/pay/index.jsx` | `pages/order/pay/` | S7 |
| 14 | 订单列表 | `member/components/UserOrder` | `pages/order/list/` | S7 |
| 15 | 订单详情 | `member/components/OrderDetail` | `pages/order/detail/` | S7 |
| 16 | 物流 | 无 | `pages/order/logistics/` | S7 |
| 17 | 收藏（降级） | `member/components/UserCollect` | `pages/collect/` | S5 选做 |
| 17 | 注册页 | `pages/register`（占位） | 不做 | — |
| 18 | 404 页 | `pages/not-found` | 不做（小程不会 404） | — |

> 另有 10 个 API 模块、1 个 SKU 幂集纯函数、1 个倒计时逻辑，映射见 `01-migration-map.md`。

## 9. 使用这套文档的顺序

1. 读本文件（范围与口径）→ `01-migration-map.md`（查表手册）→ `02-architecture.md`（目录与数据流）。
2. 读 `03-roadmap.md` 的阶段总览与工时表，把 9 个阶段排进日历。
3. 进入 `stage-sX-*.md`，按「学习目标 → 前置知识 → Step → 验收 → 报错急救」推进。
4. **每阶段结束前过作业闸门**：`assignments.md` 里该阶段必做作业全部完成、答辩 3 问能脱稿回答，才可进入下一阶段。
5. 每阶段完成后回 `checklist.md` 勾选对应区块。

> 阶段编号统一用 **S0–S8**（与代码提交信息一致）。当前已建任务书 `stage-s0`…`stage-s8`；S8（分包与性能收尾）的任务书是 `stage-s8-subpackage-release.md`，代码已完成，待体验版真机回归。`S0` 对应「阶段 1」。
