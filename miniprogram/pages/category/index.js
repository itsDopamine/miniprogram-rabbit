// pages/category/index.js
// S2 实现：一级分类 + 二级列表。S0 只保留页面骨架，验证 tabBar 切换
Page({
  data: {
    stage: 'S2',
  },

  goHome() {
    wx.switchTab({ url: '/pages/home/index' })
  },
})
