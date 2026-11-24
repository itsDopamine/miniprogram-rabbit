# 阶段 S7 · 结算 / 订单 / 支付

> 状态：**Step 1–7 代码完成**（结算 / 提交 / 模拟支付 / 订单列表 / 详情）；Step 8「立即购买」未做；支付只能走模拟接口，见 §2.4
> 工时：3 天 · 前置：S6 购物车（勾选与合计）、S5 登录与地址
> 关联：[`api-reference.md`](./api-reference.md) 订单管理 / 支付分组、[`stage-s6-cart.md`](./stage-s6-cart.md)

---

## 1. 学习目标

- 讲清「结算页的钱是谁算的」：为什么下单参数必须来自服务端预订单，而不是前端把购物车加一遍
- 会做金额的最后一道防线：单价怎么显示、合计怎么算、三处（购物车 / 结算 / 订单）怎么保证一致
- 会说清订单状态机：哪些状态能取消、哪些能确认收货、哪些能删除
- 会做倒计时：秒数从哪来、`-1` 代表什么、`setInterval` 在什么时候必须清
- 知道 `redirectTo` 与 `navigateTo` 在「提交订单 → 支付页」这一步为什么选前者
- 知道本项目为什么不用 `wx.requestPayment`（appid 限制），以及模拟支付替代了什么

---

## 2. 接口事实

### 2.1 三个「预订单」接口返回同一种结构

| 接口 | 用途 | 入参 |
| --- | --- | --- |
| `GET /member/order/pre` | 购物车结算 | 无（服务端从购物车取勾选商品） |
| `GET /member/order/pre/now` | 详情页「立即购买」 | `skuId`、`count`、`addressId`(可选) |
| `GET /member/order/repurchase/{id}` | 订单详情「再次购买」 | path `id` |

三者 `result` 结构一致：

```
{ userAddresses: [...], goods: [...], summary: { goodsCount, totalPrice, totalPayPrice, postFee, discountPrice } }
```

- `goods[]`：`id` / `name` / `picture` / `count` / `skuId` / `attrsText` / `price` / `payPrice` / `totalPrice` / `totalPayPrice`
- `summary.totalPayPrice` 才是要付的钱，`totalPrice` 是原价合计，差额是 `discountPrice`
- `userAddresses[]` 由服务端按默认地址排好序的概率很高，但**没有「已选中」字段**（`pre/now` 除外，它回 `selected`），前端要自己挑第一条默认地址

**结论：结算页只渲染接口给的数据，不自己算价。** 前端加一遍价，等于把同一套规则实现两遍，两边一有差异就是资损或客诉。

### 2.2 提交订单

`POST /member/order`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `goods` | array | `[{ skuId, count }]`，**只有这两个字段** |
| `addressId` | string | 所选地址 id |
| `deliveryTimeType` | integer | 1 不限 / 2 工作日 / 3 双休或假日 |
| `payType` | integer | 1 在线支付 / 2 货到付款 |
| `payChannel` | integer | 1 支付宝 / 2 微信（货到付款时不传） |
| `buyerMessage` | string | 买家留言 |

响应只有 `{ id }`（订单 id），没有金额回显。

### 2.3 订单列表与详情

`GET /member/order?page=&pageSize=&orderState=`

- `orderState`：1 待付款 / 2 待发货 / 3 待收货 / 4 待评价 / 5 已完成 / 6 已取消，**不传或传 0 = 全部**
- 响应 `{ counts, pageSize, pages, page, items }`，注意 `pageSize` / `pages` / `page` 是**字符串**
- `items[].skus[]` 比详情少一个 `attrsText`？——两处都有，但列表里的 `attrsText` 可能是脏数据（实测出现过「色x-中号」），照实渲染

`GET /member/order/{id}` 比其他字段多：`payState`、`provinceCode` / `cityCode` / `countyCode`、`arrivalEstimatedTime`、`evaluationTime`。

**实测（2026-11-24，账号 `heima294`）**

- 列表 `counts` 达 17974、`pages` 5992 —— 这是共享测试数据，**不要用 `counts` 判断用户自己的订单数**
- `payLatestTime` 实际是**日期时间字符串**（`2026-11-24 15:13:39`），Apifox 说「剩余秒数」是错的；剩余秒数在 `countdown` 里
- 实测多条 `orderState: 1`（待付款）订单的 `countdown` 是 **`-1`**：`-1` 表示**已超时**，不是「还有 1 秒」。支付页要能显示「已超时」而不是负数倒计时

### 2.4 支付：只能走模拟

`GET /pay/wxPay/miniPay?orderId=`

