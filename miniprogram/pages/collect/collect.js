import { readCollect, removeCollect } from '../../utils/collect'

Page({
  data: {
    list: []
  },

  // 收藏存在本机，详情页取消后返回要能看到变化，所以每次显示都重读
  onShow() {
    this.setData({
      list: readCollect().map((item) => ({
        ...item,
        priceText: (Number(item.price) || 0).toFixed(2)
      }))
    })
  },

  onTapGoods(e) {
    wx.navigateTo({ url: `/pages/goods/detail/detail?id=${e.currentTarget.dataset.id}` })
  },

  onRemove(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '提示',
      content: '要取消收藏这个商品吗？',
      confirmColor: '#cf4444',
      success: (res) => {
        if (!res.confirm) return
        removeCollect([id])
        this.onShow()
      }
    })
  },

  onGoHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
