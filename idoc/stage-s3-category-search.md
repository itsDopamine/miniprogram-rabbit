# 阶段 S3 · 分类与搜索

> 状态：**未开始**
> 工时：2 天 · 前置：S2 完成（首页能跑通，`goods-card` 组件可用）
> 关联：[`03-roadmap.md`](./03-roadmap.md) §2/§4、[`api-reference.md`](./api-reference.md)、[`01-migration-map.md`](./01-migration-map.md)

---

## 1. 学习目标

- 会做**左右两栏联动**：左侧一级分类点击 → 右侧滚动定位到对应区块，左侧高亮跟着右侧滚动走
- 掌握 `scroll-view` 的 `scroll-into-view`（命令式定位）与 `bindscroll`（反向同步高亮）的分工
- 会用 `position: sticky` 让二级分类标题吸顶，并知道它在 `scroll-view` 里的前提条件
- 会发 **POST 请求体**，说清它和 GET query 的区别（谁决定了「用哪个」）
- 会写**输入防抖**，并能算出「连打 10 个字符只请求 1 次」的时机
- 知道「切排序必须回第 1 页」的原因，能用代码保证不串页

---

## 2. 接口事实（先看这一节再写代码）

> 以下全部来自 `api-reference.md`（Apifox 接口定义导出，2026-11-24）与同日实测，**不要凭 React 版记忆**。

### 2.1 分类列表：`GET /category/top`

这是本阶段最省事的一个接口——**一次返回完整的「一级分类 → 二级分类 → 商品」树**：

```
result: [
  {
    id, name, picture,
    imageBanners: [],          // 实测全为空数组，本阶段不用
    children: [
      { id, name, picture,
        goods: [ { id, name, price, picture, desc, orderNum } ] }
    ]
  }
]
```

2026-11-24 实测结果：

| 一级分类 | 二级分类数 | 商品数 |
| --- | --- | --- |
| 共 **9** 个（居家 / 美食 / 服饰 / 母婴 / 个护 / 严选 / 数码 / 运动 / 杂项） | 1~7 个 | 合计约 350 条 |

两个必须记住的点：

1. **左侧分类不要用首页的 `/home/category/mutli`**。首页那个只有 `id/name/icon`，没有 `children`，而且实测是 **10** 个（多一个「杂项」之外的差异），和分类页的 9 个不是同一份数据。分类页只用 `/category/top`。
2. **这个接口没有分页参数**，350 条一次全给你。所以分类页不做分页——分页只属于搜索结果页。

### 2.2 搜索：`POST /search/all`

```js
// 请求体（全部可选）
{
  page: 1, pageSize: 10,
  keyword: '',            // 关键词
  categoryId: '',         // 分类 id
  brandId: '',            // 品牌 id
  onlyDiscount: false,    // 只看特惠
  sortField: 'publishTime', // publishTime | orderNum | price | evaluateNum
  sortMethod: 'desc'      // asc | desc，默认 desc
}

// 响应
result: {
  conditions: { categories: [...], brands: [...] },   // 可用的分类/品牌筛选项
  pageData: { counts, pageSize, pages, page, items: [...] }
}
```

**为什么是 POST？** 因为筛选条件多且能组合（`PublishTime` 是排序字段，`brandId` 可能有多个），塞进 URL 既难读又可能超长。POST 把参数放进请求体，跟「写操作」没有必然关系——HTTP 方法描述的是语义，这里服务端选择了 POST 承载查询。

> ⚠️ **2026-11-24 实测：该接口服务端 500**，返回
> `Elasticsearch exception [type=search_phase_execution_exception, reason=all shards failed]`。
> 路径与方法本身是对的（用 GET 请求会返回 `400 Request method 'GET' not supported`，说明路由存在）。
> 这是后端 ES 集群故障，不是我们的问题：**代码照写，联调排队等恢复**。

### 2.3 提示语：`GET /search/tips?keyword=`

