# 笔记 · flex 布局与自定义组件宿主节点的三个坑

> 来源：S3 分类页实机调试。截图现象：右侧三列商品溢出屏幕、列间缝隙不均、最后一行中间空洞、导航栏下方露出一条彩色缝。

---

## 1. flex 子项默认 `min-width: auto`，会被内容撑宽

**现象**：预期 3 列各占 31%，实际每列都变宽并且整块溢出屏幕右边。

**原因**：flex 子项的 `min-width` 初值不是 `0` 而是 `auto`，含义是「不小于内容的最小宽度」。内容（图片、长文本）把子项的最小宽度顶大，`width: 31%` 被突破，父容器也被一起撑宽——于是 31% 是相对一个**比屏幕还宽的容器**算的，越算越大。

**解法**：从容器到目标子项的整条 flex 链上补 `min-width: 0`。

```scss
.page { min-width: 0; }
.category { min-width: 0; }
.category__right { flex: 1; min-width: 0; }
.block__goods-item { flex: 0 0 31%; min-width: 0; }
```

**记忆点**：看到「flex 布局横向溢出」，先怀疑 `min-width: auto`，纵向溢出则怀疑 `min-height: auto`（那个会让 `scroll-view` 滚不动）。

---

## 2. `justify-content: space-between` 会把最后一行撑出空洞

**现象**：一行 3 个时正常；最后一行只有 2 个时，两个商品被推到两端，中间空一大块。

**原因**：`space-between` 的语义是「剩余空间**全部分配到元素之间**」。一行 3 个放满时没有剩余空间；不足 3 个时，剩余空间全塞进元素之间，视觉上就是被拉开。

**解法**：不要让它去分配，自己写死间距。

```scss
.block__goods {
  display: flex;
  flex-wrap: wrap;
  padding: 0 $gap-base;
}

.block__goods-item {
  flex: 0 0 31%;          // 只定尺寸，不参与拉伸/压缩
  margin: 0 3.4% $gap-sm 0;

  &:nth-child(3n) {
    margin-right: 0;      // 每行第 3 个顶到边，正好 100%
  }
}
```

31% × 3 + 3.4% × 2 = 99.8%，留 0.2% 是给像素舍入的余量；不留的话可能因为 0.3px 的误差把第 3 个挤到下一行。

**替代方案**：`gap: $gap-sm` + `flex: 0 0 calc((100% - #{$gap-sm} * 2) / 3)`。更干净，但 `gap` 在 flex 里需要 Chrome 84 / iOS 14.5 以上，本项目按 WebView 兼容优先取 margin 方案。

---

## 3. 自定义组件的宿主节点默认是行内元素

**现象**：`<navigation-bar />` 与下方内容之间有一条几像素的缝，缝里透出下层内容。

**原因**：组件的宿主节点（WXML 里的 `<navigation-bar>` 本身）不是 `view`，它默认是**行内元素**。行内元素底部有「基线以下的留白」（同 `<img>` 下方莫名几 px 是同一原因），这段空间不属于任何子元素，背景是透明的，于是把下层内容露了出来。

首页同样有导航栏却不明显——因为首页下方接的是灰色背景的 `scroll-view`，缝隙融进去了；分类页下面紧接商品图，就暴露了。

**解法**：宿主节点的块级化已在 `app.scss` 里统一写好（2026-11-25 起），**页面不用再抄**：

```scss
navigation-bar {
  display: block;
  flex: none;   // 骨架页里是分栏头，不被压缩
}
```
页面样式在 `@import global.scss` 之后，能覆盖全局规则。

页面 wxss（以及 `app.wxss`）都可以用标签名选择器直接命中组件宿主节点。

**记忆点**：凡是用自定义组件拼页面骨架（导航栏、tab 容器、底部工具栏），都要考虑宿主节点的 `display` 与 `flex` 行为，别假设它跟 `view` 一样。

---

## 4. 相关：`z-index` 必须配合定位

`.block__title` 用了 `position: sticky; top: 0; z-index: 1`。这里的 `z-index` **不能省**——省略后，滚动上来的商品图会盖住吸顶标题。但 `z-index` 只在元素处于「参与层叠计算」的状态下生效，也就是说必须同时有 `position: relative/absolute/sticky/fixed` 之一，单写 `z-index` 完全无效。

固定底栏（`.bar` / `.save` / `.footer`）不参与滚动，所以同样带 z-index；它们与内容区的遮挡关系靠留白解决，不靠把内容压到底栏下面。

---

## 5. 页面级 `sticky` 方案已废弃：改用 flex 骨架

**现象**：早期给导航栏和 tab 条写 `position: sticky; top: 0`，滚动一段后仍会被顶出屏幕；即使没被顶出，拖动/回弹时头部还是跟着整页一起动，滚动范围仍是整页。

**两个原因**：
1. `sticky` 元素只在**父元素的盒子范围**内生效。当时 `page` 被全局 `height: 100%` 钉死成一屏高，内容溢出到盒子外面滚，吸顶最多撑一屏就被父盒底边顶走。
2. `sticky` 的元素**仍在滚动容器里**。视觉上粘住，但滚动惯性、回弹、滚动条都作用于整页，头部并没有真正脱离滚动范围。

**最终解法（2026-11-25）**：全站统一 flex 骨架，头部放进滚动容器之外。

```scss
page {
  display: flex;
  flex-direction: column;
  height: 100%;        // 骨架需要确定高度，.body 的 flex:1 才有参照
}

.header { flex: none; }  // 导航栏（+ tab / 子分类条），双条头部包在一起

.body {
  flex: 1;
  height: 0;           // flex 子项要有确定高度，scroll-view 才真正滚动
}
```

要点：
- 头部不滚是**结构保证**的，不需要 sticky / fixed，也没有 z-index 冲突。
- 固定底栏的留白从 `page{padding-bottom}` 移到 `.body{padding-bottom}`，否则会把 page 盒撑出滚动区。
- 骨架页的分页用 `scroll-view` 的 `bindscrolltolower`，页面级 `onReachBottom` 收不到。
- 新页面按这套写即可；`navigation-bar` 的 `display:block; flex:none` 由 `app.scss` 统一提供，页面不用再写。

**已覆盖全部 16 个页面**，包括 `search`（自绘输入型导航，同属 flex 骨架）。
