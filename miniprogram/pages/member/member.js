import { getProfile } from '../../api/member'
import { clearAuth, getToken } from '../../utils/auth'
import { toHttps } from '../../utils/common'

Page({
  data: {
    logged: false,
    profile: null
  },

  // tabBar 页常驻，登录态可能在别的页面变过，每次显示都重新对齐
  onShow() {
    if (!getToken()) {
      this.setData({ logged: false, profile: null })
      return
    }

    this.fetchProfile()
  },

  async fetchProfile() {
    try {
      const profile = await getProfile()
      // 接口头像是 http 直链，真机不显示
      this.setData({ logged: true, profile: { ...profile, avatar: toHttps(profile.avatar) } })
    } catch (err) {
      // 401 已由 request.js 清 token 并跳登录，这里只回未登录态
      console.log('[member]', err)
      this.setData({ logged: false, profile: null })
    }
  },

  onLogin() {
    const redirect = encodeURIComponent('/pages/member/member')
    wx.navigateTo({ url: `/packageGoods/pages/login/login?redirect=${redirect}` })
  },

  onEditProfile() {
    if (!this.data.logged) {
      this.onLogin()
      return
    }
    wx.navigateTo({ url: '/packageGoods/pages/profile/profile' })
  },

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmColor: '#cf4444',
      success: (res) => {
        if (!res.confirm) return
        // token 与用户信息一起清，留着 user 会让续期逻辑拿着废数据空转
        clearAuth()
        this.setData({ logged: false, profile: null })
        wx.showToast({ title: '已退出登录', icon: 'none' })
      }
    })
  },

  onOrders() {
    if (!this.data.logged) {
      this.onLogin()
      return
    }
    wx.navigateTo({ url: '/packageGoods/pages/order/list/list' })
  },

  onAddress() {
    if (!this.data.logged) {
      this.onLogin()
      return
    }
    wx.navigateTo({ url: '/packageGoods/pages/address/list/list' })
  },

  // 收藏是本地数据，未登录也能看
  onCollect() {
    wx.navigateTo({ url: '/packageGoods/pages/collect/collect' })
  }
})
