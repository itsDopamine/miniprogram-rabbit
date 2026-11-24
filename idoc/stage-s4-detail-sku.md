# 阶段 S4 · 商品详情与 SKU

> 状态：**Step 1–3 代码完成，Step 3 用例已用真实接口数据跑通；Step 4 未开始**
> 工时：3 天 · 前置：S2/S3 的商品卡能拿到 id（首页、分类页、搜索结果）
> 关联：[`api-reference.md`](./api-reference.md) `GET /goods`、[`03-roadmap.md`](./03-roadmap.md) §2

---

## 1. 学习目标

- 会用 `onLoad(options)` 接收上个页面传来的参数，并知道 `options` 里的值**永远是字符串**
- 会做图片轮播 + `wx.previewImage` 全屏预览
- 能讲清 **SKU 禁用态**的判断逻辑，并自己写出「路径字典」结构
- 知道为什么「部分选择」的可用性判断不能只查完整组合，要用子集
- 会做数量夹取（不小于 1、不超过当前 SKU 库存）
- 知道加购前必须校验「规格是否选全」

---

## 2. 接口事实

### 2.1 `GET /goods?id=<商品id>`

返回一个大对象，本阶段只用到这些字段（完整字段见 `api-reference.md`）：

| 字段 | 含义 | 备注 |
| --- | --- | --- |
| `name` / `price` / `oldPrice` / `desc` | 基本信息 | `price` 是字符串 |
| `mainPictures` | 主图数组 | 轮播用它，可能有 http 直链 |
| `mainVideos` / `videoScale` | 主图视频 | 可选做 |
| `details.pictures` | 详情长图 | 富文本区的图片 |
| `details.properties` | 属性表 | `[{name, value}]` |
| `specs` | **规格组**，如 `[{name:'颜色', values:[{name:'黑'},{name:'白'}]}]` | 顺序必须与 `skus[].specs` 一致 |
| `skus` | **SKU 列表**，每个是可售单元 | `[{id, price, inventory, specs:[{name:'颜色', valueName:'黑'}], picture}]` |
| `similarProducts` | 同类推荐 | 替代已废弃的 `/goods/relevant` |

**两个必须记住的点：**

1. `specs` 的 `values[].available` 是「可选售」标记，但**不要只依赖它**：它只表示「这个值单独是否存在任何有货 sku」，不反映当前已选组合下的可用性。真正判断要靠 `skus` 自己算。
2. 判断两个规格值「是不是同一个」用 `name`（规格名）+ `valueName`/`name`（值名）做**字符串匹配**，没有稳定的 valueId。

**实测记录（2026-11-24，`id=1369155859933827074`）**

- `mainPictures` / `details.pictures` 全是 `http://` 直链，必须过 `toHttps`
- `details.properties` 是 `[{name,value}]`，2026-11-24 抓到的样本属性名与商品不匹配（如「额定电压功率」配吹风机），是后台脏数据，前端照实渲染即可
- 该商品 `oldPrice` 与 `price` 都是 `128.00`，所以划线价要加「两个值不相等」的判断才显示
- `specs` 3 组（颜色 2 / 尺寸 3 / 产地 2）× `skus` 12 条，且存在 `inventory: 0` 的 sku——正好用来验证 Step 3 的禁用态，3 组规格对应幂集 7 个子集

### 2.2 `POST /member/cart`（加购，S4 后半段用）

```json
{ "skuId": "string", "count": 1 }
```

需要登录（`auth: true`）。未登录时的处理在 S5 讲，本阶段先直接调用，失败走 401 分支。

---

## 3. 前置知识

### 3.1 `onLoad(options)` 的参数都是字符串

```js
// 上个页面：wx.navigateTo({ url: '/pages/goods/detail/detail?id=1369155859933827074' })
onLoad(options) {
  const id = options.id // 是字符串 '1369155859933827074'，不是数字
}
```

- URL 里不能直接拼对象，复杂参数要 `encodeURIComponent(JSON.stringify(obj))`
- `options.id` 来自 URL，**用前要做空值判断**，否则会请求 `/goods?id=undefined`

### 3.2 图片预览：`wx.previewImage`

```js
wx.previewImage({
  current: urls[index], // 当前显示的那张
  urls // 全部可滑动的图，必须是 https
})
```

点轮播图时调用。`urls` 里如果混了 http，iOS 真机会白屏。

### 3.3 SKU 禁用态：为什么不能只查完整组合

假设两个规格：颜色（黑/白）× 尺寸（S/M），四个 sku：