> Apifox 原文：由于微信支付的限制，**仅 appid 为 `wx26729f20b9efae3a` 的开发者才能调用该接口**。

本项目 `appid` 是 `wxe3156a1306b053e8`，**调不通**。所以：

| 场景 | 做法 |
| --- | --- |
| 支付页 | 展示金额与倒计时 + 「模拟支付」按钮 |
| 点支付 | `GET /pay/mock?orderId=` → 服务端把订单置为待发货 → 前端跳订单详情 |
| 记入复盘 | 与 React 版的有意差异，答辩要能解释「不是漏做，是资质限制」 |

`/pay/mock` 只在 DEV 环境可用（Apifox 注明）。真机联调仍指向 `BASE_URL_DEV`，没问题；若将来切生产域名要重新评估。

---

## 3. 前置知识

### 3.1 金额：三个口径必须来自同一处

| 位置 | 金额来源 |
| --- | --- |
| 购物车合计 | 前端 `reduce(nowPrice * count)`，仅用于展示 |
| 结算页 | **接口 `summary`**（`totalPayPrice` / `postFee` / `discountPrice`） |
| 订单详情 | **接口 `payMoney` / `totalMoney`** |

三处口径不能互相推导。购物车那份只是「预览」，一旦进结算就以服务端为准——**购物车合计与结算页不一致时，以结算页为准，且不要试图让购物车去对齐服务端**（那需要再调一次预订单接口）。

浮点：`0.1 + 0.2 = 0.30000000000000004`。展示层统一 `Number(x).toFixed(2)`，比较大小用整数分或 `toFixed` 后比较。

### 3.2 状态机决定按钮

| 状态 | 可做操作 |
| --- | --- |
| 1 待付款 | 去支付、取消订单（`PUT /cancel`，需 `cancelReason`） |
| 2 待发货 | 无（DEV 可 `GET /consignment/{id}` 模拟发货） |
| 3 待收货 | 确认收货（`PUT /receipt`） |
| 4 待评价 | 删除订单 |
| 5 已完成 | 删除订单 |
| 6 已取消 | 删除订单 |

**按钮不是「按状态显示」，而是「按状态 + 动作是否合法」显示**：如果服务端只允许待付款取消，界面上就不该在别的状态给取消按钮——否则用户点了得到一个 400，体验还不如不显示。

### 3.3 倒计时

```js
// countdown 是「剩余秒数」，-1 表示已超时
let left = order.countdown
const timer = setInterval(() => {
  left -= 1
  if (left <= 0) {
    clearInterval(timer)
    // 置为「已超时」，不要显示 -1
  }
  this.setData({ leftText: formatMs(left) })
}, 1000)
```

必须在 `onUnload` / `onHide` 清掉，否则离开页面后定时器还在 `setData`，控制台报 `setData on unloaded page`。

### 3.4 提交后用 `redirectTo` 而不是 `navigateTo`

```
结算页 ──提交──> 支付页
```

- `navigateTo`：支付页压在结算页上，用户点返回会回到**已经提交过**的结算页，再点一次提交就多一笔订单
- `redirectTo`：结算页被替换掉，返回直接回购物车/订单列表

再配合一个 `this.submitting` 标志，挡住「连点两次提交」。

### 3.5 跨页拿选择结果：`eventChannel`

结算页点地址 → 地址列表（选择模式）→ 用户点某条 → 回到结算页并带上结果：

```js
// 打开方
wx.navigateTo({
  url: '/pages/address/list/list?select=1',
  events: { select: (address) => this.setData({ address }) }
})

// 地址列表页
const channel = this.getOpenerEventChannel()
channel.emit('select', item)
wx.navigateBack()
```

比 Storage 或 `globalData` 好在：通道随页面实例存在，不会把「上次选的地址」留到下一次结算。

---

## 4. 分步实现

### Step 1：接口层

- `api/order.js`：`getPreOrder` / `getPreOrderNow` / `submitOrder` / `getOrderList` / `getOrderDetail` / `cancelOrder` / `confirmReceipt` / `deleteOrders`（+ DEV 的 `mockConsignment`）
- `api/pay.js`：`mockPay`（`wxPay` 只在 appid 匹配时才用，先不写死）

**验收**：Console 手调 `getPreOrder` 能拿到 `goods` 与 `summary`。

**实现记录（2026-11-24）**

- `api/order.js` 八个方法 + `api/pay.js` 的 `mockPay`，全部 `auth: true`
- 只有写操作（提交 / 取消 / 确认收货 / 删除 / 支付）带 `loading: true`；读列表交给页面自己的骨架，避免每次切 tab 都糊一层全局遮罩
- `getPreOrderNow` 的 `addressId` 是可选参数，用条件展开而不是传 `undefined`——`wx.request` 对 `undefined` 的处理在 query 拼接里并不可靠

