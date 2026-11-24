import { getGoodsDetail } from '../../../api/goods'
import { toHttps } from '../../../utils/common'

Page({
  data: {
    id: '',
    mainPictures: [],
    name: '',
    price: '',
    oldPrice: '',
    desc: '',
    properties: [],
    detailPictures: [],
    loading: true,
    error: ''
  },

  onLoad(options) {
    // URL 参数恒为字符串且可能缺失，先判空，否则会请求 /goods?id=undefined
    const id = options.id
    if (!id) {
      this.setData({ loading: false, error: '商品不存在' })
      return
    }

    this.setData({ id })
    this.fetchDetail()
  },

  async fetchDetail() {
    this.setData({ loading: true, error: '' })

    try {
      const goods = await getGoodsDetail(this.data.id)
      const details = goods.details || {}

      this.setData({
        mainPictures: (goods.mainPictures || []).map(toHttps),
        name: goods.name,
        price: goods.price,
        oldPrice: goods.oldPrice,
        desc: goods.desc,
        properties: details.properties || [],
        detailPictures: (details.pictures || []).map(toHttps),
        loading: false
      })
    } catch (e) {
      console.log('[goods-detail]', e)
      this.setData({ loading: false, error: '加载失败，请稍后重试' })
    }
  },

  // current 必须取自 urls 本身，另拼一个地址 iOS 真机会预览失败
  onPreviewMain(e) {
    this.preview(this.data.mainPictures, e.currentTarget.dataset.index)
  },

  onPreviewDetail(e) {
    this.preview(this.data.detailPictures, e.currentTarget.dataset.index)
  },

  preview(urls, index) {
    if (!urls || !urls.length) return
    wx.previewImage({ current: urls[index], urls })
  },

  onRetry() {
    this.fetchDetail()
  }
})
