# 01 · 迁移对照手册

> 用法：写代码时查表用。左边是你已经会的 React 版，右边是小程序对应物。
> 三条原则：① 业务逻辑可以照搬，平台 API 必须重写；② 接口路径以 Apifox 为准，不照抄 React 版；③ 字段名去 Apifox 子页面确认。

---

## 1. 技术栈映射

| 维度 | React 版（`F:/Web/react-rabbit`） | 小程序版（本项目） |
| --- | --- | --- |
| 框架 | React 18 + Vite 5 | 微信小程序原生 |
| 语言 | JavaScript（JSX） | JavaScript（无 JSX） |
| 视图 | JSX 函数组件 | WXML 模板 + `{{}}` 数据绑定 |
| 样式 | Sass（`.scss`）+ CSS 变量 | SCSS 编译成 WXSS，单位 `rpx` |
| 路由 | React Router 6（`createBrowserRouter`） | `app.json` 的 `pages` + `wx.navigateTo` |
| 状态 | Redux + RTK（4 个 slice） | 页面 `data` + `storage` + `globalData` |
| 请求 | axios（`utils/http.js`） | `wx.request` 封装（`utils/request.js`） |
| UI 库 | Ant Design 5 | TDesign Miniprogram |
| 环境变量 | `.env` + `import.meta.env` | `config/env.js` 手写常量 |
| 代码分割 | Vite 动态 `import()` | 分包 `subPackages` |

---

## 2. 概念映射（最容易卡住的地方）

| React 概念 | 小程序对应 | 关键差异 |
| --- | --- | --- |
| `useState` 的 state | `Page({ data })` / `Component({ data })` | 改数据**只能** `this.setData()`，直接 `this.data.x = 1` 界面不更新 |
| `props` | `properties`（组件）/ 页面传参 `onLoad(options)` | `properties` 只能声明基础类型或对象，父传子单向 |
| 子传父 `onChange` 回调 | `this.triggerEvent('change', detail)` + 父级 `bind:change` | 事件名**必须全小写**，驼峰会失效 |
| `useEffect(() => {}, [])` | `lifetimes.attached` / `Page.onLoad` | 只执行一次；`onShow` 是「每次显示」，切 tab 会重复触发 |
| `useEffect` 清理函数 | `lifetimes.detached` / `onUnload` | 定时器、监听必须在这里清 |
| `useMemo` | 手动缓存到 `this.xxx` 或模块变量 | 没有内置记忆化，靠手动 |
| `Context` / Redux | `getApp().globalData` 或模块单例 | `globalData` **不是响应式**，改完要让页面自己重新取 |
| `useNavigate` | `wx.navigateTo`（保留上一页）/ `wx.redirectTo`（替换）/ `wx.switchTab`（跳 tab） | 页面栈最多 10 层 |
| `useParams` | `onLoad(options)` 的 `options` | 参数是字符串，数字要自己转 |
| `<Suspense>` 懒加载 | `subPackages` 分包 | 分包页面首次进入才下载 |
| `localStorage` | `wx.setStorageSync` / `getStorageSync` | 同步 API 会阻塞，大量数据用异步版 |
| `<img />` | `<image>` | 必须给宽高，否则默认尺寸（320×240）会撑破布局 |
| CSS `100vh` | `100vh` 可用，但更推荐 `100%` + `page { height: 100% }` | 小程序 `page` 是根节点 |
| `window.scrollY` | 页面级 `onPageScroll` / `scroll-view` 的 `bindscroll` | 页面滚动与 `scroll-view` 滚动是两套事件 |

---

## 3. 写法速查

| 场景 | React | 小程序 |
| --- | --- | --- |
| 渲染列表 | `list.map(i => <div key={i.id}>{i.name}</div>)` | `<view wx:for="{{list}}" wx:key="id">{{item.name}}</view>` |
| 条件渲染 | `{ok && <div/>}` | `<view wx:if="{{ok}}"></view>` |
| 多项分支 | 三元表达式 | `wx:if` / `wx:elif` / `wx:else` |
| 绑定事件 | `onClick={fn}` | `bind:tap="fn"`（或 `bindtap`） |
| 事件取值 | `e.target.value` | `e.detail.value`（表单）/ `e.currentTarget.dataset`（自定义参数） |
| 传自定义参数 | 闭包捕获 | `data-id="{{item.id}}"` + `e.currentTarget.dataset.id` |
| 动态 class | `className={active ? 'on' : ''}` | `class="item {{active ? 'on' : ''}}"` |
| 双向绑定 | `value + onChange` | `model:value="{{x}}"`（简易双向绑定，限基础类型） |
| 组件引入 | `import X from './X'` | 页面 `json` 的 `usingComponents` 声明 |
| 插槽 | `children` | `<slot>` + `multipleSlots` |
| 样式作用域 | CSS Modules / 全局 | 页面样式默认隔离；组件默认 `isolated`，可设 `apply-shared` |
| 单位 | `px` / `rem` | `rpx`（750rpx = 屏幕宽度） |
| 环境判断 | `import.meta.env.MODE` | `wx.getAccountInfoSync().miniProgram.envVersion` |

---

## 4. 接口模块映射

