import { getCategoryTop } from '../../api/category'
import { toHttps } from '../../utils/common'

Page({
  data: {
    categories: [],
    activeIndex: 0,
    scrollTop: 0,
    loading: true,
    error: ''
  },

  onLoad() {
    this.fetchCategories()
  },

  onUnload() {
    clearTimeout(this.syncLockTimer)
  },

  async fetchCategories() {
    this.setData({ loading: true, error: '' })

    try {
      const list = await getCategoryTop()

      // 接口给的是 http 直链，三层都要转，且不直接改原对象
      const categories = list.map((cat) => ({
        ...cat,
        picture: toHttps(cat.picture),
        children: cat.children.map((child) => ({
          ...child,
          picture: toHttps(child.picture),
          goods: child.goods.map((goods) => ({ ...goods, picture: toHttps(goods.picture) }))
        }))
      }))

      this.setData({ categories, loading: false }, () => {
        // 等这一帧渲染完再量，否则量到的是空节点
        wx.nextTick(() => this.measureBlocks())
      })
    } catch (e) {
      console.log('[category]', e)
      this.setData({ loading: false, error: '加载失败，请稍后重试' })
    }
  },

  /**
   * 量出每个区块相对右侧滚动区顶部的偏移，缓存在 this 上
   * 不放进 data：它不参与渲染，放进去只会多传一份数据给渲染层
   */
  measureBlocks() {
    wx.createSelectorQuery()
      .selectAll('.block')
      .boundingClientRect()
      .select('.category__right')
      .boundingClientRect()
      .exec(([blocks, viewport]) => {
        if (!blocks || !blocks.length || !viewport) return
        this.blockOffsets = blocks.map((item) => item.top - viewport.top)
        this.rightHeight = viewport.height
        this.contentHeight = blocks[blocks.length - 1].bottom - viewport.top
        // 能滚到的最远位置。超过它的目标值会被容器截断，平滑滚动到边界再回弹
        this.maxScrollTop = Math.max(0, this.contentHeight - this.rightHeight)
        this.currentScrollTop = 0
      })
  },

  onTapNav(e) {
    const index = Number(e.currentTarget.dataset.index)
    const offsets = this.blockOffsets
    if (!offsets || offsets[index] === undefined) return

    this.lockScrollSync()

    // 不用 scroll-into-view：它为支持重复点击要先清空，清空会把位置拉回 0
    // 区块偏移可能超过可滚动上限，直接下发会被截断并回弹，所以先夹取
    const limit = this.maxScrollTop === undefined ? offsets[index] : this.maxScrollTop
    const target = Math.min(offsets[index], limit)

    // 已经在目标位置就只切高亮，不下发滚动指令——这是消除 1px 抖动的关键。
    // 判断依据必须是「实际滚动位置」：用上次下发的值判断会陷入 target / target-1 横跳
    if (Math.abs((this.currentScrollTop || 0) - target) < 2) {
      this.setData({ activeIndex: index })
      return
    }

    // 受控属性的值不变就不下发。此时错开 1px 强制生效，恰好落在上面 2px 的容差内，
    // 所以下一次点击会走 return 分支，不会来回横跳
    let value = target
    if (target === this.data.scrollTop) value = target > 0 ? target - 1 : target + 1

    this.setData({ activeIndex: index, scrollTop: value })
  },

  /**
   * 程序滚动期间锁住「滚动反推高亮」，否则高亮会一路闪过去
   * 只要滚动事件还在来就不断延期，停手 200ms 后才把控制权交回
   */
  lockScrollSync() {
    this.syncLocked = true
    clearTimeout(this.syncLockTimer)
    this.syncLockTimer = setTimeout(() => {
      this.syncLocked = false
    }, 400)
  },

  onRightScroll(e) {
    // 只记在 this 上，不 setData：回写受控属性会让用户的手势和指令打架
    this.currentScrollTop = e.detail.scrollTop

    if (this.syncLocked) {
      clearTimeout(this.syncLockTimer)
      this.syncLockTimer = setTimeout(() => {
        this.syncLocked = false
      }, 200)
      return
    }

    const offsets = this.blockOffsets
    if (!offsets || !offsets.length) return

    const { scrollTop } = e.detail
    let index = 0
    for (let i = 0; i < offsets.length; i++) {
      // 留 10px 容差，避免恰好卡在边界时来回抖
      if (scrollTop >= offsets[i] - 10) index = i
      else break
    }
    // 内容不够高时最后一个区块永远滚不到顶，到底就直接选中它
    if (scrollTop + this.rightHeight >= this.contentHeight - 2) index = offsets.length - 1

    // 滚动事件每帧都来，没变化就不跨线程 setData
    if (index !== this.data.activeIndex) this.setData({ activeIndex: index })
  },

  onTapSearch() {
    wx.navigateTo({ url: '/pages/search/search' })
  },

  onRetry() {
    this.fetchCategories()
  },

  onTapGoods(e) {
    // 详情页在 S4 才建
    wx.showToast({ title: `商品 ${e.detail.id}`, icon: 'none' })
  }
})
