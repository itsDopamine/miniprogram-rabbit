import { getOrderLogistics, mockConsignment } from '../../../api/order'
import { toHttps } from '../../../../utils/common'

// 待发货没有物流，页面只展示「模拟发货」入口
const STATE_UNSHIPPED = 2

Page({
  data: {
    state: 0,
    info: null,
    shipping: false,
    loading: true,
    error: ''
  },

  onLoad(options) {
    this.orderId = options.id || ''
    this.setData({ state: Number(options.state) || 0 })

    if (this.data.state === STATE_UNSHIPPED) {
      this.setData({ loading: false })
      return
    }

    this.fetchLogistics()
  },

  async fetchLogistics() {
    this.setData({ loading: true, error: '' })

    try {
      const info = await getOrderLogistics(this.orderId)

      this.setData({
        info: {
          ...info,
          picture: toHttps(info.picture),
          companyName: (info.company && info.company.name) || '',
          // 时间线按接口顺序渲染，前端不再排序：服务端已是倒序
          list: info.list || []
        },
        loading: false
      })
    } catch (err) {
      console.log('[logistics]', err)
      this.setData({ loading: false, error: '暂无物流信息' })
    }
  },

  /**
   * 模拟发货（DEV）：待发货 -> 待收货
   * 真机上没有这个接口，真实项目要等商家后台发货
   */
  onMockConsignment() {
    if (this.data.shipping) return
    this.setData({ shipping: true })

    mockConsignment(this.orderId)
      .then(() => {
        wx.showToast({ title: '已模拟发货', icon: 'success' })
        this.setData({ state: 3, shipping: false })
        this.fetchLogistics()
      })
      .catch((err) => {
        console.log('[logistics] 模拟发货失败', err)
        this.setData({ shipping: false })
      })
  },

  onRetry() {
    this.fetchLogistics()
  }
})
