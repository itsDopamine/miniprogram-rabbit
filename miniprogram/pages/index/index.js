import { getBannerList } from '../../api/home'

// 首页（S0 占位，S2 正式开发）
Page({
  data: {
    bannerCount: 0
  },

  onLoad() {
    this.fetchBanners()
  },

  async fetchBanners() {
    try {
      const list = await getBannerList()
      this.setData({ bannerCount: list.length })
    } catch (e) {
      console.log('[banner]', e)
    }
  },

  onSmokeTest() {
    wx.showToast({ title: 'TDesign 可用', icon: 'success' })
  }
})