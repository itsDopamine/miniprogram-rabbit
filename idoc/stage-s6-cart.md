# 阶段 S6 · 购物车

> 状态：**主体代码完成**（本地车 + 接口车双数据源）；登录合并待 S5
> 工时：2 天 · 前置：S4 的加购（`utils/cart.js` 已具备本地暂存能力）
> 关联：[`api-reference.md`](./api-reference.md) 购物车 5 个接口 + 未收录的 `/member/cart/merge`、[`stage-s4-detail-sku.md`](./stage-s4-detail-sku.md) Step 5

---

## 1. 学习目标

- 知道 tabBar 页面为什么要在 `onShow` 而不是 `onLoad` 刷新数据
- 会把「本地 Storage」与「服务端接口」两套数据**归一成同一种结构**，页面只认一种
- 会算派生状态（全选态、勾选件数、合计金额），并知道它该算在哪一层
- 会用乐观更新：先改界面、再发请求、失败回滚
- 知道金额为什么不能直接拿字符串相加

---

## 2. 接口事实

### 2.1 四个写接口

| 方法 | 路径 | 请求体 | 说明 |
| --- | --- | --- | --- |
| GET | `/member/cart` | — | 列表，`result` 是数组 |
| PUT | `/member/cart/{skuId}` | `{ selected?, count? }` | 改单品，**只传要改的字段** |
| PUT | `/member/cart/selected` | `{ selected }` | 全选 / 取消全选 |
| DELETE | `/member/cart` | `{ ids: [skuId] }` | 删除单品，body 里是 **skuId 数组** |

全部需要登录。未登录一律 HTTP 401。

### 2.2 两套数据源的字段差异

| 字段 | 本地暂存 | `GET /member/cart` | 处理 |
| --- | --- | --- | --- |
| `id` | SPU id | SPU id | 一致 |
| `price` | string `'128.00'` | number `128` | 统一成 number |
| `nowPrice` | **没有** | 有（当前价） | 兜底成 `price` |
| `stock` | **没有** | 有 | 兜底成 99 |
| `isEffective` | **没有** | 有 | **必须是 `!== false`**，见 3.2 |
| `selected` | 有 | 有 | 一致 |
| `attrsText` | 有 | 有 | 一致 |

---

## 3. 前置知识

### 3.1 tabBar 页面：`onLoad` 只跑一次

普通页面 `wx.navigateTo` 每次都新建实例，`onLoad` 会重新执行。tabBar 页面不是——四个 tab 页在页面栈里长期存在，`onLoad` 只在第一次进入时触发一次。

所以购物车必须在 `onShow` 里拉数据：用户从详情页加购后切到购物车 tab，走的是「页面显示」而不是「页面加载」。

这也是小程序替代 Redux 全局状态的关键手段：**不共享状态，每次显示时重新对齐**。

### 3.2 `isEffective` 为什么不能写成 `=== true`

服务端返回的条目有 `isEffective: false`（商品下架）。本地暂存的条目**根本没有这个字段**。

```js
// 错：本地条目全部被判成失效，整辆车变灰且不能结算
const ok = item.isEffective === true

// 对：只有明确是 false 才算失效
const ok = item.isEffective !== false
```

React 版 `constants/index.js` 里专门有一行 `isEffective = (item) => item?.isEffective !== false`，注释写明「游客项没有这个字段」。

### 3.3 乐观更新

勾选、改数量都是高频操作。如果「等接口回来再改界面」，每次点击都有 100~300ms 的延迟感。做法是：

```
1. 先改 data（界面立刻响应）
2. 再发请求
3. 失败则重新拉列表，把界面拉回真实状态
```

代价是失败时界面会“跳回去”一下。相比每次都卡顿，这个代价可以接受。

### 3.4 金额不能用字符串算

服务端 `price` 可能是字符串，本地存的是字符串：

```js
'88.50' * 2   // 177   —— 乘号会隐式转数字，侥幸没问题
'88.50' + 2   // '88.502' —— 加号变成字符串拼接
```

所以归一化时统一 `Number()`，算完再用 `toFixed(2)` 格式化。

---

## 4. 分步实现

### Step 1：数据层归一（已完成）

`utils/cart.js` 新增：

- `normalize(item)`：抹平上表所有差异，返回页面可直接用的对象
- `getCartList()`：有 token 读接口，无 token 读本地，**两条路径返回结构一致**
- `updateCartCount` / `updateCartSelected` / `updateAllSelected` / `removeCartItems`：同样是按 token 分流

页面只 import 这一个文件，不需要知道数据从哪来。

### Step 2：列表渲染（已完成）

- 商品图、名称、`attrsText`、价格、数量步进器、删除叉号
- 失效商品排在最后（`sort` 时把 `isEffective` 为假的沉底），并整体降透明度、隐藏步进器
- 勾选圆点用 CSS 画（两条边框旋转 45°），不引图标字体

### Step 3：勾选与合计（已完成）

派生状态集中在一个方法里算，避免勾选、改数量、删除各写一份：

