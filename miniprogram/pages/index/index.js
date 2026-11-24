import request from "../../utils/request"

// 首页（S0 占位，S2 正式开发）
Page({
  data: {
    ready: true
  },

  async onLoad(options) {
    // S2：请求首页数据
    const res = await request({ url: '/home/banner', data: { distributionSite: 1 } })

    console.log('res', res)
  },

  onSmokeTest() {
    wx.showToast({ title: 'TDesign 可用', icon: 'success' })
  }
})