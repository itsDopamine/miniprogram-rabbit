// pages/home/index.js
// S0 目标：验证「页面 -> request -> 接口 -> setData -> 视图」这条链路
const { get } = require('../../utils/request')
const { normalizeImageUrl } = require('../../utils/format')

Page({
  data: {
    loading: true,
    error: '',
    banners: [],
  },

  onLoad() {
    this.loadBanners()
  },

  onPullDownRefresh() {
    this.loadBanners().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadBanners() {
    this.setData({ loading: true, error: '' })

    try {
      const { result } = await get('/home/banner', { distributionSite: 1 })
      // 接口图片是 http，真机要求 https，统一在取数后归一
      const banners = (Array.isArray(result) ? result : []).map((item) =>
        Object.assign({}, item, { imgUrl: normalizeImageUrl(item.imgUrl) })
      )

      this.setData({ banners, loading: false })
      // 学习用：在控制台确认返回结构与字段名
      console.log('[S0] GET /home/banner result:', result)
    } catch (err) {
      this.setData({
        error: err.message || '加载失败',
        loading: false,
      })
    }
  },

  retry() {
    this.loadBanners()
  },

  goCategory() {
    wx.switchTab({ url: '/pages/category/index' })
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/index' })
  },
})
