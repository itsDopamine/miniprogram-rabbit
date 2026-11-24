import { cancelOrder, confirmReceipt, deleteOrders, getOrderDetail } from '../../../api/order'
import { toHttps } from '../../../utils/common'

const STATE_TEXT = {
  1: '待付款',
  2: '待发货',
  3: '待收货',
  4: '待评价',
  5: '已完成',
  6: '已取消'
}

Page({
  data: {
    order: null,
    loading: true,
    error: ''
  },

  onLoad(options) {
    this.id = options.id || ''
    this.fetchDetail()
  },

  async fetchDetail() {
    this.setData({ loading: true, error: '' })

    try {
      const order = await getOrderDetail(this.id)

      this.setData({
        order: {
          ...order,
          stateText: STATE_TEXT[order.orderState] || '',
          payMoneyText: (Number(order.payMoney) || 0).toFixed(2),
          totalMoneyText: (Number(order.totalMoney) || 0).toFixed(2),
          postFeeText: (Number(order.postFee) || 0).toFixed(2),
          skus: (order.skus || []).map((sku) => ({
            ...sku,
            image: toHttps(sku.image),
            priceText: (Number(sku.curPrice) || 0).toFixed(2)
          }))
        },
        loading: false
      })
    } catch (err) {
      console.log('[order-detail]', err)
      this.setData({ loading: false, error: '加载失败，请稍后重试' })
    }
  },

  onPay() {
    wx.navigateTo({ url: `/pages/order/pay/pay?orderId=${this.id}` })
  },

  onCancel() {
    wx.showModal({
      title: '取消订单',
      editable: true,
      placeholderText: '请填写取消原因',
      confirmColor: '#cf4444',
      success: async (res) => {
        if (!res.confirm) return

        try {
          await cancelOrder(this.id, res.content || '用户取消')
          this.fetchDetail()
        } catch (err) {
          console.log('[order-detail] 取消失败', err)
        }
      }
    })
  },

  onConfirmReceipt() {
    wx.showModal({
      title: '提示',
      content: '确认已经收到货了吗？',
      confirmColor: '#cf4444',
      success: async (res) => {
        if (!res.confirm) return

        try {
          await confirmReceipt(this.id)
          this.fetchDetail()
        } catch (err) {
          console.log('[order-detail] 确认收货失败', err)
        }
      }
    })
  },

  onDelete() {
    wx.showModal({
      title: '提示',
      content: '删除后无法恢复，确定删除吗？',
      confirmColor: '#cf4444',
      success: async (res) => {
        if (!res.confirm) return

        try {
          await deleteOrders([this.id])
          // 列表页 onShow 会重拉，这里直接退回去
          wx.navigateBack()
        } catch (err) {
          console.log('[order-detail] 删除失败', err)
        }
      }
    })
  },

  onRetry() {
    this.fetchDetail()
  }
})
