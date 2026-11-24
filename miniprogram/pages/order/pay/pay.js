import { getOrderDetail } from '../../../api/order'
import { mockPay } from '../../../api/pay'

Page({
  data: {
    order: null,
    countdownText: '',
    // countdown 为 -1 表示付款已超时（实测待付款订单会出现），不是「还剩 1 秒」
    expired: true,
    paying: false,
    loading: true,
    error: ''
  },

  onLoad(options) {
    this.orderId = options.orderId || ''
    this.fetchOrder()
  },

  // 定时器必须在离开页面时清掉，否则会在已卸载页面上 setData
  onHide() {
    this.clearTimer()
  },

  onUnload() {
    this.clearTimer()
  },

  async fetchOrder() {
    this.setData({ loading: true, error: '' })

    try {
      const order = await getOrderDetail(this.orderId)
      const left = Number(order.countdown)

      this.setData({
        order: { ...order, payMoneyText: (Number(order.payMoney) || 0).toFixed(2) },
        loading: false
      })

      if (left > 0) {
        this.startTimer(left)
      } else {
        this.setData({ expired: true, countdownText: '已超时' })
      }
    } catch (err) {
      console.log('[order-pay]', err)
      this.setData({ loading: false, error: '加载失败，请稍后重试' })
    }
  },

  startTimer(left) {
    this.clearTimer()
    let remain = left

    const render = () => {
      const minute = Math.floor(remain / 60)
      const second = remain % 60
      this.setData({
        expired: false,
        countdownText: `${minute}:${second < 10 ? '0' + second : second}`
      })
    }

    render()

    this.timer = setInterval(() => {
      remain -= 1

      if (remain <= 0) {
        this.clearTimer()
        this.setData({ expired: true, countdownText: '已超时' })
        return
      }

      render()
    }, 1000)
  },

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },

  async onPay() {
    if (this.data.paying || this.data.expired) return

    this.setData({ paying: true })

    try {
      // 真实支付要 appid 在白名单里，本项目只能模拟；调用后订单直接置为待发货
      await mockPay(this.orderId)

      wx.showToast({ title: '支付成功', icon: 'success' })
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/order/detail/detail?id=${this.orderId}` })
      }, 600)
    } catch (err) {
      console.log('[order-pay] 支付失败', err)
      this.setData({ paying: false })
    }
  },

  onRetry() {
    this.fetchOrder()
  }
})
