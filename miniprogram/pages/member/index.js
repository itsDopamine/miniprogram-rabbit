// pages/member/index.js
// S6 实现：会员中心、个人资料、订单入口、地址入口
const { get } = require('../../utils/request')
const { isLoggedIn } = require('../../utils/auth')

Page({
  data: {
    stage: 'S6',
    loggedIn: false,
  },

  onShow() {
    // 登录态可能在其他页面变化，tabBar 页每次显示都重新判断
    this.setData({ loggedIn: isLoggedIn() })
  },

  goLogin() {
    wx.navigateTo({
      url: `/pages/login/index?redirect=${encodeURIComponent('/pages/member/index')}`,
    })
  },

  // S0 自检：未登录访问受保护接口 -> 应只跳一次登录页
  test401() {
    get('/member/cart', {}, { silent: true }).catch((err) => {
      console.log('[S0] 受保护接口 401 验证:', err.message)
    })
  },

  goHome() {
    wx.switchTab({ url: '/pages/home/index' })
  },
})