### Step 2：结算页

- 新页 `pages/order/confirm/confirm`，从购物车「去结算」进入
- 区块：地址（可点选）、商品清单、配送时间、支付方式、买家留言、金额明细、底部提交栏
- 未登录先拦（购物车 `onCheckout` 已做）

**验收**：金额与购物车勾选部分一致；未选地址时提交按钮置灰或有提示。

### Step 3：地址选择

- 地址列表页加 `select` 模式：带 `?select=1` 时点击条目走 `eventChannel` 回传，不跳编辑页
- 结算页展示所选地址，默认取 `isDefault === 1` 的第一条

**验收**：换地址后结算页立即更新，重新进入结算页又回到默认地址。

### Step 4：提交订单

- 组装 `goods`（只取 `skuId` + `count`）、`addressId`、`deliveryTimeType`、`payType`、`payChannel`、`buyerMessage`
- 提交中 `submitting` 防重 + 按钮 loading
- 成功后 `redirectTo` 支付页并带 `orderId`

**验收**：连点提交只生成一笔订单（Network 只有一次 POST）。

### Step 5：支付页

- 展示订单号、应付金额、倒计时（`countdown` 为 `-1` 时显示「已超时」）
- 点「模拟支付」→ `GET /pay/mock?orderId=` → 跳订单详情（`redirectTo`）
- `onUnload` 清定时器

**验收**：倒计时每秒递减；离开页面后控制台无 `setData on unloaded page`；支付后订单状态变待发货。

### Step 6：订单列表

- `pages/order/list/list`，7 个 tab（全部 / 待付款 / 待发货 / 待收货 / 待评价 / 已完成 / 已取消）
- 切 tab 回第 1 页并清空列表（S3 踩过数据串页）
- 触底加载下一页；空态；每张卡带状态与操作按钮（去支付 / 取消 / 确认收货 / 删除）

**验收**：切 tab 不串数据；分页到底显示「没有更多了」。

### Step 7：订单详情

- 状态 + 倒计时、收货地址、商品、金额明细、订单号/时间
- 按状态显示操作，取消与删除都要二次确认
- 删除后 `navigateBack` 并让列表刷新（列表 `onShow` 重拉）

**验收**：取消 → 已取消；确认收货 → 已完成；删除后列表少一条。

### Step 8：详情页「立即购买」

- `sku-panel` 加 `mode` 属性区分「加购」与「立即购买」，按钮文案与 confirm 事件语义随之变化
- 立即购买 → `getPreOrderNow({ skuId, count })` → 结算页（不进购物车）

**验收**：立即购买不写入购物车，结算页商品就是刚选的那一件。

**实现记录（2026-11-24，Step 2–7 一起落地）**

| 页面 | 文件 | 要点 |
| --- | --- | --- |
| 结算 | `pages/order/confirm` | 金额只取 `summary`；地址默认挑 `isDefault === 1`；配送时间 / 支付方式用 chip 单选；提交锁 + `redirectTo` 支付页 |
| 支付 | `pages/order/pay` | 倒计时用 `countdown`；`-1` 直接判「已超时」并禁用按钮；`onHide` / `onUnload` 清定时器；`mockPay` 成功后 `redirectTo` 详情 |
| 列表 | `pages/order/list` | 7 个 tab；切 tab 清空列表并回第 1 页；`onShow` 重拉（从支付/详情返回要刷新）；触底加载用 `pages` 判断有没有下一页 |
| 详情 | `pages/order/detail` | 状态横幅 + 商品 + 金额 + 时间；按钮按状态显示（1 取消/去支付、3 确认收货、4/5/6 删除） |

几个具体决策：

- **金额在 js 里就 `toFixed(2)` 成字符串**再进 `data`。WXML 里没有可靠的格式化能力，写成 `{{x.toFixed(2)}}` 在部分基础库不生效，不如在取数时一次性转好
- **`pages` 是字符串**（实测），比较前统一 `Number()`，否则 `next < res.pages` 会变成字符串比较
- 列表按钮区挂 `catchtap="noop"`，否则点「取消订单」会连带触发整卡的「进详情」
- 取消订单用 `wx.showModal({ editable: true })` 收集 `cancelReason`（接口必填），拿不到就回退「用户取消」
- 购物车「去结算」：未登录直接跳登录页并带 `redirect`，不在结算按钮上做灰态——灰态按钮不给理由，用户只会反复点
- 「我的」页新增「我的订单」入口，与地址入口同样先判登录

