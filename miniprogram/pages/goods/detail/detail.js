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
    // 原样交给 sku-panel，页面自己不做规格计算
    specs: [],
    skus: [],
    skuVisible: false,
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
        specs: goods.specs || [],
        skus: goods.skus || [],
        loading: false
      })
    } catch (e) {
      console.log('[goods-detail]', e)
      this.setData({ loading: false, error: '加载失败，请稍后重试' })
    }
  },

  /* ---------- 图片预览 ---------- */

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

  /* ---------- SKU 面板 ---------- */

  onOpenSku() {
    this.setData({ skuVisible: true })
  },

  // 面板自己不记开合状态，关不关由页面说了算
  onSkuVisibleChange(e) {
    this.setData({ skuVisible: e.detail.visible })
  },

  onSkuConfirm(e) {
    // Step 4 在这里换成 POST /member/cart，e.detail 里有 skuId 与 count
    console.log('[sku-confirm]', e.detail)
    wx.showToast({ title: '加购在 Step 4 接入', icon: 'none' })
  },

  /* ---------- 底部操作栏 ---------- */

  onTapService() {
    // 客服需要在后台配置，等 S5 之后再接
    wx.showToast({ title: '客服待接入', icon: 'none' })
  },

  onTapCart() {
    wx.switchTab({ url: '/pages/cart/cart' })
  },

  onRetry() {
    this.fetchDetail()
  }
})