| 组合 | 库存 |
| --- | --- |
| 黑 S | 10 |
| 黑 M | **0** |
| 白 S | 5 |
| 白 M | **0** |

用户先选了「黑」，此时问「M 能不能选」——查「黑 M」，库存 0，禁用。这一步很简单。

但用户**还没选颜色**时，问「M 能不能选」——「M」单独不是一个 sku，你要判断的是「任意颜色 + M 是否还存在有货的 sku」。答案是白 M、黑 M 都没货 → M 应该禁用。

**所以判断依据不是「完整组合」，而是「任意包含当前选择 + 候选值的子集」是否还有货。** 这就是「子集 / 幂集」的由来：

对每个有货的 sku，把它包含的所有规格值组合（非空子集）都记为「可用」：

```
黑 S 有货 → '颜色:黑'、'尺寸:S'、'颜色:黑&尺寸:S' 都标记为可用
白 S 有货 → '颜色:白'、'尺寸:S'、'颜色:白&尺寸:S' 都标记为可用
```

这样查询时只需把「已选值 + 候选值」排序拼成 key 去查表，不需要关心有没有选全。

2 组规格的 sku 产生 3 个子集（2²−1），3 组规格产生 7 个（2³−1）——组合数随规格组数指数增长，这就是所谓幂集。

### 3.4 数量夹取

```js
const next = Math.min(Math.max(count, 1), stock) // 不小于 1，不超过库存
```

切规格后库存会变，**当前数量可能超过新 sku 的库存**，必须重新夹取，否则会提交一个超卖的数量。

---

## 4. 分步实现

### Step 1：接口层 + 详情页基础信息

- `api/goods.js` 写 `getGoodsDetail(id)`
- 新建 `pages/goods/detail/detail`，`app.json` 注册
- 商品卡点击改成 `wx.navigateTo`（首页 / 分类页 / 搜索结果三处）
- 渲染：主图轮播、价格、名称、`details.properties` 属性表、`details.pictures` 长图

**验收**：从任意商品卡进入详情页，图、价、名正确；点主图能全屏预览。

### Step 2：SKU 弹层 UI

- 底部操作栏：客服、购物车、加入购物车、立即购买
- 点「加入购物车」弹出 SKU 面板（自绘遮罩 + 上滑面板，`fixed` 定位）
- 面板内按 `specs` 渲染规格组与值按钮，选中态高亮

**验收**：面板能弹出/收起；规格值可点选/取消。

**实现记录（2026-11-24）**

- **面板改为自绘，没用 `t-popup`。** 曾按 TDesign 写法接入，真机/模拟器上遮罩不出现、面板被当作普通块塞进页面流里，把 `.bar` 顶到了内容中间。查 `miniprogram_npm/tdesign-miniprogram/popup/popup.wxss` 里 `position: fixed` 明明存在，且 `miniprogram_npm/tdesign-miniprogram/` 下缺 `package.json`，判断是 npm 产物不完整导致组件没被识别、slot 内容被当普通节点展开
- 自绘要点：遮罩与面板都用 `position: fixed`，**绝对不能参与 `page` 的 flex 流**，否则 `flex: 1` 的 `.body` 会被挤压，底部栏上移
- 进出场用 `transform: translateY(100%)` → `translateY(0)` + `transition`，隐藏态保留节点（用 `visibility` 与位移），才能有可过渡的起点；不要用 `wx:if`，节点一销毁就没有动画
- 滚动穿透用遮罩的 `catchtouchmove="noop"` 吃掉手势；面板内部是 `scroll-view`，靠自身滚动，不受影响
- 叉号仍是 CSS 自绘（两条旋转的 1px 线），不用图标字体
- 「选中态」的数据结构：`selected` 是与 `specs` **等长的数组**，`''` 表示未选。用数组而不是对象，因为规格组顺序必须和 `skus[].specs` 对得上，按下标取值最直接；判断选全就是 `selected.some(v => !v)`
- **Step 2 不做禁用态**，所有值都可点。`skus` 已随接口返回但暂存不用，留给 Step 3
- 面板头部的 `skuPicture` / `skuPrice` 先给 SPU 的图与价，Step 3 选全规格后改成 sku 的值，模板不用动

### Step 3：SKU 联动与禁用态

- 用 `skus` 建路径字典（每个 sku 的所有非空子集 → 是否可售）
- 每次选择变化后，重算每个候选值的禁用态
- 选全后显示对应 sku 的价格、库存、图片；数量夹取到库存

**验收**：用例表 ≥ 5 组（见 §6）。

