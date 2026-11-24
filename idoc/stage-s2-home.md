# 阶段 S2 · 首页（零基础详细操作版）

> 状态：**代码已完成（Step 1–5），待实机验收**
> 工时：2 天 · 前置：S1 完成（`request` 能拿到真实数据）
> 关联：[`03-roadmap.md`](./03-roadmap.md) §2、[`01-migration-map.md`](./01-migration-map.md) §2

---

## 1. 学习目标

- 能自己算出「自定义导航栏」的高度，并解释为什么不能写死 44px
- 会用 `swiper` 做轮播，知道 `<image>` 为什么必须给宽高
- 掌握 `wx:for` / `wx:key` / `wx:if`，知道 `wx:key` 写错会怎样
- 会写自定义组件（`properties` / `triggerEvent` / `observers`），并解释它和 `data` 的区别
- 知道分页只在接口真有 `page` 参数时才做；首页用「只在 `onLoad` 请求一次」实现切回来不重复请求
- 知道页面三态（loading / empty / error）怎么落地

---

## 2. 前置知识

### 2.1 自定义导航栏的几何（本阶段最硬的一块）

`app.json` 里 `navigationStyle: "custom"` 意味着**系统导航栏被关掉了**，页面内容会从屏幕最顶端开始画，会盖住状态栏（时间、电量）和右上角胶囊。

要自己画一个导航栏，需要三段高度：

```
┌─────────────────────────┐  ← 屏幕顶
│      状态栏（时间/电量）      │  statusBarHeight，约 20~47px，机型不同
├─────────────────────────┤
│  返回   页面标题    ● ●  │  导航条内容区，高度由胶囊决定
└─────────────────────────┘
```

计算公式（官方文档给出的思路）：

```
statusBarHeight = wx.getWindowInfo().statusBarHeight
胶囊            = wx.getMenuButtonBoundingClientRect()  // { top, height, left, right }
导航条高度       = (胶囊.top - statusBarHeight) * 2 + 胶囊.height
右侧留白宽度     = windowWidth - 胶囊.left
```

为什么不能写死 44px：iOS 刘海屏、Android 挖孔屏、iPad 的状态栏高度都不一样，写死必然有页面被盖住或空一大块。

### 2.2 `wx:for` 与 `wx:key`

```xml
<view wx:for="{{list}}" wx:key="id">
  {{index}} - {{item.name}}
</view>
```

- 默认变量名是 `item` / `index`，可用 `wx:for-item` / `wx:for-index` 改名
- `wx:key` 写**属性名**（`id`），**不要**写 `{{item.id}}`。
- `wx:key` 不能使用数据绑定，应直接指定一个字段名字符串；https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/list.html
- 没有唯一 id 时用 `wx:key="*this"`（数组项本身是唯一值时）
- 不写 `wx:key` 不会报错，但列表增删时会复用错节点、状态错位

### 2.3 自定义组件与页面怎么通信

| 方向 | API | 类比 React |
| --- | --- | --- |
| 父 → 子 | `properties`（写在 `usingComponents` 的标签上） | props |
| 子 → 父 | `this.triggerEvent('tap-card', { id })` + 父级 `bind:tap-card` | 回调函数 |
| 子改自身 | `this.setData()` | setState |

两个坑：

1. `properties` 收到对象时是**引用**，子组件里直接改它不会触发视图更新，必须 `setData`
2. `triggerEvent` 的事件名**必须全小写**（驼峰会被静默吞掉）

### 2.4 生命周期：`onLoad` 与 `onShow`

| 钩子 | 触发时机 | 适合做什么 |
| --- | --- | --- |
| `onLoad` | 页面创建，只一次 | 请求首屏数据、读 `options` 参数 |
| `onShow` | 每次显示（含切 tab 回来） | 刷新会变的数据（购物车、订单） |
| `onReady` | 首次渲染完成 | 需要节点尺寸的操作（`createSelectorQuery`） |

**首页要不要在 `onShow` 里重新请求？** 不要。首页数据基本不变，每次切 tab 都请求会浪费流量、还会闪一下。用「`onLoad` 请求 + 标记已加载」即可。

### 2.5 图片必须是 HTTPS（实测坑）

用 curl 打 `/home/banner` 拿到的 `imgUrl` 是：

```
http://yjy-xiaotuxian-dev.oss-cn-beijing.aliyuncs.com/picture/...
```

**是 http，不是 https。** 开发者工具勾了「不校验合法域名」能显示，真机上会加载失败。

处理方式：渲染前统一转协议。

```js
const toHttps = (url) => url.replace(/^http:\/\//, 'https://')
```

### 2.6 轮播：原生 `swiper` 还是 `t-swiper`

