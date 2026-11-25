# 笔记 · scroll-view 控制滚动的四个坑

> 来源：S2 首页「回到顶部」与 S3 分类页左右联动，两次都是同一类问题换了个场景重现。

---

## 0. 先分清谁在控制滚动条

| 接口 | 方向 | 值 | 用途 |
| --- | --- | --- | --- |
| `scroll-top` | 程序 → 滚动条 | 像素数值 | 跳到已知偏移 |
| `scroll-into-view` | 程序 → 滚动条 | 子节点 id 字符串 | 跳到某个锚点 |
| `bindscroll` | 滚动条 → 程序 | `e.detail.scrollTop` | 反推当前位置 |

前两个是**命令属性**（下发指令），第三个是**事件**（上报状态）。混淆方向是大部分坑的来源。

---

## 1. 值不变就不会重新下发

两个命令属性都有这个性质：`setData` 成同一个值，框架认为状态没变，不会产生任何滚动动作。

**不要用「减 1px」来强行制造变化**。这是本项目实际踩过的坑：为了让重复点击生效，写成「与上次相同就减 1px」，结果连点同一个目标时——

```
第 1 次：target ≠ 上次值 → 设 target
第 2 次：target = 上次值 → 设 target − 1
第 3 次：target ≠ 上次值 → 设回 target
```

在 `target` 与 `target−1` 之间无限横跳，表现为**持续的微小上下抖动**。末尾几个区块因为都被夹取到同一个上限，连续点击同样会触发。

**正确的做法是用命令式 API 绕开这个限制**（见 §7）。

---

## 2. 但 `scroll-into-view` 的「先清空」会把滚动位置拉回 0

这是 S3 分类页踩到的坑，**最坑的一条**。

为了让「重复点击同一分类」也能滚动，按 §1 的做法先 `setData({ intoView: '' })` 再设值。结果高频点击不同分类时，右侧**上下摇晃**：

```
点击 A → 清空（位置被拉到 0，也就是顶部）→ 滚到 A
点击 B → 清空（又弹回顶部）→ 滚到 B
```

每次点击都变成「弹回顶部 → 再滚下去」。S2 的「回到顶部」用的也是这招却没出问题，因为它的目标本来就是 0，弹不弹都一样——**同样的写法在不同场景下结果完全不同**。

**结论**：有偏移量时优先 `scroll-top`；`scroll-into-view` 只适合「目标位置未知、只有锚点」的场景，且要接受它不能重复点击同一目标。

---

## 3. 不要在 `bindscroll` 里回写 `scroll-top`

那等于用「上一个滚动位置」去覆盖用户的实时手势。`setData` 有跨线程延迟，用户手越快，回写值与实际位置的落差越大，表现为**抖动、拖影、跳帧**。

S2「回到顶部」的第一版就是 `bindscroll` 回写 `scroll-top`，快速下滑时抖动明显。

`bindscroll` 里只做一件事：**算出需要变化的状态，变了才 `setData`**。

```js
onRightScroll(e) {
  const { scrollTop } = e.detail
  let index = 0
  for (let i = 0; i < this.blockOffsets.length; i++) {
    if (scrollTop >= this.blockOffsets[i] - 10) index = i
    else break
  }
  if (index !== this.data.activeIndex) this.setData({ activeIndex: index }) // 变了才发
}
```

滚动事件每帧都可能触发，一次 3 秒的滚动≈180 次。每次都 `setData` 就是 180 次跨线程通信。

---

## 4. 程序滚动会触发 `bindscroll`，要主动「锁」住反推

点第 9 个分类跳到第 9 块时，滚动会依次经过第 1~8 块，`bindscroll` 每过一块就把高亮改一次，视觉上高亮从第 1 项一路闪到第 9 项。

`scroll-view` **没有 `scrollend` 事件**，所以用「事件还在来就不断延期」的方式判断停止：

