// pages/cart/index.js
// S4 实现：游客本地车 / 登录服务端车 / 合并 / 勾选 / 数量 / 角标
Page({
  data: {
    stage: 'S4',
  },

  goHome() {
    wx.switchTab({ url: '/pages/home/index' })
  },
})
