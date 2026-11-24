# 03 · 路线图与接口映射

> 节奏假设：**每天 3 小时以上**，总工期约 19 个工作日（4 周）。
> 每阶段的详细任务书在 `stage-sX-*.md`，进入该阶段时才创建/展开，避免提前写一堆用不上的细节。

---

## 1. 阶段依赖图

```
S0 配置迁移与骨架
 └→ S1 请求层与鉴权
     └→ S2 首页 ─────────────┐
         └→ S3 分类与搜索     │
             └→ S4 详情与 SKU ┤
                 └→ S5 登录与个人中心
                     └→ S6 购物车
                         └→ S7 结算/订单/支付
                             └→ S8 分包与性能收尾
```

硬依赖说明：

| 依赖 | 原因 |
| --- | --- |
| S2–S7 都依赖 S1 | 没有请求层，每页各写一份 `wx.request`，后面必然返工 |
| S4 依赖 S3 可选 | 详情页入口在分类/首页，可先用首页数据直接跳 |
| S6 依赖 S5 | 购物车合并必须登录才成立 |
| S7 依赖 S6 | 结算数据来自购物车或详情「立即购买」 |
| S8 依赖全部 | 分包是把已经存在的页面搬进 `packageGoods` |

---

## 2. 阶段总览

| 阶段 | 主题 | 工时 | 主要产出 | 里程碑判定 | 任务书 |
| --- | --- | --- | --- | --- | --- |
| S0 | 配置迁移与工程骨架 | 1.5 天 | 关 Skyline、TS→JS、TDesign 接入、`global.scss`、tabBar | tabBar 四页可互跳、TDesign 按钮可点 | `stage-s0-scaffold.md` |
| S1 | 请求层与鉴权 | 1.5 天 | `request.js`、`env.js`、`api/home.js`、401 链路 | 真实接口出数据，401 跳登录且只跳一次 | 阶段开始时创建 |
| S2 | 首页 | 2 天 | 自定义导航、轮播、分类宫格、楼层、分页 | 5 个区块正确，切 tab 不重复请求 | 同上 |
| S3 | 分类与搜索 | 2 天 | 左右联动、二级分类排序分页、搜索页 | 排序切 tab 回第 1 页，触底加载，搜索有结果 | 同上 |
| S4 | 商品详情与 SKU | 3 天 | 详情页、图片预览、SKU 面板、加购 | 规格禁用态正确，价格库存联动 | 同上 |
| S5 | 登录与个人中心 | 2.5 天 | `wx.login` 闭环、我的、资料、地址 | 未登录跳登录并回跳，地址增删改查通过 | 同上 |
| S6 | 购物车 | 2 天 | 列表、勾选、数量、删除、登录合并 | 算价正确，失效不可结算，未登录车能合并 | 同上 |
| S7 | 结算 / 订单 / 支付 | 3 天 | 结算、提交、支付、订单列表与详情 | 全链路下单→支付→状态流转正确 | 同上 |
| S8 | 分包与性能收尾 | 1.5 天 | 分包搬迁、图片懒加载、setData 优化、真机 | 主包 < 2MB，真机整链路通过 | 同上 |

合计约 **19 天**。

---

## 3. 每阶段知识点索引（复习用）

| 阶段 | 核心知识点 |
| --- | --- |
| S0 | 四件套与 `app.json`、`tabBar`、`subPackages`、rpx、SCSS 公共文件、npm 构建、WebView vs Skyline |
| S1 | `wx.request` Promise 化、拦截器、超时与并发、`Promise.all`、JSDoc 类型、token 生命周期、401 回跳 |
| S2 | 自定义导航与胶囊安全区、`swiper`、`wx:for`/`wx:key`、自定义组件（`properties`/`observers`/`triggerEvent`）、`onShow` vs `onLoad`、`onReachBottom`、`onPullDownRefresh`、骨架屏 |
| S3 | 双 `scroll-view` 联动（`scroll-into-view`）、`position: sticky`、排序参数与分页复位、输入防抖、POST 传 body、空态 |
| S4 | `onLoad(options)`、`wx.previewImage`、`t-popup`、`triggerEvent`、`properties` 引用陷阱、幂集算法、库存夹取 |
| S5 | `wx.login` 与 code 时效、storage、登录回跳、`chooseAvatar`/`type="nickname"`、`wx.uploadFile`、`wx.chooseAddress`、表单校验 |
| S6 | tabBar `onShow` 刷新、派生状态（全选/合计）、防抖与乐观更新、`t-stepper`/`t-swipe-cell`、`wx.showModal` |
| S7 | 结算数据组装、金额精度、`wx.requestPayment` 参数、`redirectTo` vs `navigateTo`、倒计时清理、订单状态机 |
| S8 | 分包与 `preloadRule`、图片 `lazy-load` 与 CDN 裁剪、`setData` 数据量/频率、`onPageScroll` 节流、体验评分 |