| | 原生 `swiper` | TDesign `t-swiper` |
| --- | --- | --- |
| 依赖 | 无 | 组件库 |
| 学习价值 | 高（要自己管高度、指示点） | 低（都封装好了） |
| 适用 | 本项目先用它，理解原理 | 想省事时替换 |

本项目**先用原生 `swiper`**，因为你要知道轮播是怎么工作的。

### 2.7 正方形封面：`padding-top: 100%` 到底按什么算

商品图要永远正方形。`height: 100%` 不行——父级高度是 `auto` 时百分比高度会失效为 0，盒子塌掉。可行写法：

```scss
.cover {
  position: relative;
  width: 100%;
  padding-top: 100%; // 100% × 父容器「宽度」→ 高度 = 宽度
}

.pic {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

**规则（CSS 2.1 盒模型）：`padding-*` 与 `margin-*` 的百分比，一律参照包含块的宽度。** `padding-top` / `padding-bottom` 同样按宽算，不看高度。

之所以这样规定，是因为「父元素高度由子内容撑开、子元素高度又依赖父高度」会形成循环，参照宽度是唯一不循环的解法。

- 4 列时父宽约 170rpx → 盒子 170×170
- 父级改成 2 列、宽约 345rpx → 盒子 345×345，**组件一行都不用改**

绝对定位的图片能铺满，是因为绝对定位元素的包含块是**祖先的 padding box**，`padding-top` 撑出来的空间正落在里面。

> 现代替代写法 `aspect-ratio: 1 / 1` 语义更直白，但老 WebView 会直接忽略、高度塌成 0。本项目 WebView 兼容优先，先用 padding 方案。

---

## 3. Step 0：准备（5 分钟）

1. S1 的 `api/home.js` 已经能拿到数据（首页显示 banner 条数）。
2. 把 `pages/index/index.wxml` 里的「S0 冒烟测试」按钮和 banner 条数占位删掉，准备正式写页面。

---

## 4. 分步实现

### Step 1：改造 `components/navigation-bar`（半天）

目标：一个只做「返回 + 标题 + 右侧插槽」的极简导航栏，高度自适应。

要改的点：

| 文件 | 改动 |
| --- | --- |
| `.js` | `attached` 里算 `statusBarHeight` / `navHeight` / `rightWidth`，写入 `data` |
| `.wxml` | 外层 `style="padding-top: {{statusBarHeight}}px"`，内层 `style="height: {{navHeight}}px"`；标题绝对居中 |
| `.scss` | 删掉 weui 那一大套，只留定位与居中 |

要求：

- 标题**绝对居中**，不能被左侧返回按钮挤偏
- 右侧留出 `rightWidth` 的空白，避免标题压到胶囊
- 「返回」按钮用 `wx.navigateBack()`；页面栈只有 1 层时不显示返回键（首页要隐藏）

**验收**：iOS 与 Android 各看一次，标题不被状态栏、胶囊遮挡。

### Step 2：首页轮播（半天）

- `getBannerList('1')` 拿数据 → `setData({ banners })`
- `swiper` 高度写死一个值（本项目取 `340rpx`），`<image>` 用 `mode="aspectFill"`
- `circular` / `autoplay` / `interval="3000"` / `indicator-dots`
- 图片地址套 `toHttps`

**验收**：轮播能自动滚动、能手动滑、指示点数量对；图片不拉伸变形。

### Step 3：分类宫格 + 楼层（半天）

- `getHomeCategories()` → 10 个分类，宫格排列（每行 5 个），图标用 `icon`
- `getNewGoods()` → 4 个商品，横向排列
- `getHotPanels()` → 4 个入口卡片（`pictures` 是数组，取第一张）

**验收**：宫格一行 5 个不挤压；楼层标题栏样式统一。

### Step 4：抽 `components/goods-card`（2 小时）

目标：把「商品卡」抽成组件，2 列 / 3 列都能用。

```js
Component({
  properties: {
    goods: { type: Object, value: {} },
    layout: { type: String, value: 'grid' }
  },
  methods: {
    onTap() {
      this.triggerEvent('tap-card', { id: this.data.goods.id })
    }
  }
})
```

要求：

- `goods` 用 `Object` 类型传入，内部不要直接改它
- 点击时 `triggerEvent('tap-card', { id })`，父页面 `bind:tap-card` 接收
- 价格用 `$brand-color`

**验收**：同一组件在首页用两次——新鲜好物 **4 列**、猜你喜欢 **2 列**，列数只由父级宽度决定（24% / 48%），组件内部零改动。

### Step 5：分页 + 下拉刷新 + 三态（半天）

- 分类楼层用 `getCategoryFloors()`：**接口没有分页参数**，一次返回 4 层，直接全量渲染。不要自己切片造假分页——内容不足一屏时 `scrolltolower` 会立刻触发，等于没分页，还会误导阅读代码的人
- 但**底部要有「没有更多了」的静态提示**：用户需要知道列表到头了。提示归提示，别给它挂加载逻辑，两者是两件事
- 下拉刷新：页面改成 `flex` 上下分栏 + `scroll-view` 的 `refresher-enabled`。页面级 `enablePullDownRefresh` 会把整个容器（含自定义导航栏）一起下移，标题跟着动
- 真正的触底分页放在**猜你喜欢** `GET /home/goods/guessLike`：Apifox 只文档化了响应里的 `counts` / `page` / `pageSize` / `pages` / `items`，**没写请求参数**；实测 `?page=2&pageSize=4` 生效（`page` 原样回显），默认 `counts=338 / pageSize=10 / pages=34`。首屏取第 1 页 10 条，触底加载下一页，用 `page < pages` 判断还有没有
- 楼层 `/home/goods` 则相反：没有分页参数，一次性 4 层，不做分页
- 三态：`loading`（骨架）、`empty`（无数据文案）、`error`（重试按钮）

**验收**：4 层楼层完整渲染、猜你喜欢触底能加载下一页且到底显示「没有更多了」、下拉刷新能收起且标题不动、三态齐全。

---

## 5. 验收

- [ ] 首页导航栏在 iOS / Android 都不遮挡
- [ ] 轮播图正常显示（真机也是 https）
- [ ] 分类宫格 10 项、楼层数据正确
- [ ] `goods-card` 组件被复用且点击能拿到 id
- [ ] 楼层一次性渲染完整（接口无分页参数，不做假分页）
- [ ] 猜你喜欢 2 列、触底加载下一页、到底显示「没有更多了」
- [ ] 下拉刷新可收起
- [ ] 三态齐全，断网不白屏
- [ ] 切到别的 tab 再回首页，Network 面板**没有**新请求

---

## 6. 报错急救表

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 内容被状态栏盖住 | 没加 `padding-top: statusBarHeight` | 用 JS 算出的高度做 padding |
| 标题偏左/偏右 | 用了 flex 居中但左右宽度不等 | 标题用 `position: absolute; left: 0; right: 0` |
| 商品图不是正方形 / 高度为 0 | 想用 `height: 100%` 撑正方形，但父级高度是 auto | 用 `padding-top: 100%` 撑高度，图片绝对定位铺满 |
| 图片不显示，真机才失败 | `imgUrl` 是 `http://` | 渲染前转 https |
| 图片巨大/变形 | `<image>` 没给宽高 | 容器固定宽高 + `mode="aspectFill"` |
| 轮播高度塌陷 | `swiper` 没设高度 | `swiper` 必须显式高度 |
| 列表项状态错位 | `wx:key` 用了 `index` 或没写 | 用业务 id |
| 触底重复请求 | 没判 `loadingMore` | 请求前置标志位，`finally` 里复位 |
| 组件点了没反应 | `triggerEvent` 用了驼峰 | 全小写，父级 `bind:tap-card` |

