// app.js
// 启动时只做「本地恢复」，不发请求；登录态以 storage 为准，globalData 只做内存缓存
App({
  globalData: {
    userInfo: null,
    navList: [],
    cartCount: 0,
    // switchTab 不支持 query，首页 -> 分类页用这个字段传「当前分类 id」
    pendingCategoryId: '',
  },

  onLaunch() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')

    if (token && userInfo) {
      this.globalData.userInfo = userInfo
    }
  },
})
