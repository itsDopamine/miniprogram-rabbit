import { getCategoryTop } from '../../api/category'
import { toHttps } from '../../utils/common'

Page({
  data: {
    categories: [],
    activeIndex: 0,
    loading: true,
    error: ''
  },

  onLoad() {
    this.fetchCategories()
  },

  async fetchCategories() {
    this.setData({ loading: true, error: '' })

    try {
      const list = await getCategoryTop()

      // 接口给的是 http 直链，三层都要转，且不直接改原对象
      const categories = list.map((cat) => ({
        ...cat,
        picture: toHttps(cat.picture),
        children: cat.children.map((child) => ({
          ...child,
          picture: toHttps(child.picture),
          goods: child.goods.map((goods) => ({ ...goods, picture: toHttps(goods.picture) }))
        }))
      }))

      this.setData({ categories, loading: false })
    } catch (e) {
      console.log('[category]', e)
      this.setData({ loading: false, error: '加载失败，请稍后重试' })
    }
  },

  onRetry() {
    this.fetchCategories()
  },

  onTapGoods(e) {
    // 详情页在 S4 才建
    wx.showToast({ title: `商品 ${e.detail.id}`, icon: 'none' })
  }
})
