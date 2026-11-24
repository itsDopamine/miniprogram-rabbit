import {
  getBannerList,
  getCategoryFloors,
  getGuessLike,
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
    guessLikes: [],
    guessPage: 1,
    guessHasMore: false,
    guessLoading: false,
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

  // 猜你喜欢触底加载下一页：接口带 page/pageSize，是真分页
  async loadMoreGuess() {
    const { guessLoading, guessHasMore, guessPage, loading } = this.data
    // 首屏或上一页还在请求时不再叠加
    if (loading || guessLoading || !guessHasMore) return

    this.setData({ guessLoading: true })
    try {
      const res = await getGuessLike({ page: guessPage + 1 })
      const items = res.items.map((item) => ({ ...item, picture: toHttps(item.picture) }))
      this.setData({
        guessLikes: this.data.guessLikes.concat(items),
        guessPage: res.page,
        guessHasMore: res.page < res.pages,
        guessLoading: false
      })
    } catch (e) {
      console.log('[guessLike]', e)
      this.setData({ guessLoading: false })
    }
  },

  async fetchHome() {
    // 重置分页状态，避免上一轮失败时卡住 guessLoading
    this.setData({ loading: true, error: '', guessLoading: false })

    try {
      // 六个接口互不依赖，并发拿
      const [banners, categories, newGoods, hotPanels, floors, guess] = await Promise.all([
        getBannerList(),
        getHomeCategories(),
        getNewGoods(),
        getHotPanels(),
        getCategoryFloors(),
        getGuessLike({ page: 1 })
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
        guessLikes: guess.items.map((item) => ({ ...item, picture: toHttps(item.picture) })),
        guessPage: guess.page,
        guessHasMore: guess.page < guess.pages,
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