---

## 5. 常见坑

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 结算金额与购物车不一致 | 购物车自己算、结算用服务端 | 结算页只信 `summary` |
| 合计差一分钱 | 浮点累加 | 展示统一 `toFixed(2)`，比较用整数分 |
| 提交后返回又提交一次 | 用 `navigateTo` 进的支付页 | 改 `redirectTo` + 提交锁 |
| 倒计时显示 `-1:59` 之类 | `countdown` 的 `-1` 被当成 1 秒 | `-1` 判为已超时 |
| 离开页面后控制台报错 | 定时器没清 | `onUnload` / `onHide` 里 `clearInterval` |
| 切 tab 订单串数据 | 页码没复位、请求乱序 | 切 tab 重置 `page` 并丢弃过期响应 |
| 取消按钮点了报 400 | 只在待付款可取消 | 按钮按状态显示，别赌服务端兜底 |
| 支付页调 `wx.requestPayment` 报参数错误 | appid 不在白名单 | 走 `/pay/mock` |
| 地址选完回结算页没变 | 用 Storage 传值、页面没重读 | 用 `eventChannel` 回调直接 `setData` |
| 订单列表数量巨大 | `counts` 是共享测试数据 | 不要用它做「你有 N 笔订单」提示 |

---

## 6. 验收

对齐 `assignments.md` 的 7-1 ~ 7-5 与 `checklist.md` §2.6：

- [ ] 结算页：地址、商品、配送时间、支付方式、金额明细齐全
- [ ] 提交订单成功，购物车对应项被清掉，不会重复提交
- [ ] 支付页倒计时正确，模拟支付后订单变「待发货」
- [ ] 订单列表 7 个状态 tab 数据正确，切换不串页
- [ ] 订单详情：取消 → 已取消；确认收货 → 已完成
- [ ] 金额一致性核对表（购物车合计 = 结算页 = 订单金额）
- [ ] 立即购买不经过购物车，直接进结算

### 金额一致性核对表（实测填写）

| 检查点 | 购物车勾选合计 | 结算页 `totalPayPrice` | 订单 `payMoney` | 一致 |
| --- | --- | --- | --- | --- |
| 单商品 × 1 | | | | |
| 单商品 × 3 | | | | |
| 多商品混合 | | | | |

---

## 7. 闸门答辩（先读答案，再合上自测）

**Q1 结算页的金额为什么不能前端自己算？**

因为下单参数与服务端订单必须是同一份数据。前端再算一遍等于把计价规则实现两次，运费、折扣、活动价任何一处口径不同就会出现「页面显示 100、订单扣 105」。预订单接口已经把商品、运费、折扣算好，前端只负责展示与回传 `skuId` + `count`。

**Q2 提交订单后为什么用 `redirectTo`？**

`navigateTo` 会把结算页留在栈里，用户从支付页返回就回到已提交的结算页，再点一次提交就多一笔订单。`redirectTo` 用支付页替换结算页，返回路径直接回到购物车或订单列表。

**Q3 倒计时 `countdown` 为 `-1` 代表什么？**

代表付款已超时（实测待付款订单会出现这个值），不是「还剩 1 秒」。界面要显示「已超时」并禁用支付入口，而不是显示负数。

**Q4 为什么本项目用模拟支付？**

`/pay/wxPay/miniPay` 只对特定 appid（`wx26729f20b9efae3a`）开放，本项目 appid 不匹配，拿不到支付参数。`/pay/mock` 在 DEV 环境直接把订单置为待发货，能完整验证「提交 → 支付 → 状态流转」，只是跳过了真实扣款。

---

## 8. 复盘

| 日期 | 内容 |
| --- | --- |
| 2026-11-24 | 任务书建立。实测推翻了 Apifox 两处描述：`payLatestTime` 是日期字符串（不是剩余秒数）、待付款订单的 `countdown` 可能是 `-1`（已超时）。另确认支付必须走 `/pay/mock`——`/pay/wxPay/miniPay` 限 appid `wx26729f20b9efae3a`，本项目不匹配。 |
| 2026-11-24 | Step 1–7 落地：`api/order.js` + `api/pay.js` + 结算 / 支付 / 列表 / 详情四个页面，购物车与「我的」入口接上。三条主线：**金额只在 js 里格式化一次**（`toFixed(2)` 成字符串进 `data`）、**`countdown === -1` 是已超时不是 1 秒**、**提交后用 `redirectTo` 而不是 `navigateTo`**（否则从支付页返回会二次下单）。列表分页的 `pages` 实测是字符串，比较前必须 `Number()`。 |
