import { getToken } from '../../utils/auth'
import { clampCount } from '../../utils/common'
import {
  getCartList,
  removeCartItems,
  updateAllSelected,
  updateCartCount,
  updateCartSelected
} from '../../utils/cart'

Page({
  data: {
    list: [],
    isAllSelected: false,
    totalCount: 0,
    totalPrice: '0.00',
    loading: true,
    error: ''
  },

  // tabBar 页面只触发一次 onLoad，来回切靠 onShow 对齐数据
  onShow() {
    this.fetchList()
  },

  async fetchList() {
    this.setData({ loading: true, error: '' })

    try {
      const list = await getCartList()
      // 失效商品沉到最后，不参与全选与合计
      list.sort((a, b) => Number(!a.isEffective) - Number(!b.isEffective))
      this.retried = false
      this.setData({ ...this.withSummary(list), loading: false })
    } catch (e) {
      console.log('[cart]', e)
      // 401 时 token 已被 request.js 清掉，重跑一次自然落到本地数据。只允许重试一次
      if (e.code === 401 && !this.retried) {
        this.retried = true
        this.fetchList()
        return
      }
      this.setData({ loading: false, error: '加载失败，请稍后重试' })
    }
  },

  /* ---------- 列表原地更新 ---------- */

  findItem(skuId) {
    return this.data.list.find((i) => i.skuId === skuId)
  },

  patchItem(skuId, patch) {
    return this.data.list.map((i) => (i.skuId === skuId ? { ...i, ...patch } : i))
  },

  // 列表变了就把全选态与合计一起算好，避免多处重复
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
  },

  /* ---------- 交互 ---------- */

  async onToggleItem(e) {
    const item = this.findItem(e.currentTarget.dataset.skuId)
    if (!item || !item.isEffective) return

    // 先改界面再发请求：勾选是高频操作，等接口回来再变会明显卡顿
    const next = !item.selected
    this.setData(this.withSummary(this.patchItem(item.skuId, { selected: next })))

    try {
      await updateCartSelected(item.skuId, next)
    } catch (err) {
      console.log('[cart] 勾选失败', err)
      this.fetchList()
    }
  },

  async onToggleAll() {
    const next = !this.data.isAllSelected
    const list = this.data.list.map((i) => (i.isEffective ? { ...i, selected: next } : i))

    this.setData(this.withSummary(list))

    try {
      await updateAllSelected(next)
    } catch (err) {
      console.log('[cart] 全选失败', err)
      this.fetchList()
    }
  },

  onMinus(e) {
    const item = this.findItem(e.currentTarget.dataset.skuId)
    if (!item) return

    // Number()：置空重填那一帧 count 是 ''，直接减会得到 -1
    const count = Number(item.count) || 1
    if (count <= 1) return
    this.changeCount(item.skuId, count - 1)
  },

  onPlus(e) {
    const item = this.findItem(e.currentTarget.dataset.skuId)
    if (!item) return

    // Number()：'' + 1 会变成字符串 '1'，再点就成 '11'
    const count = Number(item.count) || 1
    if (count >= item.limit) return
    this.changeCount(item.skuId, count + 1)
  },

  changeCount(skuId, count) {
    this.setData(this.withSummary(this.patchItem(skuId, { count })))
    this.scheduleCountSync(skuId, count)
  },

  /**
   * 数量提交防抖：连点 5 次只发最后一次
   * 不防抖的话多个请求会乱序返回，服务端最终值取决于哪个最后到
   */
  scheduleCountSync(skuId, count) {
    if (!this.countTimers) this.countTimers = {}

    clearTimeout(this.countTimers[skuId])
    this.countTimers[skuId] = setTimeout(() => {
      delete this.countTimers[skuId]
      this.submitCount(skuId, count)
    }, 300)
  },

  // 页面隐藏或销毁时把没提交的数量立刻发出去，否则这次修改会丢
  flushCountSync() {
    const timers = this.countTimers
    if (!timers) return

    Object.keys(timers).forEach((skuId) => {
      clearTimeout(timers[skuId])
      const item = this.findItem(skuId)
      const count = Number(item && item.count) || 0
      if (count >= 1) this.submitCount(skuId, count)
    })

    this.countTimers = null
  },

  onHide() {
    this.flushCountSync()
  },

  onUnload() {
    this.flushCountSync()
  },

  async submitCount(skuId, count) {
    try {
      await updateCartCount(skuId, count)
    } catch (err) {
      console.log('[cart] 改数量失败', err)
      this.fetchList()
    }
  },

  // 输入过程中不进 data：每敲一个字都 setData 会把光标顶到末尾
  onCountInput(e) {
    this.inputCount = e.detail.value
  },

  onCountBlur(e) {
    const skuId = e.currentTarget.dataset.skuId

    // 回车会先触发 confirm 再触发 blur，同一次编辑进两次：
    // 第一次已经置空重填，第二次读到空值会把输入框刷成空白
    if (this.blurKey === skuId) return
    this.blurKey = skuId
    setTimeout(() => {
      if (this.blurKey === skuId) this.blurKey = null
    }, 0)

    const item = this.findItem(skuId)
    if (!item) return

    // 非法输入（空串、字母）返回 null 退回原值，其余夹到 [1, limit]
    const parsed = clampCount(this.inputCount, item.limit)
    this.inputCount = undefined

    const count = parsed === null ? Number(item.count) || 1 : parsed

    // input 不是严格受控：data 里的值没变就不会重绘，输了 0 或空会一直显示错的值
    // 先置空再回填，强制它跟随 data
    this.setData({ list: this.patchItem(skuId, { count: '' }) }, () => {
      this.setData(this.withSummary(this.patchItem(skuId, { count })))
    })

    // 界面已经更新过，这里只补请求
    if (count !== item.count) this.scheduleCountSync(skuId, count)
  },

  onRemove(e) {
    const skuId = e.currentTarget.dataset.skuId

    wx.showModal({
      title: '提示',
      content: '确定要删除这个商品吗？',
      confirmColor: '#cf4444',
      success: (res) => {
        if (res.confirm) this.doRemove(skuId)
      }
    })
  },

  async doRemove(skuId) {
    try {
      await removeCartItems([skuId])
      this.fetchList()
    } catch (err) {
      console.log('[cart] 删除失败', err)
    }
  },

  onCheckout() {
    if (!this.data.totalCount) {
      wx.showToast({ title: '请先选择商品', icon: 'none' })
      return
    }

    // 结算必须登录：这是业务规则，不是技术限制
    if (!getToken()) {
      wx.navigateTo({
        url: '/packageGoods/pages/login/login?redirect=' + encodeURIComponent('/pages/cart/cart')
      })
      return
    }

    wx.navigateTo({ url: '/packageGoods/pages/order/confirm/confirm' })
  },

  onGoHome() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  onRetry() {
    this.fetchList()
  }
})