---

## 4. 接口 × 页面 × 阶段 映射（44 个 Apifox 文档化 + 1 个实测未收录）

### 4.1 请求约定

- 基础地址：`https://pcapi-xiaotuxian-front-devtest.itheima.net`，只在 `config/env.js` 出现一次。
- 必带 `source-client: miniapp`；登录类接口带 `Authorization: <token>`。
- 响应 `{ code, msg, result }`，`code === "1"`（字符串）为成功，实测见 `stage-s1-request.md`。
- 下表路径来自 **Apifox 接口定义导出**（`api-reference.md`，2026-11-24 抓取 44 个接口的 method/path/字段），不再使用 React 版推测路径。

### 4.2 映射表

| # | 分组 | 接口 | 方法 | 路径 | 落地页面 | 阶段 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 首页 | 广告区域-小程序 | GET | `/home/banner?distributionSite=1` | 首页 / 分类页 | S2 |
| 2 | 首页 | 前台分类-小程序 | GET | `/home/category/mutli` | 首页宫格、分类页左侧 | S2/S3 |
| 3 | 首页 | 热门推荐-小程序 | GET | `/home/hot/mutli` | 首页楼层入口 | S2 |
| 4 | 首页 | 新鲜好物-小程序 | GET | `/home/new` | 首页楼层 | S2 |
| 5 | 首页 | 猜你喜欢-小程序 | GET | `/home/goods/guessLike?page=&pageSize=` | 首页猜你喜欢 | S2 |
| 6 | 首页 | 分类楼层（Apifox 未收录，实测可用） | GET | `/home/goods` | 首页楼层 | S2 |
| 7 | 热门推荐 | 特惠推荐-小程序 | GET | `/hot/preference` | 分类/搜索筛选 | S3 |
| 8 | 热门推荐 | 爆款推荐-小程序 | GET | `/hot/inVogue` | 同上 | S3 |
| 9 | 热门推荐 | 一站买全-小程序 | GET | `/hot/oneStop` | 同上 | S3 |
| 10 | 热门推荐 | 新鲜好物-小程序 | GET | `/hot/new` | 同上 | S3 |
| 11 | 搜索 | 商品搜索-带筛选条件 | POST | `/search/all` | 搜索页 | S3 |
| 12 | 搜索 | 提示语 | GET | `/search/tips?keyword=` | 搜索联想 | S3 |
| 13 | 商品分类 | 分类列表-小程序 | GET | `/category/top` | 分类页 | S3 |
| 14 | 商品详情 | 商品详情 | GET | `/goods?id=` | 详情页 | S4 |
| 15 | 商品详情 | 同类推荐（将废弃） | GET | `/goods/relevant` | 详情页底部 | S4 可选 |
| 16 | 会员登录 | 小程序登录 | POST | `/login/wxMin` | 登录 | S5 |
| 17 | 会员登录 | 小程序登录-内测版 | POST | `/login/wxMin/simple` | 登录（调试） | S5 |
| 18 | 会员登录 | 传统登录-用户名+密码 | POST | `/login` | 登录（备用） | S5 |
| 19 | 会员登录 | 刷新 token | PUT | `/login/refresh` | 请求层 | S5 |
| 20 | 个人信息 | 获取个人信息 | GET | `/member/profile` | 我的 | S5 |
| 21 | 个人信息 | 修改个人信息 | PUT | `/member/profile` | 资料编辑 | S5 |
| 22 | 个人信息 | 修改用户头像 | POST | `/member/profile/avatar` | 资料编辑 | S5 |
| 23 | 地址管理 | 添加收货地址 | POST | `/member/address` | 地址编辑 | S5 |
| 24 | 地址管理 | 删除收货地址 | DELETE | `/member/address/{id}` | 地址列表 | S5 |
| 25 | 地址管理 | 修改收货地址 | PUT | `/member/address/{id}` | 地址编辑/设默认 | S5 |
| 26 | 地址管理 | 获取收货地址详情 | GET | `/member/address/{id}` | 地址编辑 | S5 |
| 27 | 地址管理 | 获取收货地址列表 | GET | `/member/address` | 地址列表/结算 | S5 |
| 28 | 订单管理 | 获取预付订单 | GET | `/member/order/pre` | 结算页 | S7 |
| 29 | 订单管理 | 获取立即购买订单 | GET | `/member/order/pre/now` | 详情页「立即购买」 | S7 |
| 30 | 订单管理 | 获取再次购买订单 | GET | `/member/order/repurchase/{id}` | 订单详情 | S7 |
| 31 | 订单管理 | 提交订单 | POST | `/member/order` | 结算页 | S7 |
| 32 | 订单管理 | 获取订单详情 | GET | `/member/order/{id}` | 订单详情/支付页 | S7 |
| 33 | 订单管理 | 模拟发货-内测版 | GET | `/member/order/consignment/{id}` | 订单详情（调试） | S7 |
| 34 | 订单管理 | 确认收货 | PUT | `/member/order/{id}/receipt` | 订单列表/详情 | S7 |
| 35 | 订单管理 | 获取订单物流 | GET | `/member/order/{id}/logistics` | 物流页 | S7 可选 |
| 36 | 订单管理 | 删除订单 | DELETE | `/member/order` | 订单列表 | S7 |
| 37 | 订单管理 | 取消订单 | PUT | `/member/order/{id}/cancel` | 订单详情 | S7 |
| 38 | 订单管理 | 获取订单列表 | GET | `/member/order` | 订单列表 | S7 |
| 39 | 购物车 | 加入购物车 | POST | `/member/cart` | 详情页 | S4/S6 |
| 40 | 购物车 | 获取购物车列表 | GET | `/member/cart` | 购物车/结算 | S6 |
| 41 | 购物车 | 删除/清空单品 | DELETE | `/member/cart` | 购物车 | S6 |
| 42 | 购物车 | 修改购物车单品 | PUT | `/member/cart/{skuId}` | 购物车 | S6 |
| 43 | 购物车 | 全选/取消全选 | PUT | `/member/cart/selected` | 购物车 | S6 |
| 44 | 支付 | 获取微信支付参数 | GET | `/pay/wxPay/miniPay?orderId=` | 支付页 | S7 |
| 45 | 支付 | 模拟支付-内测版 | GET | `/pay/mock?orderId=` | 支付页（调试） | S7 |

---

## 5. 里程碑

| 里程碑 | 对应阶段 | 判定标准 |
| --- | --- | --- |
| **M0** 骨架就绪 | S0 | tabBar 四页可互跳；TDesign 组件可渲染并响应事件；样式变量生效 |
| **M1** 数据通 | S1 | 首页接口返回真实数据；401 自动跳登录并回跳来源页 |
| **M2** 首页可逛 | S2 | 5 个区块渲染正确；分页、下拉刷新、骨架屏可用 |
| **M3** 能找商品 | S3 | 分类联动、排序分页、搜索与筛选可用 |
| **M4** 能看能选 | S4 | 详情页完整；SKU 禁用态正确；能加入购物车 |
| **M5** 能登录能管理 | S5 | 登录闭环；资料与地址增删改查通过 |
| **M6** 能算钱 | S6 | 购物车勾选、数量、删除、合计与登录合并正确 |
| **M7** 能下单 | S7 | 结算→提交→支付→订单列表/详情全链路 |
| **M8** 能交付 | S8 | 主包 < 2MB；真机整链路无卡顿；README 可复现 |

---

## 6. 进度

实时勾选状态见 `assignments.md` 的「进度看板」；阶段完成后的复盘写在各 `stage-sX-*.md` 的末尾。
