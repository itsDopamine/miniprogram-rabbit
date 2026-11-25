import { getGoodsDetail } from '../../../../api/goods'
import { addGoodsToCart } from '../../../../utils/cart'
import { isCollected, toggleCollect } from '../../../../utils/collect'
import { toHttps } from '../../../../utils/common'

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
    // 收藏是本地降级实现，进页面时按 Storage 里的记录回填
    collected: false,
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
        collected: isCollected(goods.id || this.data.id),
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

  async onSkuConfirm(e) {
    const { skuId, count, price, picture, attrsText, stock } = e.detail

    // 请求层已有 loading 遮罩，这里再挡一次极短时间内的连点
    if (this.adding) return
    this.adding = true

    try {
      const from = await addGoodsToCart({
        id: this.data.id,
        name: this.data.name,
        picture: picture || this.data.mainPictures[0] || '',
        price,
        count,
        skuId,
        attrsText,
        // 本地购物车要靠它限制数量上限
        stock
      })

      this.setData({ skuVisible: false })

      // 加购成功才清空面板：下次打开不该还留着上次选的规格和数量
      const panel = this.selectComponent('#skuPanel')
      if (panel) panel.reset()

      if (from === 'capped') {
        wx.showToast({ title: '数量已达库存上限', icon: 'none' })
      } else if (from === 'local') {
        wx.showToast({ title: '已加入购物车，登录后同步', icon: 'none' })
      } else {
        wx.showToast({ title: '已加入购物车', icon: 'success' })
      }
    } catch (err) {
      // 已登录时 401 与业务错误由 request.js 统一 toast，面板保持打开让用户重试
      console.log('[cart-add]', err)
    } finally {
      this.adding = false
    }
  },

  /* ---------- 底部操作栏 ---------- */

  onTapService() {
    // 客服需要在后台配置，等 S5 之后再接
    wx.showToast({ title: '客服待接入', icon: 'none' })
  },

  onTapCart() {
    wx.switchTab({ url: '/pages/cart/cart' })
  },

  // 收藏存本地：接口文档没有收藏分组，只记商品快照
  onTapCollect() {
    const collected = toggleCollect({
      id: this.data.id,
      name: this.data.name,
      picture: this.data.mainPictures[0] || '',
      price: Number(this.data.price) || 0
    })

    this.setData({ collected })
    wx.showToast({ title: collected ? '已收藏' : '已取消收藏', icon: 'none' })
  },

  onRetry() {
    this.fetchDetail()
  }
})