**实现记录（2026-11-24）**

- `skus` 不参与渲染，挂在 `this.skuList`；`pathMap` 同理挂 `this`。只有 `disabled`（二维布尔数组）进 `data`
- 子集用位掩码生成：`1 << n` 得到 2ⁿ，`mask` 从 1 到 2ⁿ−1，逐位判断是否选中第 i 个值。3 组规格就是 mask=1..7
- key 形如 `颜色:蓝色&尺寸:20cm`，**拼之前必须 sort**，否则同一组值换个顺序就是另一个 key
- 10 个有货 sku × 7 个子集 = 70 次写入，但对象 key 天然去重，最终只有 **33 条**（「颜色:黑色」这类被多个 sku 共享）
- 判断候选值时，候选值所在组用候选值、其它组用 `selected` 里已选的值、未选的组跳过——所以未选状态也能查（查的是单元素子集）
- 已选中的值永远可点（用来取消），`onTapSpec` 里只对「未选中且不可用」拦截
- `findSku` 依赖「`sku.specs` 与 `specs` 同序」这条接口约束，直接按下标比 `valueName`
- 数量夹取在 `syncSku` 里做：`Math.max(Math.min(count, inventory), 1)`，同时把 `maxCount` 跟着换掉

**代码分层（2026-11-24 重构）**

详情页 js 原本 250 行，混了「商品展示 / 图片预览 / SKU 算法 / 面板交互」四件事，按职责拆成三层：

| 层 | 位置 | 职责 | 行数 |
| --- | --- | --- | --- |
| 算法 | `utils/sku.js` | `buildKey` / `buildPathMap` / `isAvailable` / `buildDisabled` / `findSku` / `buildSelectedText`，纯函数，无 `this`、无 `setData`、不碰任何小程序 API | 86 |
| 交互 | `components/sku-panel` | 遮罩、面板进出场、选中态、禁用态、数量夹取；对外只有 `visible` 属性 + `visible-change` / `confirm` 两个事件 | 137 + 59 + 226 |
| 页面 | `pages/goods/detail` | 取数、图片预览、开合面板、处理加购结果 | 103 |

拆分后的判据：**能脱离 `this` 算的，进 `utils`；只在弹层里有意义的，进组件；页面只剩「取数」和「页面级交互」。**

组件用 `observers: 'specs, skus, price, picture'` 监听商品数据，数据一到就重建字典并清空选择，页面不需要专门通知它「该初始化了」。面板自己不存开合状态，`visible` 完全受控，关闭时只抛事件、由页面 `setData`。

**重构后必须重跑一次用例**：把 `utils/sku.js` 复制成 `.mjs` 用 Node 直接 import，跑同样 5 组用例，确认 `pathMap` 仍是 33 条、禁用结果与重构前逐条一致。搬动代码不改行为，但"没改"这件事要验证过才算数。

### Step 4：加入购物车

- 规格未选全 → 提示「请选择规格」
- 选全 → `POST /member/cart`，成功后 toast 并关闭面板

---

## 5. 常见坑

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 详情页白屏 | `options.id` 为空还发了请求 | 先判空再请求 |
| 图片不显示（真机） | `mainPictures` 是 http | 统一 `toHttps` |
| 点图预览报错 | `current` 不在 `urls` 里 | `current` 必须是 `urls` 中的元素 |
| 选了 A 后 B 全灰 | 字典只记录了完整组合 | 要记录所有非空子集 |
| 切规格后数量超库存 | 没重新夹取 | 切 sku 后 `count = min(count, stock)` |
| 加购成功但购物车没变 | 未登录时 401 被吞 | 看 Network 状态码，S5 处理登录回跳 |

---

## 6. 验收

- [ ] 三处商品卡都能进详情页
- [ ] 主图可预览大图，详情长图不溢出
- [ ] SKU 禁用态用例表（≥ 5 组）全部正确
- [ ] 数量不超过库存，切规格后自动夹取
- [ ] 加购成功有反馈

### SKU 禁用态用例表（必须自己填满并实测）

用 `id=1369155859933827074` 实测（颜色 黑/蓝 × 尺寸 30/20/10cm × 产地 日本/中国，12 个 sku，其中「蓝色+20cm+中国」「黑色+20cm+日本」库存为 0）：

