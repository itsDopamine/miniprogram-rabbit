import { getBannerList, getHomeCategories, getHotPanels, getNewGoods } from '../../api/home'
import { toHttps } from '../../utils/common'

Page({
  data: {
    banners: [],
    categories: [],
    newGoods: [],
    hotPanels: []
  },

  onLoad() {
    this.fetchHome()
  },

  async fetchHome() {
    try {
      // 四个接口互不依赖，并发拿；任一失败统一进 catch
      const [banners, categories, newGoods, hotPanels] = await Promise.all([
        getBannerList(),
        getHomeCategories(),
        getNewGoods(),
        getHotPanels()
      ])

      this.setData({
        // 接口返回 http 直链，map 出新对象，避免直接改接口返回的数据
        banners: banners.map((item) => ({ ...item, imgUrl: toHttps(item.imgUrl) })),
        categories: categories.map((item) => ({ ...item, icon: toHttps(item.icon) })),
        newGoods: newGoods.map((item) => ({ ...item, picture: toHttps(item.picture) })),
        hotPanels: hotPanels.map((item) => ({ ...item, pictures: item.pictures.map(toHttps) }))
      })
    } catch (e) {
      console.log('[home]', e)
    }
  }
})