```js
withSummary(list) {
  const valid = list.filter((i) => i.isEffective)
  const selected = valid.filter((i) => i.selected)
  const totalPrice = selected.reduce((sum, i) => sum + i.nowPrice * i.count, 0)

  return {
    list,
    isAllSelected: valid.length > 0 && selected.length === valid.length,
    totalCount: selected.reduce((sum, i) => sum + i.count, 0),
    totalPrice: totalPrice.toFixed(2)
  }
}
```

三个口径必须一致：**合计只算「有效且勾选」**，全选态也只看有效商品。失效商品永远不参与。

### Step 4：数量与删除（已完成）

- 步进器下限 1（`count <= 1` 时减号变灰且直接 return），上限 `stock`
- 删除走 `wx.showModal` 二次确认，确认后 `DELETE` 并重拉列表
- 数量没有做防抖：淘宝式「长按连点」在小程序里体验要求低，但要注意每次点击都会发请求，后面如果要优化，按 skuId 聚合 300ms 再提交

### Step 5：结算入口（占位）

```js
onCheckout() {
  if (!this.data.totalCount) {
    wx.showToast({ title: '请先选择商品', icon: 'none' })
    return
  }

  wx.showToast({
    title: getToken() ? '订单页在 S7 接入' : '登录后再结算',
    icon: 'none'
  })
}
```

未登录时能加购、能看车、能改数量，但**结算必须登录**——这是业务规则，不是技术限制。

---

## 5. 常见坑

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 加购后切到购物车 tab 没变化 | 在 `onLoad` 里拉数据 | 改 `onShow` |
| 未登录时整车变灰、不能结算 | 用 `isEffective === true` 判断 | 用 `!== false` |
| 合计显示 `¥0.00` 但勾选了 | `price` 是字符串，`reduce` 里 `sum + str` 变拼接 | 归一化时 `Number()` |
| 合计出现 `177.00000000000003` | 浮点累加 | 最后 `toFixed(2)` |
| 勾选后数字对但按钮没变红 | 只改了 item，没有重算 `isAllSelected` | 统一走 `withSummary` |
| 登录过期后购物车空白 | 401 后 token 被清，但页面还停在错误态 | 捕获 401 后重跑一次（此时自然落到本地分支） |
| 改数量后库存为 `undefined` | 本地条目没有 `stock` | 归一化时兜底 99 |

---

## 6. 验收

- [ ] 未登录加购 2 件不同商品 → 购物车显示 2 条
- [ ] 同规格再加 1 件 → 数量累加，不新增行
- [ ] 勾选单条 → 合计金额与件数正确，全选圆点变红
- [ ] 点全选 → 全部勾选，再点取消
- [ ] 数量 + 到上限后按钮变灰；减到 1 后减号变灰
- [ ] 删除需要二次确认，删完列表与合计同步更新
- [ ] 未勾选任何商品点结算 → 「请先选择商品」
- [ ] 勾选后点结算 → 未登录提示「登录后再结算」
- [ ] 杀掉小程序重进 → 购物车数据还在（本地 Storage 生效）
- [ ] 空车显示「购物车还是空的」+「去逛逛」能回首页

### 数据层的自动化验证（已跑通 16 条）

用 Node mock `wx` 后跑真实源码，覆盖：本地条目 `isEffective` 补成 true、`stock` 兜底 99、`priceText` 两位小数、`nowPrice` 优先于 `price`、服务端 `isEffective: false` 保留、四个写操作在两种登录态下分别落到本地/接口、合计只算已选且有效。

---

## 7. 闸门答辩（先读答案，再合上自测）

**Q1 为什么购物车要在 `onShow` 拉数据，而不是 `onLoad`？**

tabBar 页面在页面栈里常驻，`onLoad` 只执行一次。用户从详情页加购后切回购物车，页面不会重新创建，只有 `onShow` 会触发。放在 `onLoad` 里，加购后购物车不会更新。

**Q2 本地条目和服务端条目字段不一样，怎么让页面只写一套渲染逻辑？**

在数据层做归一化：`getCartList()` 内部按登录态取数，取完统一过 `normalize()`，补齐缺失字段（`stock`、`nowPrice`）、统一类型（`price` 转 number）、统一失效判断口径（`!== false`）。页面拿到的永远是同一种结构。

**Q3 为什么 `isEffective` 要用 `!== false` 而不是 `=== true`？**

本地暂存的条目没有这个字段，`undefined === true` 为假，会把游客购物车整批判成失效；`undefined !== false` 为真，才是“默认有效”的正确语义。

**Q4 乐观更新失败后怎么收场？**

重新拉一次列表，用真实数据覆盖界面。不要试图手动回滚——回滚逻辑和真实业务规则容易分叉，重拉是最省心且一定正确的做法。

---

## 8. 复盘

| 日期 | 内容 |
| --- | --- |
| 2026-11-24 | 顺序调整：S6 提前到 S5 之前。购物车未登录读本地、已登录走接口，主体不依赖登录；只有登录合并等 S5。`03-roadmap.md` 的依赖表与顺序图同步修正。 |
| 2026-11-24 | 主体落地：`utils/cart.js` 扩展成数据门面（归一 + 四个写操作分流），`pages/cart` 完成列表、勾选、合计、数量、删除、空态、结算拦截。数据层 16 条断言全 PASS。**关键决策：页面不判断登录态**——判断全部收敛在 `utils/cart.js`，S5 登录做完后页面一行都不用改。 |
