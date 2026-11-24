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
    error: '',

    /* ---------- SKU 面板 ---------- */
    skuVisible: false,
    specs: [],
    // 下标与 specs 一一对应，'' 表示这一组还没选
    selected: [],
    selectedText: '',
    // 面板头部的图与价，先给 SPU 的默认值，Step 3 选全规格后换成 sku 的
    skuPicture: '',
    skuPrice: ''
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
      const mainPictures = (goods.mainPictures || []).map(toHttps)
      const specs = goods.specs || []

      this.setData({
        mainPictures,
        name: goods.name,
        price: goods.price,
        oldPrice: goods.oldPrice,
        desc: goods.desc,
        properties: details.properties || [],
        detailPictures: (details.pictures || []).map(toHttps),

        specs,
        selected: specs.map(() => ''),
        selectedText: '',
        skuPicture: mainPictures[0] || '',
        skuPrice: goods.price,

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

  onCloseSku() {
    this.setData({ skuVisible: false })
  },

  // 挂给遮罩的 catchtouchmove：吃掉手势，页面就不会跟着滚
  noop() {},

  onTapSpec(e) {
    const { specIndex, valueName } = e.currentTarget.dataset
    const index = Number(specIndex)

    // 先 slice：直接改 this.data.selected 属于原地修改，不触发渲染
    const selected = this.data.selected.slice()
    // 再点一次已选中的值就是取消，和主流电商一致
    selected[index] = selected[index] === valueName ? '' : valueName

    this.setData({ selected, selectedText: this.buildSelectedText(selected) })
  },

  // 用 specs 的顺序拼文案，所以 selected 必须是数组而不是对象
  buildSelectedText(selected) {
    return this.data.specs
      .map((spec, i) => (selected[i] ? `${spec.name}：${selected[i]}` : ''))
      .filter(Boolean)
      .join(' ')
  },

  onConfirmSku() {
    if (this.data.selected.some((v) => !v)) {
      wx.showToast({ title: '请选择完整规格', icon: 'none' })
      return
    }

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
