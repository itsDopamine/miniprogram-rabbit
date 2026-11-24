import { getToken } from '../../utils/auth'
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
    if (!item || item.count <= 1) return
    this.changeCount(item.skuId, item.count - 1)
  },

  onPlus(e) {
    const item = this.findItem(e.currentTarget.dataset.skuId)
    if (!item || item.count >= item.stock) return
    this.changeCount(item.skuId, item.count + 1)
  },

  async changeCount(skuId, count) {
    this.setData(this.withSummary(this.patchItem(skuId, { count })))

    try {
      await updateCartCount(skuId, count)
    } catch (err) {
      console.log('[cart] 改数量失败', err)
      this.fetchList()
    }
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

    // 结算依赖登录与订单页，分别在 S5 与 S7
    wx.showToast({
      title: getToken() ? '订单页在 S7 接入' : '登录后再结算',
      icon: 'none'
    })
  },

  onGoHome() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  onRetry() {
    this.fetchList()
  }
})