```js
lockScrollSync() {
  this.syncLocked = true
  clearTimeout(this.syncLockTimer)
  this.syncLockTimer = setTimeout(() => { this.syncLocked = false }, 400)
}

onRightScroll(e) {
  if (this.syncLocked) {
    clearTimeout(this.syncLockTimer)
    this.syncLockTimer = setTimeout(() => { this.syncLocked = false }, 200)
    return
  }
  // ...正常反推
}
```

`onUnload` 里必须 `clearTimeout`，否则页面销毁后定时器回调还在跑。

---

## 5. 内容不够高时，最后一个区块永远高亮不到

区块高度不一，最后一个区块的顶部偏移可能大于「最大可滚动距离」。用户滚到底了，`scrollTop` 仍然小于它的偏移，反推逻辑永远选不到它。

兜底：

```js
if (scrollTop + this.rightHeight >= this.contentHeight - 2) index = offsets.length - 1
```

`rightHeight` 是滚动区可视高度、`contentHeight` 是内容总高，都在量偏移时顺手记下来。

---

## 6. 目标偏移超过上限时，平滑滚动会「滚过头再回弹」

点击最后几个区块时，它们的 `offset` 大于 `contentHeight - rightHeight`（可滚动上限）。直接 `setData({ scrollTop: offset })`，容器滚到边界后被截断并回弹——表现和 §2 的摇晃很像，但只有**末尾几项**触发。

```js
onTapNav(e) {
  const index = Number(e.currentTarget.dataset.index)
  const offsets = this.blockOffsets
  if (!offsets || offsets[index] === undefined) return

  // 夹取到可滚动上限，末尾几个区块统一停在底部
  const limit = this.maxScrollTop === undefined ? offsets[index] : this.maxScrollTop
  const target = Math.min(offsets[index], limit)

  this.setData({ activeIndex: index, scrollTop: target })
}
```

**排查技巧**：摇晃只出现在「开头几项」还是「末尾几项」，指向完全不同的问题——开头 → 位置被拉回 0（§2），末尾 → 超出滚动上限（本节）。

---

## 7. 命令式滚动：`ScrollViewContext.scrollTo`

`scroll-top` / `scroll-into-view` 是**受控属性**：值不变就不下发，于是必须想各种办法制造「值变化」。样式上这是把命令当成状态来用，天然别扭。

`scroll-view` 还提供一套**命令式**接口，调一次执行一次，不需要担心值是否变化：

```js
// 拿句柄（要在节点渲染后取，例如 setData 回调 + wx.nextTick 里）
wx.createSelectorQuery()
  .select('.category__right')
  .node()
  .exec((res) => {
    this.rightScroll = res[0] && res[0].node   // ScrollViewContext
  })

// 调用
this.rightScroll.scrollTo({ top: 300, animated: false })
```

配套的还有 `scrollIntoView`、`scrollBy`、`scrollToTop` 等（较新基础库）。`animated: true` 时是平滑滚动。

**为什么本项目最终用它**：用受控属性时，「滚走后再点同一个分类」因为 `data.scrollTop` 还是旧值而不下发，表现为点了没反应；加上「减 1px」强行下发又会连点抖动。命令式两个问题都不存在。

**判断是否已经到位，用实际滚动位置，不用上次下发的值**：

```js
onRightScroll(e) {
  this.currentScrollTop = e.detail.scrollTop   // 只记在 this，不 setData
  // ...
}

onTapNav(e) {
  if (Math.abs((this.currentScrollTop || 0) - target) < 2) {
    this.setData({ activeIndex: index })   // 已在目标位置，只切高亮
    return
  }
  this.setData({ activeIndex: index })
  this.rightScroll.scrollTo({ top: target, animated: false })
}
```

**注意**：`node()` 要在节点真实存在之后取。数据是异步来的，`onReady` 时还在 `loading` 分支里，节点不存在——放在 `setData` 回调 + `wx.nextTick` 里取才有效。
