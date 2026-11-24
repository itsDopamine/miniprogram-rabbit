import { getCategoryTop } from '../../../api/category'
import { toHttps } from '../../../utils/common'

Page({
  data: {
    parentName: '',
    children: [],
    activeId: '',
    goods: [],
    loading: true,
    error: ''
  },

  onLoad(options) {
    // 入参只用来定位：二级分类 id
    this.subId = options.id || ''
    this.setData({ activeId: this.subId })
    this.fetchCategories()
  },

  async fetchCategories() {
    this.setData({ loading: true, error: '' })

    try {
      const categories = await getCategoryTop()

      // 用二级 id 反查所属一级：跳转入口只保证给的是分类 id
      const parent =
        (categories || []).find((cat) =>
          (cat.children || []).some((sub) => sub.id === this.subId)
        ) || (categories || [])[0]

      if (!parent) {
        this.setData({ loading: false, error: '没有找到该分类' })
        return
      }

      const children = parent.children || []
      const activeId = this.subId || (children[0] && children[0].id) || ''

      this.setData({
        parentName: parent.name,
        children,
        activeId,
        goods: this.normalizeGoods(children.find((sub) => sub.id === activeId)),
        loading: false
      })
    } catch (err) {
      console.log('[sub-category]', err)
      this.setData({ loading: false, error: '加载失败，请稍后重试' })
    }
  },

  normalizeGoods(child) {
    return ((child && child.goods) || []).map((goods) => ({
      ...goods,
      picture: toHttps(goods.picture)
    }))
  },

  // 同级切换不再请求接口：/category/top 一次就带回了所有二级分类的商品
  onTapSub(e) {
    const id = e.currentTarget.dataset.id
    if (id === this.data.activeId) return

    this.setData({
      activeId: id,
      goods: this.normalizeGoods(this.data.children.find((sub) => sub.id === id))
    })
  },

  onTapGoods(e) {
    wx.navigateTo({ url: `/pages/goods/detail/detail?id=${e.detail.id}` })
  },

  onRetry() {
    this.fetchCategories()
  }
})
