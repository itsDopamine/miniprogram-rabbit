import { getOrderDetail } from '../../../../api/order'
import { getWxPayParams, mockPay } from '../../../../api/pay'

Page({
  data: {
    order: null,
    countdownText: '',
    // countdown 为 -1 表示付款已超时（实测待付款订单会出现），不是「还剩 1 秒」
    expired: true,
    paying: false,
    // 取不到微信支付参数时切成模拟支付，由用户自己决定，不静默把订单改成已支付
    mockMode: false,
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

  /**
   * 支付分两条路：
   * 1. 先试真实微信支付：拿参数 → wx.requestPayment
   * 2. 拿不到参数（openid 缺失 / appid 未授权）就切成模拟支付，由用户再点一次
   * 不自动降级：mock 会把订单直接标成已支付，不能让它在用户不知情时发生
   */
  async onPay() {
    if (this.data.paying || this.data.expired) return

    this.setData({ paying: true })

    if (this.data.mockMode) {
      this.doMockPay()
      return
    }

    try {
      const params = await getWxPayParams(this.orderId)

      wx.requestPayment({
        ...params,
        success: () => this.afterPaid(),
        fail: (err) => {
          this.setData({ paying: false })

          // 用户主动取消不算失败
          if ((err.errMsg || '').indexOf('cancel') >= 0) {
            wx.showToast({ title: '已取消支付', icon: 'none' })
            return
          }

          console.log('[order-pay] requestPayment 失败', err)
          this.fallbackToMock('支付未完成，可改用模拟支付')
        }
      })
    } catch (err) {
      console.log('[order-pay] 取支付参数失败', err)
      this.fallbackToMock('当前环境无法使用微信支付，可改用模拟支付')
    }
  },

  doMockPay() {
    mockPay(this.orderId)
      .then(() => this.afterPaid())
      .catch((err) => {
        console.log('[order-pay] 模拟支付失败', err)
        this.setData({ paying: false })
      })
  },

  afterPaid() {
    this.setData({ paying: false })
    wx.showToast({ title: '支付成功', icon: 'success' })
    setTimeout(() => {
      wx.redirectTo({ url: `/packageGoods/pages/order/detail/detail?id=${this.orderId}` })
    }, 600)
  },

  fallbackToMock(msg) {
    this.setData({ paying: false, mockMode: true })
    wx.showToast({ title: msg, icon: 'none' })
  },

  onRetry() {
    this.fetchOrder()
  }
})
