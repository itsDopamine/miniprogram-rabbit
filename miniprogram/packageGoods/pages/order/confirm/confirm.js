import { getPreOrder, getPreOrderNow, getRepurchaseOrder, submitOrder } from '../../../api/order'
import { toHttps } from '../../../../utils/common'

// 与接口枚举一一对应：deliveryTimeType 1/2/3，payType 1/2
const DELIVERY_OPTIONS = [
  { value: 1, label: '不限' },
  { value: 2, label: '工作日' },
  { value: 3, label: '双休或假日' }
]

const PAY_OPTIONS = [
  { value: 1, label: '在线支付' },
  { value: 2, label: '货到付款' }
]

Page({
  data: {
    from: 'cart',
    address: null,
    goods: [],
    summary: null,
    deliveryOptions: DELIVERY_OPTIONS,
    deliveryTimeType: 1,
    payOptions: PAY_OPTIONS,
    payType: 1,
    buyerMessage: '',
    loading: true,
    error: '',
    submitting: false
  },

  onLoad(options) {
    // 三个入口：购物车结算 / 立即购买（skuId+count）/ 再次购买（orderId）
    this.skuId = options.skuId || ''
    this.count = Number(options.count) || 1
    this.orderId = options.orderId || ''

    const from = options.from === 'now' || options.from === 'repurchase' ? options.from : 'cart'
    this.setData({ from })
    this.fetchData()
  },

  async fetchData() {
    this.setData({ loading: true, error: '' })

    try {
      const data = await this.loadPreOrder()

      const goods = (data.goods || []).map((item) => ({
        ...item,
        picture: toHttps(item.picture),
        payPriceText: (Number(item.payPrice) || 0).toFixed(2)
      }))

      if (!goods.length) {
        this.setData({ loading: false, error: '没有可结算的商品' })
        return
      }

      const addresses = data.userAddresses || []

      this.setData({
        // 接口不保证默认地址在最前，自己挑
        address: addresses.find((a) => a.isDefault === 1) || addresses[0] || null,
        goods,
        summary: this.normalizeSummary(data.summary),
        loading: false
      })
    } catch (err) {
      console.log('[order-confirm]', err)
      this.setData({ loading: false, error: '加载失败，请稍后重试' })
    }
  },

  /**
   * 三个入口的数据来源不同，返回结构一致（userAddresses / goods / summary）
   * 所以后续渲染与提交逻辑完全共用
   */
  loadPreOrder() {
    if (this.data.from === 'now') {
      return getPreOrderNow({ skuId: this.skuId, count: this.count })
    }

    if (this.data.from === 'repurchase') {
      return getRepurchaseOrder(this.orderId)
    }

    return getPreOrder()
  },

  // 金额全部按接口给的值格式化：前端再算一遍就会和服务端对不上
  normalizeSummary(summary) {
    const s = summary || {}

    return {
      goodsCount: s.goodsCount || 0,
      totalPrice: (Number(s.totalPrice) || 0).toFixed(2),
      postFee: (Number(s.postFee) || 0).toFixed(2),
      discountPrice: (Number(s.discountPrice) || 0).toFixed(2),
      totalPayPrice: (Number(s.totalPayPrice) || 0).toFixed(2)
    }
  },

  /* ---------- 地址 ---------- */

  onChooseAddress() {
    wx.navigateTo({
      url: '/packageGoods/pages/address/list/list?select=1',
      events: {
        // eventChannel：通道随页面实例存在，不会把这次选择留到下一次结算
        select: (address) => this.setData({ address })
      }
    })
  },

  /* ---------- 选项 ---------- */

  onSelectDelivery(e) {
    this.setData({ deliveryTimeType: Number(e.currentTarget.dataset.value) })
  },

  onSelectPay(e) {
    this.setData({ payType: Number(e.currentTarget.dataset.value) })
  },

  // 留言不会被程序改写，不必进 data 触发重渲染
  onMessageInput(e) {
    this.buyerMessage = e.detail.value
  },

  /* ---------- 提交 ---------- */

  async onSubmit() {
    // 提交锁：接口返回前连点会生成两笔订单
    if (this.data.submitting) return

    const { address, goods, deliveryTimeType, payType } = this.data

    if (!address) {
      wx.showToast({ title: '请选择收货地址', icon: 'none' })
      return
    }

    const payload = {
      goods: goods.map((item) => ({ skuId: item.skuId, count: item.count })),
      addressId: address.id,
      deliveryTimeType,
      payType,
      buyerMessage: this.buyerMessage || ''
    }

    // 货到付款不传 payChannel，在线支付固定走微信（2）
    if (payType === 1) payload.payChannel = 2

    this.setData({ submitting: true })

    try {
      const order = await submitOrder(payload)

      // redirectTo：结算页留在栈里的话，用户从支付页返回会再提交一次
      wx.redirectTo({ url: `/packageGoods/pages/order/pay/pay?orderId=${order.id}` })
    } catch (err) {
      console.log('[order-confirm] 提交失败', err)
      this.setData({ submitting: false })
    }
  },

  onRetry() {
    this.fetchData()
  }
})