| React 版文件 | 小程序目标文件 | Apifox 分组 | 备注 |
| --- | --- | --- | --- |
| `src/apis/home.js` | `api/home.js` | 首页模块、热门推荐 | banner / new / hot / goods |
| `src/apis/layout.js` | `api/home.js` | 首页模块 | `/home/category/head`，全应用只需一次 |
| `src/apis/category.js` | `api/category.js` | 商品分类 | 只有 `GET /category/top`，一次返回两级分类 + 商品树，无 filter 接口（Apifox 已确认） |
| `src/apis/detail.js` | `api/goods.js` | 商品详情 | 详情、同类推荐 |
| —（React 版无） | `api/search.js` | 搜索模块 | 小程序版新增，含提示语 |
| `src/apis/user.js` | `api/user.js` | 会员登录、个人信息 | 登录方式改为 `wx.login` |
| `src/apis/address.js` | `api/address.js` | 会员中心-地址管理 | 5 个接口 |
| `src/apis/cart.js` | `api/cart.js` | 购物车 | 5 个接口 |
| `src/apis/checkout.js` + `order.js` | `api/order.js` | 订单管理 | 小程序版 11 个接口 |
| `src/apis/pay.js` | `api/pay.js` | 支付 | 微信支付参数 + 模拟支付 |
| `src/apis/collect.js` | —（降级） | 无此分组 | 见 §7 |

> 完整 44 个接口与页面/阶段的对应表见 `03-roadmap.md` §4。

---

## 5. 组件映射

| React 版 | 小程序目标 | 说明 |
| --- | --- | --- |
| `HomeBanner` / `HomeCategory` / `HomeNew` / `HomeHot` / `HomeProduct` / `HomePanel` | `components/goods-card`、`components/panel-title` + 页面内区块 | 小程序组件开销更大，能内联就内联 |
| `GoodsItem` | `components/goods-card` | 2 列/3 列复用同一组件 |
| `ImageView`（大图预览） | 直接 `wx.previewImage` | 无需自研 |
| `SkuSelector` + `power-set.js` | `components/sku-panel/` + `utils/sku.js` | 幂集算法可直接搬，弹层用 `t-popup` |
| `CountInput` | `t-stepper`（TDesign） | 先评估内置组件，不满足再自研 |
| `CartItemRow` | 购物车页内联 + `t-swipe-cell`（左滑删除） | — |
| `CancelOrderModal` | `t-dialog` | — |
| `UserAddress` + `AddressForm` | 地址列表页 + 地址编辑页（两个页面） | 小程序表单更适合独立页面 |
| `UserOrder` / `OrderDetail` | `order-list` / `order-detail` 两个页面 | tab 用 `t-tabs` |
| `RootBridge`（401 处理） | `utils/request.js` 内统一处理 | — |

---

## 6. UI 组件映射（Ant Design → TDesign）

| 用途 | Ant Design 5 | TDesign Miniprogram |
| --- | --- | --- |
| 按钮 | `Button` | `t-button` |
| 输入框 | `Input` | `t-input` |
| 搜索框 | `Input.Search` | `t-search` |
| 标签页 | `Tabs` | `t-tabs` |
| 弹层 | `Modal` / `Drawer` | `t-dialog` / `t-popup` |
| 抽屉 | `Drawer` | `t-popup` + `placement` |
| 消息提示 | `message` | `t-toast` + `Toast()` API |
| 空态 | `Empty` | `t-empty` |
| 加载 | `Spin` | `t-loading` |
| 骨架屏 | `Skeleton` | `t-skeleton` |
| 数量步进 | `InputNumber` | `t-stepper` |
| 图片 | `Image` | `t-image`（**必须给宽高**） |
| 徽标 | `Badge` | `t-badge` |
| 单元格 | `List` | `t-cell` / `t-cell-group` |
| 复选框 | `Checkbox` | `t-checkbox` / `t-checkbox-group` |
| 左滑删除 | —（Antd 无） | `t-swipe-cell` |
| 地址选择 | `Select` + 级联 | `t-picker` + `wx.chooseAddress` |

> 引入方式：页面 `json` 的 `usingComponents` 里写 `"t-button": "tdesign-miniprogram/button/button"`。**必须先执行「工具 → 构建 npm」**。

---

## 7. 能力缺口与降级方案

| 能力 | React 版 | 小程序版 | 处理 |
| --- | --- | --- | --- |
| 商品收藏 | `/member/collect` 三个接口 | 接口文档**无收藏分组** | 本地 `storage` 降级；S5 选做 |
| 真实支付 | 支付宝跳转 | 只有「获取微信支付参数」「模拟支付」 | 主链路走模拟支付 |
| 注册 | 占位页 | 无接口 | 不做 |
| 搜索 | 搜索框未接接口 | 有搜索 + 提示语接口 | 小程序版**新增**，是差异项 |
| SKU 库存 | 单独查 `/goods/stock/:skuId` | 文档无独立接口 | 用详情响应里的 `skus[].inventory` |
| 猜你喜欢 | `/goods/relevant` + 逐条查详情（N+1） | `/home/goods` 直接返回 | 小程序版更简单 |
| 省市区选择 | 本地 `constants/areas.js` + 级联 | `wx.chooseAddress` + `t-picker` | 体验更好，代码更少 |

---

## 8. 有意识的差异（要在笔记里写清理由）

| # | 差异 | 类型 | 原因 |
| --- | --- | --- | --- |
| 1 | 新增搜索页 | 增强 | 小程序接口文档有搜索能力，React 版没有 |
| 2 | 收藏改为本地 | 降级 | 无接口 |
| 3 | 支付走模拟 | 降级 | 无商户号 |
| 4 | 详情库存从详情响应取 | 等价 | 无独立库存接口 |
| 5 | 地址编辑独立成页 | 必须 | 小程序弹层内做长表单体验差 |
| 6 | 不实现注册/404 | 裁剪 | 无接口、小程序无 404 概念 |
| 7 | 生产域名用 `pcapi-` | 修正 | React 版写作 `apipc-xiaotuxian-front.itheima.net`，接口文档是 `pcapi-xiaotuxian-front.itheima.net`，以文档为准 |
