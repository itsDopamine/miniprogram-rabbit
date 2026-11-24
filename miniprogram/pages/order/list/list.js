import { cancelOrder, confirmReceipt, deleteOrders, getOrderList } from '../../../api/order'
import { toHttps } from '../../../utils/common'

// orderState 0 表示全部，其余与接口枚举一致
const TABS = [
  { value: 0, label: '全部' },
  { value: 1, label: '待付款' },
  { value: 2, label: '待发货' },
  { value: 3, label: '待收货' },
  { value: 4, label: '待评价' },
  { value: 5, label: '已完成' },
  { value: 6, label: '已取消' }
]

const STATE_TEXT = {
  1: '待付款',
  2: '待发货',
  3: '待收货',
  4: '待评价',
  5: '已完成',
  6: '已取消'
}

const PAGE_SIZE = 10

Page({
  data: {
    tabs: TABS,
    tabIndex: 0,
    list: [],
    page: 1,
    hasMore: false,
    loading: true,
    loadingMore: false,
    error: ''
  },

  // 从支付页 / 详情页返回都要刷新，onLoad 只跑一次
  onShow() {
    this.reload()
  },

  onReachBottom() {
    this.loadMore()
  },

  async reload() {
    this.setData({ loading: true, error: '', page: 1, hasMore: false })

    try {
      const res = await getOrderList({
        page: 1,
        pageSize: PAGE_SIZE,
        orderState: TABS[this.data.tabIndex].value
      })
      const pages = Number(res.pages) || 0

      this.setData({
        list: this.decorate(res.items),
        page: 1,
        hasMore: pages > 1,
        loading: false
      })
    } catch (err) {
      console.log('[order-list]', err)
      this.setData({ loading: false, error: '加载失败，请稍后重试' })
    }
  },

  async loadMore() {
    if (this.data.loading || this.data.loadingMore || !this.data.hasMore) return

    const next = this.data.page + 1
    this.setData({ loadingMore: true })

    try {
      const res = await getOrderList({
        page: next,
        pageSize: PAGE_SIZE,
        orderState: TABS[this.data.tabIndex].value
      })

      this.setData({
        list: this.data.list.concat(this.decorate(res.items)),
        page: next,
        hasMore: next < (Number(res.pages) || 0),
        loadingMore: false
      })
    } catch (err) {
      console.log('[order-list] 加载更多失败', err)
      this.setData({ loadingMore: false })
    }
  },

  decorate(items) {
    return (items || []).map((item) => ({
      ...item,
      stateText: STATE_TEXT[item.orderState] || '',
      payMoneyText: (Number(item.payMoney) || 0).toFixed(2),
      skus: (item.skus || []).map((sku) => ({ ...sku, image: toHttps(sku.image) }))
    }))
  },

  // 切 tab 必须回到第 1 页并清空列表，否则新旧数据会串在一起
  onTapTab(e) {
    const tabIndex = Number(e.currentTarget.dataset.index)
    if (tabIndex === this.data.tabIndex) return

    this.setData({ tabIndex, list: [] })
    this.reload()
  },

  // 按钮区用 catchtap 挂它，避免点按钮时同时触发整卡的跳转
  noop() {},

  onTapOrder(e) {
    wx.navigateTo({ url: `/pages/order/detail/detail?id=${e.currentTarget.dataset.id}` })
  },

  onPay(e) {
    wx.navigateTo({ url: `/pages/order/pay/pay?orderId=${e.currentTarget.dataset.id}` })
  },

  onCancel(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '取消订单',
      editable: true,
      placeholderText: '请填写取消原因',
      confirmColor: '#cf4444',
      success: async (res) => {
        if (!res.confirm) return

        try {
          await cancelOrder(id, res.content || '用户取消')
          this.reload()
        } catch (err) {
          console.log('[order-list] 取消失败', err)
        }
      }
    })
  },

  onConfirmReceipt(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '提示',
      content: '确认已经收到货了吗？',
      confirmColor: '#cf4444',
      success: async (res) => {
        if (!res.confirm) return

        try {
          await confirmReceipt(id)
          this.reload()
        } catch (err) {
          console.log('[order-list] 确认收货失败', err)
        }
      }
    })
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '提示',
      content: '删除后无法恢复，确定删除吗？',
      confirmColor: '#cf4444',
      success: async (res) => {
        if (!res.confirm) return

        try {
          await deleteOrders([id])
          this.reload()
        } catch (err) {
          console.log('[order-list] 删除失败', err)
        }
      }
    })
  },

  onRetry() {
    this.reload()
  }
})