| # | 操作 | 期望 | 实测结果 |
| --- | --- | --- | --- |
| 1 | 什么都不选 | 所有值可选 | 7 个值全部可选 ✓ |
| 2 | 选「蓝色」 | 与蓝色无组合的值禁用 | 无禁用——蓝色+20cm 还有「日本」这条有货路径 ✓ |
| 3 | 再选「20cm」 | 无货组合的第三个值禁用 | 产地「中国」禁用、「日本」可选 ✓ |
| 4 | 取消「蓝色」 | 其他值恢复可用 | 产地「中国」恢复可选 ✓ |
| 5 | 改选「黑色」+20cm | 无货组合的第三个值禁用 | 产地「日本」禁用、「中国」可选 ✓ |

第 2 组是关键：如果只登记完整组合，「蓝色」被选中时问「20cm 能不能选」会查 `颜色:蓝色&尺寸:20cm` 这条不存在于字典里的 key，把本来可选的 20cm 错误置灰。子集字典里存在 `尺寸:20cm` 与 `颜色:蓝色&尺寸:20cm` 两条，才查得到。

选满一个无货组合（如蓝色+20cm+中国）在 UI 上**点不到**——第三个值已被禁用，所以不存在「加购按钮禁用」这个状态。`onConfirmSku` 里仍保留 `sku.inventory <= 0` 的兜底，防服务端数据异常。

---

## 7. 闸门答辩（先读答案，再合上自测）

**Q1 为什么 SKU 可用性判断要用子集，而不是直接查完整组合？**

因为用户可能只选了一部分规格。此时要判断「某个候选值还能不能选」，答案是「任意包含当前已选值 + 该候选值的组合是否还有货」，这个查询对象是一个子集而不是完整组合。把每个有货 sku 的所有非空子集预先登记，任意选择状态都能直接查表。

**Q2 切规格后为什么要重新夹取数量？**

不同 sku 的库存不同。用户可能在上一个 sku 上把数量加到 5，切到一个库存 2 的 sku，如果沿用 5 就会提交超卖数量。所以切 sku 时必须 `count = min(count, stock)`，同时下限仍是 1。

**Q3 加购前要校验什么？**

三件事：规格是否选全（否则拿不到 `skuId`）、数量是否在 `[1, stock]` 内、是否登录（401 时按统一策略处理）。

---

## 8. 复盘

| 日期 | 内容 |
| --- | --- |
| 2026-11-24 | 阶段文档建立。接口字段全部来自 `api-reference.md`（Apifox 导出），`GET /goods` 返回 `specs` + `skus` 两套结构，靠规格名与值名做匹配，无 valueId。 |
| 2026-11-24 | Step 1 落地：`api/goods.js` + `pages/goods/detail`（四件套）+ `app.json` 注册 + 首页/分类页/搜索页三处 `onTapGoods` 改 `wx.navigateTo`。用真实接口抓包核对了字段，顺手修掉「oldPrice 与 price 相同仍显示划线价」的问题。`wx.previewImage` 的 `current` 统一从 `this.data` 的数组里取，不用 dataset 传数组。 |
| 2026-11-24 | 重构：详情页拆成 `utils/sku.js`（纯算法）+ `components/sku-panel`（弹层）+ `pages/goods/detail`（取数与页面交互），js 从 250 行降到 103 行。**教训：一个页面同时放算法、视图状态和业务取数，改任何一处都要通读全文件**；纯函数抽出去后还能脱离小程序环境用 Node 直接验证。拆分完后把 `utils/sku.js` 复制成 `.mjs` 跑了一遍原用例，确认 33 条字典与禁用结果都没变。 |
| 2026-11-24 | Step 3 落地：位掩码生成子集 → `pathMap`（33 条）→ `isAvailable` 查表 → `disabled` 二维数组驱动置灰。**写完后用 Node 脚本把 detail.js 的同一份逻辑抄出来跑了 5 组用例，确认「选蓝色时 20cm 仍可选」「选蓝色+20cm 后中国禁用」才对**——这类算法不能靠读代码判断对错。另：`specs[].values[].available` 实测全部为 `undefined`，服务端没给，彻底坐实必须自算。 |
| 2026-11-24 | Step 2 落地：底部操作栏 + SKU 面板。首版用 `t-popup`，实机表现为「无遮罩 + 面板混进页面流 + 底部栏被顶到中间」，判断是 TDesign 的 npm 产物不完整（`miniprogram_npm/tdesign-miniprogram/` 缺 `package.json`）导致组件未被识别、slot 被当普通节点渲染，遂改为自绘。**教训：`position: fixed` 的弹层绝不能参与 `page` 的 flex 流，否则 `flex: 1` 的滚动区会被它挤扁。** 排查顺序应是「先看 DOM 是否被当普通节点渲染，再怀疑样式」。 |
