import {
  getBannerList,
  getCategoryFloors,
  getHomeCategories,
  getHotPanels,
  getNewGoods
} from '../../api/home'
import { toHttps } from '../../utils/common'

Page({
  data: {
    banners: [],
    categories: [],
    newGoods: [],
    hotPanels: [],
    floors: [],
    loading: true,
    refreshing: false,
    error: ''
  },

  onLoad() {
    this.fetchHome()
  },

  // scroll-view 的下拉刷新：自己控制 refresher-triggered 的复位
  async onRefresh() {
    this.setData({ refreshing: true })
    await this.fetchHome()
    this.setData({ refreshing: false })
  },

  async fetchHome() {
    this.setData({ loading: true, error: '' })

    try {
      // 五个接口互不依赖，并发拿
      const [banners, categories, newGoods, hotPanels, floors] = await Promise.all([
        getBannerList(),
        getHomeCategories(),
        getNewGoods(),
        getHotPanels(),
        getCategoryFloors()
      ])

      // 接口返回 http 直链，map 出新对象，避免直接改接口返回的数据
      this.setData({
        banners: banners.map((item) => ({ ...item, imgUrl: toHttps(item.imgUrl) })),
        categories: categories.map((item) => ({ ...item, icon: toHttps(item.icon) })),
        newGoods: newGoods.map((item) => ({ ...item, picture: toHttps(item.picture) })),
        hotPanels: hotPanels.map((item) => ({ ...item, pictures: item.pictures.map(toHttps) })),
        floors: floors.map((floor) => ({
          ...floor,
          picture: toHttps(floor.picture),
          goods: floor.goods.map((goods) => ({ ...goods, picture: toHttps(goods.picture) }))
        })),
        loading: false
      })
    } catch (e) {
      console.log('[home]', e)
      this.setData({ loading: false, error: '加载失败，请检查网络后重试' })
    }
  },

  onRetry() {
    this.fetchHome()
  },

  onTapGoods(e) {
    // 详情页在 S4 才建，这里先给出可验证的反馈
    wx.showToast({ title: `商品 ${e.detail.id}`, icon: 'none' })
  }
})