- `keyword` **必填**，不传返回 500 `Required String parameter 'keyword' is not present`
- 响应 `result: [{ ids: string[], associatedWord: string }]`
- 2026-11-24 实测：接口可用，但 dev 环境对任何词都返回**空数组**——所以提示语列表在开发期大概率是空的，别以为是自己写错了

---

## 3. 前置知识

### 3.1 `scroll-into-view`：让滚动条「点名」跳转

`scroll-view` 有两个控制滚动的属性，方向相反：

| 属性 | 方向 | 用法 |
| --- | --- | --- |
| `scroll-top` / `scroll-into-view` | **你 → 滚动条**（命令式） | 设了值，滚动条就跳过去 |
| `bindscroll` | **滚动条 → 你**（事件） | 用户滚了，把 `scrollTop` 报给你 |

`scroll-into-view` 的值是**子节点的 `id`**（字符串），不是选择器、不是 class：

```xml
<scroll-view scroll-y scroll-into-view="{{intoView}}">
  <view id="cat-1005000">...</view>
  <view id="cat-1005002">...</view>
</scroll-view>
```

点击左侧时 `setData({ intoView: 'cat-' + id })`，右侧就跳到那一块。

**两个坑：**

1. **值不变不会重新滚动**。点两次同一个分类，第二次什么都不会发生（框架认为状态没变）。要先清空再设值——S2 的「回到顶部」已经踩过这个坑，同一个解法。
2. **`id` 必须以字母开头**。`id="1005000"` 在部分基础库上无效，所以统一加前缀 `cat-`。

### 3.2 反向同步：右侧滚到哪儿，左侧就高亮哪个

`bindscroll` 会高频触发（每帧都可能来一次），**不要在里面 `setData`**——那等于每帧一次跨线程通信。做法是只记计算、算完再比：

```js
onRightScroll(e) {
  const { scrollTop } = e.detail
  // 用一次性量好的区块 offsets 判断当前在哪个区块
  let idx = 0
  for (let i = 0; i < this.offsets.length; i++) {
    if (scrollTop >= this.offsets[i] - 10) idx = i
  }
  if (idx !== this.data.activeIndex) this.setData({ activeIndex: idx })  // 变了才 setData
}
```

`offsets` 在哪来？`onReady` 里用 `wx.createSelectorQuery().selectAll('.block').boundingClientRect()` 一次性量好，缓存到 `this` 上（不进 `data`——它不参与渲染）。

### 3.3 `position: sticky` 在 `scroll-view` 里的前提

吸顶（sticky）要生效，必须满足：

1. 祖先链上**没有** `overflow: hidden/auto/scroll`，除非那个祖先就是它的滚动容器
2. 元素自身要有 `top` 值
3. 父元素高度要大于「元素高度 + 吸顶距离」，否则它没有可粘的范围

在 `scroll-view` 里，滚动容器就是 `scroll-view` 本身，所以 sticky 元素的**直接定位祖先**要能一直延伸到滚动容器（中间不能插一层 `overflow: hidden` 的包裹）。这条踩了就会表现为「完全不吸顶，也看不出报错」。

### 3.4 防抖（debounce）

输入框每敲一个字就请求一次是灾难：10 个字 = 10 次请求，且响应乱序返回时会把旧结果盖上新结果。

```js
onInput(e) {
  const keyword = e.detail.value.trim()
  clearTimeout(this.timer)
  if (!keyword) return this.setData({ tips: [] })
  this.timer = setTimeout(() => this.fetchTips(keyword), 300)
}
```

- `clearTimeout` 清掉上一次的待执行任务，只有「停止输入 300ms」才会真正发请求
- 定时器必须在 `onUnload` 里 `clearTimeout`，否则页面销毁后回调还在跑（会报 `setData on destroyed page`）

### 3.5 「切排序回第 1 页」为什么必须做

分页的正确定义是「当前页 = 某个筛选条件组合下的第 N 页」。用户滚到第 5 页、然后切换排序：

