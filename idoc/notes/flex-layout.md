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

**解法**：在**使用该组件的页面 wxss** 里给宿主节点显式块级化：

```scss
navigation-bar {
  position: relative;
  z-index: 10;   // 兜底：下方 sticky 标题有 z-index，滚动时可能画到导航栏地盘
  display: block;
  flex: none;
  background-color: $bg-card;
}
```

页面 wxss 可以用标签名选择器直接命中组件宿主节点。

**记忆点**：凡是用自定义组件拼页面骨架（导航栏、tab 容器、底部工具栏），都要考虑宿主节点的 `display` 与 `flex` 行为，别假设它跟 `view` 一样。

---

## 4. 相关：`z-index` 必须配合定位

`.block__title` 用了 `position: sticky; top: 0; z-index: 1`。这里的 `z-index` **不能省**——省略后，滚动上来的商品图会盖住吸顶标题。但 `z-index` 只在元素处于「参与层叠计算」的状态下生效，也就是说必须同时有 `position: relative/absolute/sticky/fixed` 之一，单写 `z-index` 完全无效。

这也是导航栏要写 `position: relative` 才带得动 `z-index: 10` 的原因。
