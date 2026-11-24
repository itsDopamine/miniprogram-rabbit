// app.js —— 小程序全局入口，整个小程序只执行一次 App()
App({
  /**
   * 全局数据：所有页面都能通过 getApp().globalData 读到
   * 注意：globalData 不是响应式的，改了它不会触发任何页面重新渲染
   */
  globalData: {
    token: '',      // 登录凭证，S5 接入后写入
    userInfo: null  // 当前会员信息，S5 接入后写入
  },

  /**
   * 生命周期：小程序冷启动时执行一次（热启动不执行）
   * 后续在这里做：恢复本地 token、检查登录态
   */
  onLaunch() {
    // S5 再填充
  }
})