- 如果不重置 `page`：请求 `page=5&sortField=price`，返回的是**新排序下的第 5 页**，前 4 页的商品永远看不到，列表看起来「跳了一段」
- 同时旧列表还在 `data` 里，新旧数据混在一起 → **串页**

正确做法：排序/筛选变化时，把 `page` 置 1、`list` 清空、`hasMore` 置回 true，再发请求。

---

## 4. Step 0：准备

1. 新建 `miniprogram/api/category.js`，写 `getCategoryTop()` 与 `getSearchAll(body)`。
2. `pages/category/category.*` 现在是 S0 的空壳，本阶段把它改造成两栏分类页。
3. 新建 `pages/search/search.*`（搜索页不是 tabBar 页，是普通页面，用 `navigateTo` 进入）。
4. 搜索页要在 `app.json` 的 `pages` 里注册，否则 `navigateTo` 直接失败。

---

## 5. 分步实现

### Step 1：接口层 + 两栏静态布局（半天）

- `getCategoryTop()` → 9 个一级分类，转 https 后存 `data.categories`
- `getSearchAll({ page, pageSize, keyword, categoryId, sortField, sortMethod })` → POST
- 布局：`display: flex` 左右两栏
  - 左栏 `scroll-view`，宽 `180rpx`，`wx:for` 渲染一级分类名
  - 右栏 `scroll-view`，`flex: 1`，`wx:for` 渲染**所有**一级分类下的二级分类区块

右侧每个区块的结构：

```
┌ 区块（id = cat-{{一级分类id}}）─────────┐
│ 二级分类标题（sticky top:0）            │
│ 三级分类横向标签（children.name）        │
│ 商品网格（2 列或 3 列，复用 goods-card）  │
└────────────────────────────────────┘
```

**验收**：9 个一级分类都在左侧；右侧能滚出全部区块；商品图是 https 且是正方形。

### Step 2：左右联动（半天）

- 左侧点击 → `setData({ intoView: 'cat-' + id })`
- 右侧 `bindscroll` → 算出当前区块下标 → 更新左侧高亮
- 二次点击同一分类要能再次跳转（先清空 `intoView` 再设值）
- `onReady` 里量区块 offsets 缓存到 `this`，**不进 `data`**

**验收**：点左侧每个分类，右侧都跳到对应区块顶部，左侧高亮正确；手动滚右侧，左侧高亮跟着切换且不掉帧。

### Step 3：搜索页：输入防抖 + 提示语 + 历史（半天）

- 分类页顶部一个「假搜索框」，点击 `navigateTo` 到搜索页（不要在分类页里直接输入）
- 搜索页输入框 `bindinput` → 300ms 防抖 → `getSearchTips(keyword)`
- 提示语为空时显示「本地历史搜索」（用 `wx.setStorageSync` 存最近 10 个词，去重、新的在前）
- `onUnload` 清理定时器

**验收**：连续输入 10 个字符，Network 面板只出现 1 次 `search/tips` 请求；点历史词能直接搜索。

### Step 4：搜索结果 + 排序 + 分页（半天）

- 提交搜索 → `getSearchAll({ page: 1, pageSize: 10, keyword, sortField, sortMethod })`
- 排序 tab：`publishTime` / `orderNum` / `price`（价格点击切换 asc/desc）
- 切排序 = 回第 1 页 + 清空列表
- 触底加载下一页，用 `page < pages` 判断有没有更多
- 三态：loading / empty（没有搜到）/ error（含重试）

**验收**：切排序后列表从第 1 页重新开始且不串页；触底只加载新页；无结果显示空态文案。

---

## 6. 验收

- [ ] 分类页左侧 9 个一级分类，点击右侧跳到对应区块，左侧高亮同步
- [ ] 手动滚右侧，左侧高亮跟随，滚动不掉帧（`bindscroll` 里不 `setData`）
- [ ] 二级分类标题吸顶生效
- [ ] 商品图 https、正方形、点击能拿到 id
- [ ] 搜索输入连续 10 字符 → 只发 1 次 tips 请求
- [ ] 切排序回到第 1 页，不串页
- [ ] 三态齐全
- [ ] 页面里没有 `wx.request`、没有域名硬编码

