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
- **数量支持直接输入**，实现要点见下
- 删除走 `wx.showModal` 二次确认，确认后 `DELETE` 并重拉列表
- 数量没有做防抖：每次点 +/- 都会发请求，后面如果要优化，按 skuId 聚合 300ms 再提交

**数量校验的五道关**（补于 2026-11-24，用户反馈「没有校验或限制」）：

| 关卡 | 位置 | 作用 |
| --- | --- | --- |
| 1. 加购时就记下 `stock` | `sku-panel.onConfirm` → `addGoodsToCart` | 本地购物车没有接口查库存，不记就只能兜底，用户能改到 99 件 |
| 2. 归一化时夹一次 | `utils/cart.js` 的 `normalize` | 本地残留的超库存历史值进不了界面 |
| 3. 点击 +/- 前判断 | `onMinus` / `onPlus` | `count <= 1` 与 `count >= stock` 直接 return |
| 4. 输入失焦夹取 | `clampCount(input, stock)` | `parseInt` → `NaN` 退回原值，其余夹到 `[1, stock]` |
| 5. 提交前再夹一次 | `sku-panel.onConfirm` | 输入框可能还有没失焦的值，库存也可能刚变过 |

`clampCount` 放在 `utils/common.js`（购物车页与 SKU 面板共用）：

```js
export function clampCount(value, max) {
  const n = parseInt(value, 10)
  if (Number.isNaN(n)) return null

  const limit = Math.max(Number(max) || 0, 1)
  return Math.min(Math.max(n, 1), limit)
}
```

注意 `Math.max(Number(max) || 0, 1)` 这一层：库存为 0 时若直接 `Math.min(Math.max(n,1), 0)`，结果是 **0 件**——等于把商品改成买 0 个，提交必崩。

**提交防抖**：连点 + 会连发请求，乱序返回时服务端最终值取决于哪个最后到。改成按 skuId 聚合 300ms 只发最后一次，并在 `onHide` / `onUnload` 时 `flush`，避免切 tab 把最后一次修改丢掉。

输入框三个坑，是这次踩出来的：

1. **输入过程中不能 `setData`**。`bindinput` 里每敲一个字都 `setData` 会触发重渲染，光标被顶到末尾。做法是只记在 `this.inputCount` 上，`bindblur` 时再落进 `data`。
2. **input 不是严格受控**。它的 `value` 只在「值发生变化」时才更新。用户输入 `0`，我们夹取后还是 `0→1` 或原值，如果算出来与原值相同，`data` 没变，输入框就一直显示那个错的 `0`。解决：先 `setData` 置空、在回调里再回填，强制它跟随 `data`。
3. **夹取规则**：`parseInt` 后 `NaN`（空串、纯字母）退回原值，其余按 `Math.min(Math.max(raw, 1), stock)` 夹到 `[1, stock]`。小数、负数、超大数都靠这一句兜住。

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
| 结算栏下方多一条空白 | tabBar 页面又补了 `env(safe-area-inset-bottom)` | **tabBar 页不补**（底部 tabBar 已占掉安全区），非 tabBar 页才补 |
| 输入数量后显示的还是错的值 | `input` 值没变化就不重绘 | 先 `setData` 置空，回调里再回填 |
| 输入数量时每敲一个字光标跳末尾 | `bindinput` 里 `setData` 触发重渲染 | 输入中只记 `this`，`blur` 再落 `data` |
| 步进器被输入框撑开 | `input` 自带宽度与内边距 | 重置 `padding: 0` 并给固定宽度 |
| 未登录能把数量改到 99 | 本地条目没有 `stock`，归一化兜底成 99 | 加购时把 `sku.inventory` 存进本地条目 |
| 库存为 0 的商品数量变 0 | `Math.min(Math.max(n,1), 0)` = 0 | 上限先 `Math.max(stock, 1)` |
| 点 + 后数量变成 `11`、`111` | 置空那一帧 `count` 是 `''`，`'' + 1` 是字符串 | 运算前 `Number(count) \|\| 1` |
| 快速连点后数量与服务端不一致 | 请求并发、乱序返回 | 按 skuId 防抖 300ms，只发最后一次 |
| 详情页反复加购，数量变成「库存 × N」 | 本地累加没有上限 | `appendLocalCart` 累加后按 `stock` 夹住 |
| 反复加购到上限后没有任何反馈 | 数量没变化但接口返回成功 | `addGoodsToCart` 比对前后数量，未增加返回 `capped` |
| 数量回车后变成空白 | `bindconfirm` 与 `bindblur` 连续触发两次，第二次读到已被置空的 `count` | 用 `blurKey` 去重，同一次编辑只处理一次 |

---

## 6. 验收

- [ ] 未登录加购 2 件不同商品 → 购物车显示 2 条
- [ ] 同规格再加 1 件 → 数量累加，不新增行
- [ ] 勾选单条 → 合计金额与件数正确，全选圆点变红
- [ ] 点全选 → 全部勾选，再点取消
- [ ] 数量 + 到上限后按钮变灰；减到 1 后减号变灰
- [ ] 数量可直接输入；输 `0` / 空 / `abc` / 超过库存的值，失焦后都被夹回合法值且输入框显示正确
- [ ] 未登录时购物车数量上限等于该 SKU 的真实库存（不是 99）
- [ ] 快速连点 5 次 +，Network 里只出现 1 次改数量请求，且数量停在预期值
- [ ] 输入数量后立刻切 tab，再切回来数量没有回退（onHide flush 生效）
- [ ] 结算栏底部没有多余空白（贴近 tabBar）
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
| 2026-11-24 | 二次反馈：详情页反复加购数量涨到「库存 × N」、数量回车后变空白。前者是 `appendLocalCart` 累加没夹上限（面板只夹了单次数量，管不住多次累加）；后者是**同一个输入框的 confirm 与 blur 连续触发两次**，第二次读到第一次置空重填后的 `''`。**教训：把「置空再回填」当成刷新手段时，必须保证这段中间态不会被并发的另一个事件读到。** |
| 2026-11-24 | 用户反馈「数量没有校验或限制」。排查出 5 处：本地条目没存 `stock`（能改到 99）、`stock` 为 0 时夹出 0 件、置空帧的 `count` 是 `''` 导致 `+` 变字符串拼接、面板确认用可能未失焦的旧值、连点请求乱序。**根因是「校验散落在各个事件里」**——现在收敛成一个 `clampCount`，归一化、点击、失焦、提交四处都调它。边界值 14 条断言全 PASS。 |
| 2026-11-24 | 用户反馈两处：结算栏下方多一条空白、数量只能点不能输。空白的原因是 tabBar 页面又补了一次安全区——**tabBar 自身已包含安全区，页面内容区到 tabBar 上沿就结束**。数量改成 `input` 后连踩两个坑：`bindinput` 里 `setData` 会让光标跳到末尾；`input` 非严格受控，算出的值与原值相同时不重绘、错误输入一直留着。解法是「输入中只记 `this`，失焦先置空再回填」。 |
| 2026-11-24 | 主体落地：`utils/cart.js` 扩展成数据门面（归一 + 四个写操作分流），`pages/cart` 完成列表、勾选、合计、数量、删除、空态、结算拦截。数据层 16 条断言全 PASS。**关键决策：页面不判断登录态**——判断全部收敛在 `utils/cart.js`，S5 登录做完后页面一行都不用改。 |
