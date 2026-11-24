import { getBannerList } from '../../api/home'
import { toHttps } from '../../utils/common'

Page({
  data: {
    banners: []
  },

  onLoad() {
    this.fetchBanners()
  },

  async fetchBanners() {
    try {
      const list = await getBannerList()
      // 接口返回 http 直链，转成新数组，避免直接改接口返回对象
      const banners = list.map((item) => ({ ...item, imgUrl: toHttps(item.imgUrl) }))
      this.setData({ banners })
    } catch (e) {
      console.log('[banner]', e)
    }
  }
})