---

## 7. 报错急救表

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 点左侧没反应 | `scroll-into-view` 的值不是子节点 id，或 id 以数字开头 | 用 `cat-` 前缀，确认是 `scroll-view` 的直接子节点 |
| 同一分类点第二次不跳 | 值没变，框架不下发 | 先 `setData({intoView:''})` 再设目标值 |
| 右侧一滚就卡 | `bindscroll` 里每帧 `setData` | 只在 `activeIndex` 变化时才 `setData` |
| 标题不吸顶 | 祖先有 `overflow: hidden`，或没有 `top` | 顺着祖先链找 `overflow`，补 `top: 0` |
| 左侧高亮滞后/错位 | offsets 在渲染前量了 | 在 `onReady` 或 `setData` 回调里量 |
| 搜索 500 `all shards failed` | 后端 ES 故障 | 不是你的代码问题，等恢复；先跑分类页 |
| 搜索 500 `Required String parameter` | tips 少传 `keyword` | 必填，空关键词不发请求 |
| 结果串页 | 切排序没重置 `page` 和列表 | 排序变化时 `page=1`、`list=[]` |
| `setData on destroyed page` | 定时器/请求没清理 | `onUnload` 里 `clearTimeout` |

---

## 8. 阶段作业与闸门

| # | 作业 | 提交物 |
| --- | --- | --- |
| 3-1 | 左右联动 + 高亮同步 | 录屏或两张截图（不同分类位置） |
| 3-2 | 切排序回第 1 页 | Network 截图（`page=1`） |
| 3-3 | 防抖：连输 10 字符只 1 次请求 | Network 截图 |
| 3-4 | 筛选组合生效并可清空 | 截图 + 请求体 |

### 闸门答辩（先读答案，再合上自测）

**Q1 为什么分类页用 `/category/top`，不用首页的 `/home/category/mutli`？**

因为首页那个只返回 `id/name/icon`，够画宫格，但没有 `children` 和商品；分类页需要「二级分类 + 商品」，`/category/top` 一次就给全了。另外两者数据本身也不一致（实测首页 10 个、分类页 9 个），混用会导致左侧分类点进去是空的。

**Q2 `scroll-into-view` 和 `bindscroll` 各解决什么问题？为什么不能只留一个？**

`scroll-into-view` 是「程序让滚动条动」（点左侧跳右侧），`bindscroll` 是「滚动条告诉程序它动了」（右侧滚、左侧跟着高亮）。只留前者，手滑右侧时左侧不会跟着变；只留后者，点左侧无法带动右侧。方向相反，缺一不可。

**Q3 切排序为什么必须回第 1 页？**

分页是「当前条件下第 N 页」。条件变了，第 N 页的含义就变了：`page=5&sortField=price` 是新排序下的第 5 页，前 4 页永远看不到；而且旧列表还在 `data` 里，会和新结果拼在一起造成串页。所以条件变化 = 重置 `page`、清空列表、重发第 1 页。

---

## 9. 完成标志（M3）

- 分类页左右联动顺畅，高亮与滚动位置一致
- 搜索输入防抖生效，结果页排序/分页正确
- 三态齐全，断网不白屏

---

## 10. 复盘

| 日期 | 内容 |
| --- | --- |
| 2026-11-24 | 阶段文档建立。同日在 `idoc/api-reference.md` 固化 44 个接口的真实 method/path（此前 roadmap 中 `/search`、`/category`、`/refresh`、`/pay/mock` 等路径均为 React 版推测，实测或查证后已全部修正）。实测发现 `/search/all` 服务端 ES 故障（500 all shards failed），搜索功能需等后端恢复才能联调；`/category/top` 与 `/search/tips` 可用（tips 返回空数组）。 |