---

## 7. 阶段作业与闸门

| # | 作业 | 提交物 |
| --- | --- | --- |
| 2-1 | 导航栏自适应（iOS + Android 截图） | 两张图 |
| 2-2 | 轮播可用（含 https 处理） | 代码 + 真机/工具截图 |
| 2-3 | `goods-card` 组件复用两处 | 代码 |
| 2-4 | 猜你喜欢分页 + 下拉刷新 + 三态 | Network 截图（触底只多一页，切 tab 不重发） |

### 闸门答辩（先读答案，再合上自测）

**Q1 自定义导航栏为什么要用公式算高度，不能写死？**
状态栏高度随机型变化（20~47px），胶囊位置也不同。写死会导致部分机型内容被状态栏遮挡或出现大片空白。公式把「状态栏高度」和「胶囊位置」两个变量都纳入，所以能自适应。

**Q2 `properties` 和 `data` 有什么区别？**
`properties` 是**父组件传进来的**（只读语义，外部驱动），`data` 是**组件自己的**内部状态。两者最终都会出现在 `this.data` 里，所以可以直接读；但改 `properties` 要用 `setData` 才能触发更新，而且从设计上不该由子组件主动改。

**Q3 为什么首页不在 `onShow` 里重新请求？**
`onShow` 每次显示都会触发（含切 tab 回来、从详情页返回）。首页数据几乎不变，每次重拉既浪费流量又会让页面闪一下。真正需要 `onShow` 刷新的是购物车、订单列表这类「会被别的页面改掉」的数据。

---

## 8. 完成标志（M2）

- 首页 5 个区块渲染正确
- 导航栏在各种机型不遮挡
- 猜你喜欢触底分页、下拉刷新、三态可用
- 切 tab 回来不重复请求

---

## 9. 复盘

| 日期 | 内容 |
| --- | --- |
| | |
